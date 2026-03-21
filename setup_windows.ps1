# Woi's Assistant - one-time setup (Windows PowerShell)
# Run:  powershell -ExecutionPolicy Bypass -File .\setup_windows.ps1

$ErrorActionPreference = "Stop"

Write-Host "== Backend venv + deps ==" -ForegroundColor Cyan
Set-Location "$PSScriptRoot\backend"

if (!(Test-Path ".venv")) {
  python -m venv .venv
}
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

Write-Host "== Frontend deps ==" -ForegroundColor Cyan
Set-Location "$PSScriptRoot\frontend"
if (!(Test-Path "node_modules")) {
  npm install
}

Write-Host "`nDone. Next: run .\start_windows.ps1" -ForegroundColor Green
