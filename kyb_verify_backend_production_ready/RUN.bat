@echo off
setlocal
title KYB Verify Backend
cd /d "%~dp0"
echo ==========================================
echo          KYB VERIFY BACKEND
echo ==========================================
if not exist "venv\Scripts\python.exe" (
  py -m venv venv
  if errorlevel 1 python -m venv venv
  if errorlevel 1 goto ERROR
)
venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto ERROR
echo.
echo API:  http://127.0.0.1:8000
echo DOCS: http://127.0.0.1:8000/docs
echo.
venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
goto END
:ERROR
echo Setup failed.
pause
:END
