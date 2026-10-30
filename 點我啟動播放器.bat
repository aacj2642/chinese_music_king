@echo off
chcp 65001 >nul
title 國樂之王播放器
cd /d "%~dp0"

echo 正在啟動國樂之王本機伺服器...
python serve.py
if %errorlevel% neq 0 (
    echo.
    echo Python 啟動失敗，改用 python -m http.server 8000
    start "" "http://localhost:8000"
    python -m http.server 8000
    pause
)

