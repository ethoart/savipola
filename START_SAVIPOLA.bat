@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 launch_local.py
) else (
  where python >nul 2>nul
  if errorlevel 1 (
    echo Python was not found. Install Python 3.10 or newer, then run this file again.
    pause
    exit /b 1
  )
  python launch_local.py
)
if errorlevel 1 (
  echo.
  echo SaviPola could not start. Read the error above.
  pause
)
endlocal
