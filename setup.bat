@echo off
REM ===========================================
REM MockForge Setup Script for Windows
REM ===========================================
REM Run: setup.bat

echo MockForge Setup Script
echo ========================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js detected
node -v

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo npm is not installed
    pause
    exit /b 1
)

echo npm detected
npm -v
echo.

REM Install frontend dependencies
echo Installing frontend dependencies...
call npm install
echo Frontend dependencies installed
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
cd ..
echo Backend dependencies installed
echo.

REM Setup environment files
echo Setting up environment files...

if not exist .env (
    copy .env.example .env >nul
    echo Created .env file
    echo Please edit .env and add your VITE_API_URL
) else (
    echo .env file already exists
)

if not exist backend\.env (
    copy backend\.env.example backend\.env >nul
    echo Created backend\.env file
    echo Please edit backend\.env and add:
    echo    - MONGODB_URI (from MongoDB Atlas)
    echo    - JWT_SECRET (generate strong random string)
    echo    - SMTP_USER (your Gmail)
    echo    - SMTP_PASS (Google App Password)
    echo    - FRONTEND_URL (your frontend URL)
) else (
    echo backend\.env file already exists
)

echo.
echo Next Steps:
echo ==============
echo.
echo 1. Setup MongoDB Atlas:
echo    - Go to https://www.mongodb.com/cloud/atlas
echo    - Create free cluster
echo    - Get connection string
echo    - Add to backend\.env as MONGODB_URI
echo.
echo 2. Setup Google SMTP:
echo    - Enable 2FA on your Google account
echo    - Generate App Password
echo    - Add to backend\.env as SMTP_USER and SMTP_PASS
echo.
echo 3. Start development servers:
echo.
echo    Terminal 1 (Backend):
echo    cd backend ^&^& npm run dev
echo.
echo    Terminal 2 (Frontend):
echo    npm run dev
echo.
echo 4. Visit http://localhost:5173
echo.
echo For detailed instructions, see DEPLOYMENT.md
echo.
echo Setup complete!
pause
