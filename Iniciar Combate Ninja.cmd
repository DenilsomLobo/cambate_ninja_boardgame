@echo off
setlocal
title Combate Ninja Board Game
cd /d "%~dp0"

where node.exe >nul 2>nul
if errorlevel 1 (
    echo Node.js nao foi encontrado.
    echo Instale o Node.js em https://nodejs.org e abra este arquivo novamente.
    pause
    exit /b 1
)

echo Iniciando Combate Ninja Board Game...
echo Mantenha esta janela aberta enquanto joga.
echo Para encerrar o servidor, pressione Ctrl+C.
echo.

set "PORT=0"
node.exe "scripts\serve.mjs" --open
if errorlevel 1 (
    echo.
    echo Nao foi possivel iniciar o jogo. Confira a mensagem acima.
    pause
    exit /b 1
)
endlocal
