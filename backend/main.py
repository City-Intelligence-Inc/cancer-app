import csv
import io
import os
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
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
RESOURCES_TABLE_NAME = os.environ.get("RESOURCES_TABLE_NAME", "Resources")
SHEET_ID = os.environ.get("SHEET_ID", "1sEAYOOJfmmAU92wEQuUkezpiWJMo_grJb3W-1vJopoM")
SHEET_GID = os.environ.get("SHEET_GID", "0")

dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1"))
table = dynamodb.Table(TABLE_NAME)
resources_table = dynamodb.Table(RESOURCES_TABLE_NAME)

SESSION_TTL_DAYS = 30


class SessionCreate(BaseModel):
    pass


class SessionUpdate(BaseModel):
    age: Optional[int] = None
    location: Optional[str] = None
    country: Optional[str] = None
    zipcode: Optional[str] = None
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


# ── Sessions ──────────────────────────────────────────────────────────

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
    """Store the full matching log on the session."""
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


# ── Sheet data ────────────────────────────────────────────────────────

CITY_BY_ID: dict = {
    "1": "Diss", "2": "London", "3": "London", "4": "London",
    "5": "Edinburgh", "6": "Edinburgh", "7": "National", "8": "London",
    "9": "Online", "10": "Online", "11": "London", "12": "London",
    "13": "London", "14": "Solihull", "15": "London", "16": "National",
    "17": "London", "18": "London", "19": "London", "20": "London",
    "21": "National", "22": "Edinburgh", "23": "London",
}


async def _fetch_sheet_rows() -> tuple[list[str], list[dict[str, str]]]:
    """Fetch and parse the Google Sheet, returning (headers, rows)."""
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={SHEET_GID}"
    async with httpx.AsyncClient(follow_redirects=True) as client:
        resp = await client.get(url, timeout=15)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to fetch sheet")

    raw = list(csv.reader(io.StringIO(resp.text)))

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
        if not has_city_col:
            record["City"] = CITY_BY_ID.get(record.get("ID", ""), "")
        rows.append(record)

    return headers, rows


@app.get("/sheet-data")
async def get_sheet_data():
    headers, rows = await _fetch_sheet_rows()
    return {"headers": headers, "rows": rows}


# ── Resources sync (Sheet ↔ DynamoDB) ─────────────────────────────────

def _safe_int(val: str) -> Optional[int]:
    try:
        return int(val)
    except (ValueError, TypeError):
        return None


