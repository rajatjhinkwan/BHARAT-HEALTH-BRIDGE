# Start-OCR.ps1 - PowerShell script to start the Genocr OCR Server
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Starting Genocr OCR Server (Bharat Health Bridge)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ProjectRoot

# Check if the virtual environment exists
$VenvPython = Join-Path $ProjectRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    Write-Host "[ERROR] Virtual environment not found in .venv!" -ForegroundColor Red
    Write-Host "Please make sure you have created the virtual environment." -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    Exit
}

Write-Host "[INFO] Activating virtual environment..." -ForegroundColor Green
& .venv\Scripts\Activate.ps1

Write-Host "[INFO] Checking dependencies..." -ForegroundColor Green
& python machine-learning-model\check_env.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Some dependencies might be missing. Attempting to install requirements..." -ForegroundColor Yellow
    & pip install -r machine-learning-model\requirements.txt
}

Write-Host "[INFO] Starting FastAPI OCR Server on port 8000..." -ForegroundColor Green
Set-Location (Join-Path $ProjectRoot "machine-learning-model")
& python server.py
