# Woi Phase C Hotfix (NEXT+) – Quick Start (Windows)

## 1) Backend
```powershell
cd C:\woi_phase_new_c_hotfix\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

Health checks:
```powershell
curl http://127.0.0.1:8000/kpi
curl http://127.0.0.1:8000/openbb/status
curl http://127.0.0.1:8000/pnl/status
curl http://127.0.0.1:8000/streak
curl http://127.0.0.1:8000/casino/status
```

## 2) Frontend
If `npm install` ever gets weird, clean properly in PowerShell (NOT cmd flags like `/s /q`):

```powershell
cd C:\woi_phase_new_c_hotfix\frontend
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm cache clean --force
npm install
npm start
```

## Notes
- Polymarket/Kalshi: **Poll** = polling interval (seconds) for refreshing markets/odds/status.
- Market Browser: UI uses `GET /prediction/markets` (mock list for now).
- Casino Lab: backend now exposes `/casino/status`, `/casino/start`, `/casino/simulate`, `/casino/coach` (safe sim + coach only).
- Strategies tab: custom strategies are stored in `localStorage` and do NOT block the built-in engine.
