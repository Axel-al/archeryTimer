:: Récupérer le navigateur par défaut depuis le registre
for /f "tokens=2*" %%A in ('reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice" /v ProgId') do set DefaultBrowser=%%B

cd /d "%~dp0.."

set URL=http://localhost

if "%DefaultBrowser%" == "ChromeHTML" (
    :: Vérifier si c'est Chrome
    start "" "chrome" --start-fullscreen %URL%
) else if "%DefaultBrowser%" == "MSEdgeHTM" (
    :: Vérifier si c'est Edge
    start "" "msedge" --start-fullscreen %URL%
) else if "%DefaultBrowser%" == "FirefoxURL" (
    :: Vérifier si c'est Firefox
    start "" "firefox" --kiosk %URL%
) else  (
    :: Si rien ne fonctionne, utiliser le navigateur par défaut
    start "" %URL%
)

python -m http.server 80