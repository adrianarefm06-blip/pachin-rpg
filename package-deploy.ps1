$ErrorActionPreference = "Stop"

$destination = ".\juego-deploy.zip"
if (Test-Path $destination) { 
    Remove-Item $destination -Force
    Write-Host "Archivo zip anterior eliminado."
}

$staging = ".\staging_deploy"
if (Test-Path $staging) { 
    Remove-Item -Recurse -Force $staging 
}
New-Item -ItemType Directory -Path $staging | Out-Null

$items = @("index.html", "style.css", "game.js", "audio.js", "Personajes", "fondos", "objetos", "setup-vps.sh", "DEPLOY_VPS.md")

foreach ($item in $items) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination $staging -Recurse -Force
        Write-Host "Copiado: $item"
    }
}

# Copiar backend sin node_modules
New-Item -ItemType Directory -Path "$staging\server" | Out-Null
Copy-Item "server\index.js" "$staging\server\" -Force
Copy-Item "server\database.js" "$staging\server\" -Force
Copy-Item "server\package.json" "$staging\server\" -Force
Copy-Item "server\package-lock.json" "$staging\server\" -Force
if (Test-Path "server\.env") {
    Copy-Item "server\.env" "$staging\server\" -Force
}
if (Test-Path "server\game.db") {
    Copy-Item "server\game.db" "$staging\server\" -Force
}

Write-Host "Comprimiendo archivos en $destination..."
Compress-Archive -Path "$staging\*" -DestinationPath $destination -CompressionLevel Optimal

Remove-Item -Recurse -Force $staging
Write-Host "¡Paquete generado con exito! Archivo listo: $destination"