def _sheet_row_to_resource(row: dict[str, str]) -> dict[str, Any]:
    """Convert a raw sheet row into a DynamoDB resource item."""
    row_id = row.get("ID", "").strip()
    if not row_id:
        return {}

    cats = [
        row.get("Primary Category", ""),
        row.get("Secondary Category", ""),
        row.get("Additional Category 1", ""),
        row.get("Additional Category 2", ""),
    ]
    help_types = list({c.strip() for c in cats if c.strip()})

    cancer_raw = [s.strip() for s in (row.get("Cancer Type", "") or "").split(";") if s.strip()]

    countries = [s.strip() for s in (row.get("Countries Available", "") or "").split(";") if s.strip()]
    cities = [s.strip() for s in (row.get("Cities Available", "") or "").split(";") if s.strip()]

    min_age = _safe_int(row.get("Min Age", ""))
    max_age = _safe_int(row.get("Max Age", ""))

    return {
        "resourceId": row_id,
        "name": row.get("Resource Name", "Unknown").strip(),
        "description": (row.get("Description", "") or row.get("Notes", "")).strip(),
        "helpTypes": help_types,
        "cancerTypes": cancer_raw,
        "entireCountry": row.get("Entire Country?", "").strip() == "Yes",
        "countries": countries,
        "cities": cities,
        "minAge": Decimal(str(min_age)) if min_age is not None else None,
        "maxAge": Decimal(str(max_age)) if max_age is not None else None,
        "patientCarer": row.get("Patient / Carer / Both", "Both").strip() or "Both",
        "treatmentStage": row.get("Treatment Stage", "All").strip() or "All",
        "websiteUrl": row.get("Website URL", "").strip(),
        "contact": row.get("Contact / Referral Link", "").strip(),
        "sheetRow": {k: v for k, v in row.items() if v},  # full raw row for audit
        "syncedAt": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/sync-resources")
async def sync_resources():
    """Pull every row from the Google Sheet and upsert into the Resources DynamoDB table."""
    _, rows = await _fetch_sheet_rows()

    synced = 0
    skipped = 0
    for row in rows:
        item = _sheet_row_to_resource(row)
        if not item or not item.get("resourceId"):
            skipped += 1
            continue
        # Remove None values (DynamoDB doesn't accept None)
        clean = {k: v for k, v in item.items() if v is not None}
        resources_table.put_item(Item=clean)
        synced += 1

    return {
        "status": "ok",
        "synced": synced,
        "skipped": skipped,
        "syncedAt": datetime.now(timezone.utc).isoformat(),
    }


class CreateResource(BaseModel):
    name: str
    description: str
    helpTypes: List[str]
    cancerTypes: List[str] = ["All"]
    entireCountry: bool = False
    countries: List[str] = []
    cities: List[str] = []
    zipcodes: List[str] = []
    minAge: Optional[int] = None
    maxAge: Optional[int] = None
    patientCarer: str = "Both"
    treatmentStage: str = "All"
    websiteUrl: str = ""
    contact: str = ""


@app.get("/resources")
def get_resources():
    """Return all resources from DynamoDB."""
    result = resources_table.scan()
    items = result.get("Items", [])
    while "LastEvaluatedKey" in result:
        result = resources_table.scan(ExclusiveStartKey=result["LastEvaluatedKey"])
        items.extend(result.get("Items", []))
    return {"resources": items, "count": len(items)}


@app.post("/resources", status_code=201)
def create_resource(body: CreateResource):
    """Add a new resource directly to DynamoDB."""
    # Auto-increment ID: find max existing ID
    all_items = resources_table.scan(ProjectionExpression="resourceId")
    all_ids = [int(i["resourceId"]) for i in all_items.get("Items", []) if i["resourceId"].isdigit()]
    next_id = str(max(all_ids) + 1) if all_ids else "1"

    item: dict[str, Any] = {
        "resourceId": next_id,
        "name": body.name,
        "description": body.description,
        "helpTypes": body.helpTypes,
        "cancerTypes": body.cancerTypes,
        "entireCountry": body.entireCountry,
        "countries": body.countries,
        "cities": body.cities,
        "zipcodes": body.zipcodes,
        "patientCarer": body.patientCarer,
        "treatmentStage": body.treatmentStage,
        "websiteUrl": body.websiteUrl,
        "contact": body.contact,
        "syncedAt": datetime.now(timezone.utc).isoformat(),
        "source": "manual",
    }
    if body.minAge is not None:
        item["minAge"] = Decimal(str(body.minAge))
    if body.maxAge is not None:
        item["maxAge"] = Decimal(str(body.maxAge))

    resources_table.put_item(Item=item)
    return {"status": "ok", "resourceId": next_id, "resource": item}


@app.delete("/resources/{resource_id}")
async def delete_resource(resource_id: str):
    """Delete a resource by ID."""
    resources_table.delete_item(Key={"resourceId": resource_id})
    return {"status": "ok", "deleted": resource_id}


@app.get("/sync-status")
async def sync_status():
    """Compare sheet rows vs DynamoDB resources for a live diff view."""
    _, sheet_rows = await _fetch_sheet_rows()
    sheet_ids = {r.get("ID", "").strip() for r in sheet_rows if r.get("ID", "").strip()}

    db_result = resources_table.scan(ProjectionExpression="resourceId, syncedAt")
    db_items = db_result.get("Items", [])
    while "LastEvaluatedKey" in db_result:
        db_result = resources_table.scan(
            ExclusiveStartKey=db_result["LastEvaluatedKey"],
            ProjectionExpression="resourceId, syncedAt",
        )
        db_items.extend(db_result.get("Items", []))

    db_ids = {item["resourceId"] for item in db_items}
    db_synced_at = {item["resourceId"]: item.get("syncedAt", "") for item in db_items}

    in_sheet_only = sorted(sheet_ids - db_ids)
    in_db_only = sorted(db_ids - sheet_ids)
    in_both = sorted(sheet_ids & db_ids)

    return {
        "sheetCount": len(sheet_ids),
        "dbCount": len(db_ids),
        "inSync": len(in_both),
        "inSheetOnly": in_sheet_only,
        "inDbOnly": in_db_only,
        "lastSynced": max(db_synced_at.values()) if db_synced_at else None,
    }
