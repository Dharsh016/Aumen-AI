@echo off
echo ============================================
echo    LexiCore - AI Vocabulary Trainer Setup
echo ============================================

echo.
echo [1/6] Creating Python virtual environment...
if exist .venv (
    echo Virtual environment already exists, skipping creation...
) else (
    python -m venv .venv
)

echo.
echo [2/6] Installing Python dependencies...
call .venv\Scripts\activate
pip install -r requirements.txt

echo.
echo [3/6] Running database migrations...
alembic -c backend\alembic.ini upgrade head

echo.
echo [4/6] Loading seed data...
python -c "import sqlite3; conn=sqlite3.connect('lexicore.db'); f=open('seed_data.sql','r'); conn.executescript(f.read()); conn.commit(); conn.close(); print('Seed data loaded successfully')"

echo.
echo [5/6] Installing frontend dependencies...
cd frontend
npm install
cd ..

echo.
echo [6/6] Installing Python SDK...
cd srs_sdk
pip install -e .
cd ..

echo.
echo ============================================
echo    Setup Complete!
echo    Run runapplication.bat to start LexiCore
echo ============================================
pause