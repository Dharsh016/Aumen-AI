@echo off
echo ============================================
echo    Starting LexiCore - AI Vocabulary Trainer
echo ============================================

echo.
echo [0/2] Clearing stale process on port 8001 (if any)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8001 ^| findstr LISTENING') do taskkill /F /PID %%a > nul 2>&1

echo.
echo [1/2] Starting backend API on port 8001...
start "LexiCore Backend" cmd /k "cd /d C:\Users\CARE\lexicore && .venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload --reload-dir backend"

echo.
echo Waiting for backend to initialize...
timeout /t 4 /nobreak > nul

echo.
echo [2/2] Starting frontend on port 3000...
start "LexiCore Frontend" cmd /k "cd /d C:\Users\CARE\lexicore\frontend && set PORT=3000 && set REACT_APP_API_BASE=http://127.0.0.1:8001 && npm start"

echo.
echo ============================================
echo    LexiCore is starting up!
echo.
echo    Backend API:  http://localhost:8001
echo    Frontend:     http://localhost:3000
echo    Swagger Docs: http://localhost:8001/docs
echo ============================================
pause