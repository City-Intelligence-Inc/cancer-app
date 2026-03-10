import csv
import io
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import boto3
import httpx
from boto3.dynamodb.conditions import Key
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Cancer Support Matcher")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TABLE_NAME = os.environ.get("TABLE_NAME", "Sessions")
SHEET_ID = os.environ.get("SHEET_ID", "1sEAYOOJfmmAU92wEQuUkezpiWJMo_grJb3W-1vJopoM")
SHEET_GID = os.environ.get("SHEET_GID", "0")

dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1"))
table = dynamodb.Table(TABLE_NAME)

SESSION_TTL_DAYS = 30


class SessionCreate(BaseModel):
    pass


class SessionUpdate(BaseModel):
    age: Optional[int] = None
    location: Optional[str] = None
    country: Optional[str] = None
    diagnosis: Optional[str] = None
    help_needed: Optional[List[str]] = None
    role: Optional[str] = None
    treatment_stage: Optional[str] = None


class MatchResultEntry(BaseModel):
    resourceId: str
    resourceName: str
    score: int
    reasons: List[Dict[str, Any]]


class RejectionEntry(BaseModel):
    resourceId: str
    resourceName: str
    rejectedBy: str
    detail: str


class MatchLogBody(BaseModel):
    timestamp: str
    answers: Dict[str, Any]
    totalResources: int
    matchedCount: int
    rejectedCount: int
    matches: List[MatchResultEntry]
    rejections: List[RejectionEntry]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/sessions", status_code=201)
def create_session(body: Optional[SessionCreate] = None):
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    expires_at = int((datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)).timestamp())

    item = {
        "sessionId": session_id,
        "createdAt": now,
        "updatedAt": now,
        "expiresAt": expires_at,
        "answers": {},
    }
    table.put_item(Item=item)
    return item


@app.get("/sessions/{session_id}")
def get_session(session_id: str):
    resp = table.query(
        KeyConditionExpression=Key("sessionId").eq(session_id),
        ScanIndexForward=False,
        Limit=1,
    )
    items = resp.get("Items", [])
    if not items:
        raise HTTPException(status_code=404, detail="Session not found")
    return items[0]


@app.put("/sessions/{session_id}")
def update_session(session_id: str, body: SessionUpdate):
    # Fetch existing session
    resp = table.query(
        KeyConditionExpression=Key("sessionId").eq(session_id),
        ScanIndexForward=False,
        Limit=1,
    )
    items = resp.get("Items", [])
    if not items:
        raise HTTPException(status_code=404, detail="Session not found")

    existing = items[0]
    now = datetime.now(timezone.utc).isoformat()

    answers = existing.get("answers", {})
    updates = body.model_dump(exclude_none=True)
    answers.update(updates)

    table.update_item(
        Key={"sessionId": session_id, "createdAt": existing["createdAt"]},
        UpdateExpression="SET answers = :a, updatedAt = :u",
        ExpressionAttributeValues={":a": answers, ":u": now},
    )

    existing["answers"] = answers
    existing["updatedAt"] = now
    return existing


@app.post("/sessions/{session_id}/match-log")
def save_match_log(session_id: str, body: MatchLogBody):
    """Store the full matching log on the session — every filter decision for every resource."""
    resp = table.query(
        KeyConditionExpression=Key("sessionId").eq(session_id),
        ScanIndexForward=False,
        Limit=1,
    )
    items = resp.get("Items", [])
    if not items:
        raise HTTPException(status_code=404, detail="Session not found")

    existing = items[0]
    now = datetime.now(timezone.utc).isoformat()

    match_log = body.model_dump()

    table.update_item(
        Key={"sessionId": session_id, "createdAt": existing["createdAt"]},
        UpdateExpression="SET matchLog = :m, updatedAt = :u",
        ExpressionAttributeValues={":m": match_log, ":u": now},
    )

    return {"status": "ok", "sessionId": session_id}


# City lookup keyed by resource ID — used until the sheet has a native "City" column
CITY_BY_ID: dict = {
    "1": "Diss",
    "2": "London",
    "3": "London",
    "4": "London",
    "5": "Edinburgh",
    "6": "Edinburgh",
    "7": "National",
    "8": "London",
    "9": "Online",
    "10": "Online",
    "11": "London",
    "12": "London",
    "13": "London",
    "14": "Solihull",
    "15": "London",
    "16": "National",
    "17": "London",
    "18": "London",
    "19": "London",
    "20": "London",
    "21": "National",
    "22": "Edinburgh",
    "23": "London",
}


@app.get("/sheet-data")
async def get_sheet_data():
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={SHEET_GID}"
    async with httpx.AsyncClient(follow_redirects=True) as client:
        resp = await client.get(url, timeout=15)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to fetch sheet")

    raw = list(csv.reader(io.StringIO(resp.text)))

    # Find the first data row: the row where the second non-empty cell is a small integer (the ID column)
    data_start = next(
        (i for i, row in enumerate(raw)
         if len(row) > 1 and row[1].strip().isdigit()),
        None,
    )
    if data_start is None or data_start == 0:
        raise HTTPException(status_code=502, detail="Could not detect sheet structure")

    headers = [c.strip() for c in raw[data_start - 1]]
    data_rows = raw[data_start:]

    has_city_col = "City" in headers
    if not has_city_col:
        headers = headers + ["City"]

    rows = []
    for row in data_rows:
        padded = row + [""] * (len(headers) - len(row))
        record = {headers[i]: padded[i] for i in range(len(headers))}
        if not any(v.strip() for v in record.values()):
            continue
        # Backfill City from lookup table if the sheet doesn't have it yet
        if not has_city_col:
            record["City"] = CITY_BY_ID.get(record.get("ID", ""), "")
        rows.append(record)

    return {"headers": headers, "rows": rows}
