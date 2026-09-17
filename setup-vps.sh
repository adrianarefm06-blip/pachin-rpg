#!/bin/bash
# ===============================================================
# Script de Despliegue Automático para Pachin RPG en Hostinger VPS
# Dominio: juego.adrianweb.es
# ===============================================================

set -e

echo "=== 1. Actualizando paquetes del sistema ==="
sudo apt-get update && sudo apt-get upgrade -y

echo "=== 2. Instalando Node.js 20 LTS, Nginx, UFW y Certbot ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx build-essential unzip

echo "=== 3. Instalando PM2 globalmente ==="
sudo npm install -g pm2

echo "=== 4. Configurando directorio de la aplicación ==="
sudo mkdir -p /var/www/juego
sudo chown -R $USER:$USER /var/www/juego

echo "=== 5. Instalando dependencias de Node.js ==="
cd /var/www/juego/server
npm install

echo "=== 6. Iniciando aplicación con PM2 ==="
pm2 delete juego-pachin 2>/dev/null || true
pm2 start index.js --name "juego-pachin"
pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true

echo "=== 7. Configurando Nginx para juego.adrianweb.es ==="
sudo tee /etc/nginx/sites-available/juego.adrianweb.es > /dev/null << 'EOF'
server {
    listen 80;
    server_name juego.adrianweb.es;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/juego.adrianweb.es /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
sudo nginx -t
sudo systemctl restart nginx

echo "=== 8. Obteniendo certificado SSL HTTPS (Let's Encrypt) ==="
sudo certbot --nginx -d juego.adrianweb.es --non-interactive --agree-tos -m admin@adrianweb.es --redirect || echo "AVISO: Certbot no pudo completar el SSL de inmediato. Asegúrate de que el registro DNS A de 'juego' apunte a la IP de este VPS en Hostinger y luego ejecuta: sudo certbot --nginx -d juego.adrianweb.es"

echo "==============================================================="
echo " ¡Despliegue completado! Visita: https://juego.adrianweb.es"
echo "==============================================================="
