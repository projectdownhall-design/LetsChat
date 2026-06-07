@echo off
setlocal enabledelayedexpansion
title LetsChat – PostgreSQL Setup

echo.
echo  ===================================================
echo   LetsChat – Datenbank-Setup
echo  ===================================================
echo.

REM ── 1. Prüfe ob PostgreSQL installiert ist ──────────────────────────────
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [*] PostgreSQL nicht gefunden – installiere via winget...
    winget install PostgreSQL.PostgreSQL.16 --accept-package-agreements --accept-source-agreements
    if !ERRORLEVEL! NEQ 0 (
        echo [!] winget fehlgeschlagen. Bitte manuell installieren:
        echo     https://www.postgresql.org/download/windows/
        echo     Passwort fuer den postgres-Benutzer waehlen und merken!
        pause
        exit /b 1
    )
    echo [OK] PostgreSQL installiert.
    echo.
    echo WICHTIG: Bitte Windows neu starten oder die Umgebungsvariablen neu laden,
    echo          danach dieses Skript erneut ausfuehren.
    pause
    exit /b 0
)

echo [OK] PostgreSQL gefunden.
echo.

REM ── 2. Passwort abfragen ────────────────────────────────────────────────
set /p PG_PASS=PostgreSQL Passwort fuer Benutzer 'postgres' eingeben:
if "%PG_PASS%"=="" (
    echo [!] Kein Passwort eingegeben.
    pause
    exit /b 1
)

REM ── 3. Datenbank erstellen ───────────────────────────────────────────────
echo.
echo [*] Erstelle Datenbank 'letschat'...
set PGPASSWORD=%PG_PASS%
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE letschat ENCODING 'UTF8' LC_COLLATE 'de_DE.UTF-8' LC_CTYPE 'de_DE.UTF-8' TEMPLATE template0;" 2>nul
if !ERRORLEVEL! NEQ 0 (
    REM Versuche ohne locale (fallback)
    psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE letschat;" 2>nul
)
echo [OK] Datenbank bereit.

REM ── 4. .env aktualisieren ────────────────────────────────────────────────
echo.
echo [*] Aktualisiere .env...

set ENV_FILE=%~dp0..\.env

REM Ersetze Platzhalter
powershell -Command "(Get-Content '%ENV_FILE%') -replace 'dein_passwort', '%PG_PASS%' | Set-Content '%ENV_FILE%'"
powershell -Command "(Get-Content '%ENV_FILE%') -replace 'aendere-mich-zu-einem-langen-zufaelligen-geheimnis', ([System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))) | Set-Content '%ENV_FILE%'"
powershell -Command "(Get-Content '%ENV_FILE%') -replace 'aendere-mich-zu-einem-anderen-langen-geheimnis', ([System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))) | Set-Content '%ENV_FILE%'"

echo [OK] .env konfiguriert.

REM ── 5. Node-Server starten zum Schema-Test ───────────────────────────────
echo.
echo [*] Teste Datenbankverbindung und initialisiere Schema...
cd /d "%~dp0.."
node -e "require('dotenv').config(); const { Pool } = require('pg'); const p = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD }); p.query('SELECT 1').then(() => { console.log('[OK] Verbindung erfolgreich!'); process.exit(0); }).catch(e => { console.error('[!] Fehler:', e.message); process.exit(1); });"

if !ERRORLEVEL! NEQ 0 (
    echo.
    echo [!] Datenbankverbindung fehlgeschlagen.
    echo     Bitte pruefen:
    echo     - Laeuft PostgreSQL? (Dienste ^> postgresql-x64-16)
    echo     - Ist das Passwort korrekt?
    echo     - Ist Port 5432 frei?
    pause
    exit /b 1
)

echo.
echo  ===================================================
echo   Setup erfolgreich abgeschlossen!
echo  ===================================================
echo.
echo  Naechste Schritte:
echo   1. npm run dev       -- Entwicklung starten
echo   2. npm run build     -- Installer bauen
echo.
pause
