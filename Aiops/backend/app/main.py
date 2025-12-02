from __future__ import annotations

import os
import re
from collections import Counter
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware

ENV_FILE = Path(__file__).resolve().parents[1] / ".env.local"
load_dotenv(dotenv_path=ENV_FILE)

REQUIRED_ENV = ("SERVICENOW_URL", "SERVICENOW_USER", "SERVICENOW_PASS")
AIOPS_REGEX = re.compile(
    r"(?:\bai[\s-]?ops\b|ai\s*agent|aiops\s*agent|ops\s*automation|automated\s*remediation|anomaly\s*detection|predictive\s*(?:alert|incident|ticket)|auto\s*remediat)",
    re.IGNORECASE,
)


def required_env(key: str) -> str:
    value = os.environ.get(key)
    if not value:
        raise RuntimeError(f"{key} must be defined in {ENV_FILE}")
    return value


app = FastAPI(title="Simple ServiceNow Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/incidents")
async def fetch_incidents(limit: int | None = None) -> Any:
    url = required_env("SERVICENOW_URL")
    auth = (required_env("SERVICENOW_USER"), required_env("SERVICENOW_PASS"))

    params = {}
    if limit is not None:
        params["sysparm_limit"] = str(limit)

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url, auth=auth, params=params)
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=exc.response.text or "ServiceNow returned an error",
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=502, detail="Failed to reach ServiceNow"
            ) from exc

    data = response.json()
    incidents = data.get("result", []) if isinstance(data, dict) else data
    if not isinstance(incidents, list):
        incidents = []
    total = len(incidents)

    def textify_field(value: Any) -> str:
        if value is None:
            return ""
        if isinstance(value, str):
            return value
        if isinstance(value, (int, float, bool)):
            return str(value)
        if isinstance(value, dict):
            return " ".join(
                str(part)
                for part in (
                    value.get("display_value") or value.get("displayValue"),
                    value.get("value"),
                )
                if part
            )
        return ""

    def is_aiops_related(incident: Any) -> bool:
        blob = " \n ".join(
            map(
                textify_field,
                [
                    incident.get("short_description"),
                    incident.get("description"),
                    incident.get("work_notes"),
                    incident.get("close_notes"),
                    incident.get("category"),
                    incident.get("subcategory"),
                    incident.get("u_tags"),
                    incident.get("u_aiops"),
                    incident.get("u_ai_category"),
                    incident.get("assignment_group"),
                ],
            )
        )
        return bool(AIOPS_REGEX.search(blob))

    def is_closed_by_agent(incident: Any) -> bool:
        close_notes = textify_field(incident.get("close_notes"))
        notify = textify_field(incident.get("notify"))
        return (
            "Closed by the AI Agent after Hotfix" in close_notes
            and notify == "1"
        )

    all_aiops = [inc for inc in incidents if is_aiops_related(inc)]
    closed_aiops = [inc for inc in all_aiops if is_closed_by_agent(inc)]
    active_aiops = [inc for inc in all_aiops if not is_closed_by_agent(inc)]

    total = len(closed_aiops)

    type_counter = Counter(
        textify_field(incident.get("u_ai_category") or incident.get("category") or "aiops incident")
        for incident in closed_aiops
    )

    return {
        "totalIncidents": total,
        "activeCount": len(active_aiops),
        "incidentTypes": [
            {"type": label, "count": count}
            for label, count in type_counter.items()
        ],
        "incidents": closed_aiops,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
