@echo off
echo ===================================================
echo   Starting Genocr OCR Server (Bharat Health Bridge)
echo ===================================================
echo.

:: Get the directory of the batch file
set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

:: Check if the virtual environment exists
if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found in .venv!
    echo Please make sure you have created the virtual environment.
    pause
    exit /b 1
)

echo [INFO] Activating virtual environment...
call .venv\Scripts\activate.bat

echo [INFO] Checking dependencies...
python machine-learning-model\check_env.py
if errorlevel 1 (
    echo [WARNING] Some dependencies might be missing. Attempting to install requirements...
    pip install -r machine-learning-model\requirements.txt
)

echo [INFO] Starting FastAPI OCR Server on port 8000...
cd machine-learning-model
python server.py

pause
