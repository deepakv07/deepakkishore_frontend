@echo off
setlocal enabledelayedexpansion

TITLE SkillBuilder One-Click Launcher

echo ===================================================
echo   SkillBuilder App - One-Click Launcher
echo ===================================================
echo.

:: --- STEP 1: Check Prerequisites ---
echo [1/4] Checking prerequisites...

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed! Please install it from https://nodejs.org/
    pause
    exit /b
)

where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed! Please install it from https://www.python.org/
    pause
    exit /b
)

echo [OK] Node.js and Python found.
echo.

:: --- STEP 2: Install Dependencies (if needed) ---
echo [2/4] Verifying dependencies...

:: AI Engine
if not exist "ai\neural_quiz_engine\venv" (
    echo.
    echo Setting up Python Virtual Environment for AI...
    python -m venv ai\neural_quiz_engine\venv
    call ai\neural_quiz_engine\venv\Scripts\activate
    pip install -r ai\neural_quiz_engine\requirements.txt
    deactivate
)

:: Backend
if not exist "backend\node_modules" (
    echo Installing Backend dependencies...
    cd backend && npm install && cd ..
)

:: Frontend
if not exist "frontend\node_modules" (
    echo Installing Frontend dependencies...
    cd frontend && npm install && cd ..
)

echo [OK] Dependencies are ready.
echo.

:: --- STEP 3: Start Services ---
echo [3/4] Starting services...

:: Start AI Engine
echo Starting AI Engine on port 8000...
start "SkillBuilder AI Engine" cmd /c "call ai\neural_quiz_engine\venv\Scripts\activate && cd ai\neural_quiz_engine && python server.py"

:: Start Backend API
echo Starting Backend API on port 3000...
start "SkillBuilder Backend" cmd /c "cd backend && npm run dev"

:: Start Frontend
echo Starting Frontend on port 5173...
start "SkillBuilder Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo [4/4] Finalizing...
echo Services are starting in separate windows.
echo Please wait a few seconds for the servers to initialize.
echo.
echo Opening the web browser...
timeout /t 5 >nul
start http://localhost:5173

echo.
echo ===================================================
echo   Success! Keep this window open or close it.
echo   To stop the app, close the other 3 windows.
echo ===================================================
echo.
pause
