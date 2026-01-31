@echo off
chcp 65001 >nul
echo ==========================================
echo  CONECTAR SERENVOICE A GITHUB
echo ==========================================
echo.
echo Conectando con: https://github.com/Kenny010604/SerenVoice-Analisi-de-Voz.git
echo.

git remote add origin https://github.com/Kenny010604/SerenVoice-Analisi-de-Voz.git
git push -u origin master

echo.
echo ==========================================
echo  ¡Listo! Ahora agrega al colaborador:
echo ==========================================
echo 1. Ve a: https://github.com/Kenny010604/SerenVoice-Analisi-de-Voz/settings/access
echo 2. Click "Add people"
echo 3. Agrega: john.montenegro.est@tecazuay.edu.ec
echo 4. Dale permisos de "Write" para que pueda editar
echo.
echo Presiona cualquier tecla para abrir GitHub...
pause >nul
start https://github.com/Kenny010604/SerenVoice-Analisi-de-Voz/settings/access
