import csv
import io
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

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
    diagnosis: Optional[str] = None
    help_needed: Optional[List[str]] = None


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

    rows = []
    for row in data_rows:
        padded = row + [""] * (len(headers) - len(row))
        record = {headers[i]: padded[i] for i in range(len(headers))}
        if any(v.strip() for v in record.values()):
            rows.append(record)

    return {"headers": headers, "rows": rows}
