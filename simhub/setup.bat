@echo off
REM Kopierer preview-bilder fra Assetto Corsa content-mappen
REM og installerer dashboardet til SimHub

set AC_CONTENT=C:\Program Files (x86)\Steam\steamapps\common\assettocorsa\content
set SIMHUB_DASH=%USERPROFILE%\Documents\SimHub\DashTemplates\aCRacing

echo aCRacing SimHub Dashboard - Setup
echo ==================================
echo.

if not exist "%AC_CONTENT%" (
    echo FEIL: Finner ikke AC content-mappe:
    echo   %AC_CONTENT%
    echo Sjekk at Assetto Corsa er installert via Steam.
    pause
    exit /b 1
)

echo Oppretter dashboard-mappe...
mkdir "%SIMHUB_DASH%\img" 2>nul

echo Kopierer preview-bilder...
copy "%AC_CONTENT%\tracks\ks_nordschleife\preview.png" "%SIMHUB_DASH%\img\trackday.png" >nul
echo   [OK] Nordschleife
copy "%AC_CONTENT%\cars\ks_mazda_mx5_cup\skins\0_mazda_mx5_cup_race\preview.jpg" "%SIMHUB_DASH%\img\mx5cup.png" >nul
if not exist "%SIMHUB_DASH%\img\mx5cup.png" (
    copy "%AC_CONTENT%\cars\ks_mazda_mx5_cup\preview.png" "%SIMHUB_DASH%\img\mx5cup.png" >nul
)
echo   [OK] MX-5 Cup
copy "%AC_CONTENT%\cars\ks_mercedes_amg_gt3\skins\*_race\preview.jpg" "%SIMHUB_DASH%\img\gt3.png" >nul 2>nul
if not exist "%SIMHUB_DASH%\img\gt3.png" (
    copy "%AC_CONTENT%\cars\ks_mercedes_amg_gt3\preview.png" "%SIMHUB_DASH%\img\gt3.png" >nul
)
echo   [OK] GT3 (Mercedes AMG)

echo Kopierer dashboard...
copy "%~dp0dash.html" "%SIMHUB_DASH%\dash.html" >nul
echo   [OK] dash.html

echo.
echo Ferdig! Dashboardet er installert til:
echo   %SIMHUB_DASH%
echo.
echo Apne SimHub, ga til Dash Studio, og last inn "aCRacing".
pause
