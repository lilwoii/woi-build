# Start backend + frontend (Windows PowerShell)
# Run:  powershell -ExecutionPolicy Bypass -File .\start_windows.ps1
$ErrorActionPreference = "Stop"

Write-Host "Starting backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$PSScriptRoot\backend`"; .\.venv\Scripts\python.exe main.py" | Out-Null

Start-Sleep -Seconds 2

Write-Host "Starting frontend on http://localhost:3000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$PSScriptRoot\frontend`"; npm start" | Out-Null

Write-Host "`nIf you use Ollama: make sure Ollama is running and you pulled your model, e.g.:" -ForegroundColor Yellow
Write-Host "  ollama pull llama3.1" -ForegroundColor Yellow
