# Backend FastAPI service

1. Install dependencies: `pip install -r requirements.txt`
2. Confirm `backend/.env.local` contains `SERVICENOW_URL`, `SERVICENOW_USER`, and `SERVICENOW_PASS`.
3. Run `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`.
4. Fetch incidents via `curl http://localhost:8000/incidents` (add `?limit=100` if you need to cap the results); the JSON now includes `totalIncidents`, `activeCount`, a breakdown of `incidentTypes` (e.g., `aiops incident: 200`), and the raw `incidents` list that are flagged as “Closed by the AI Agent after Hotfix” with `notify=1`.
