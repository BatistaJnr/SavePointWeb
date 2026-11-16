@echo off
title SavePoint - Servidor PHP Local

echo ============================================================
echo           SavePoint - Gerenciador Gamer Academico
echo               Servidor Local PHP (Backend)
echo ============================================================
echo.

set "PHP_BIN=C:\xampp\php\php.exe"

if exist "%PHP_BIN%" goto :start_server

where php >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PHP_BIN=php"
    goto :start_server
)

echo [ERRO] O executavel do PHP nao foi encontrado em C:\xampp\php\php.exe
echo nem no PATH do sistema.
echo.
echo Por favor, certifique-se de que o XAMPP esta instalado.
echo.
pause
exit /b 1

:start_server
echo [OK] PHP detectado: %PHP_BIN%
echo.
echo Iniciando servidor local na porta 8000...
echo Acesse: http://localhost:8000/index.html
echo.
echo Dica: Pressione Ctrl + C para encerrar o servidor.
echo ============================================================
echo.

start http://localhost:8000/index.html
"%PHP_BIN%" -S localhost:8000