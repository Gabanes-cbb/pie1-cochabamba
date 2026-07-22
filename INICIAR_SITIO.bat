@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:8765/"
  py -m http.server 8765 --bind 127.0.0.1
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:8765/"
  python -m http.server 8765 --bind 127.0.0.1
  goto :eof
)

echo No se encontro Python en esta computadora.
echo Instale Python 3 o consulte INSTRUCCIONES_OFFLINE.txt.
pause
