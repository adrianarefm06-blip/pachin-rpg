# 🚀 Guía de Despliegue en Hostinger VPS: juego.adrianweb.es

Esta guía te explica paso a paso cómo dejar funcionando el juego en tu subdominio **`juego.adrianweb.es`** en tu VPS de Hostinger.

---

## 📍 Paso 1: Configurar el Subdominio en el DNS de Hostinger

1. Entra a tu panel de **Hostinger** (hPanel).
2. Ve a la sección **Dominios** > Selecciona **`adrianweb.es`** > **DNS / Servidores de nombres**.
3. Añade un nuevo registro de tipo **A**:
   - **Tipo**: `A`
   - **Nombre**: `juego`
   - **Apunta a**: La dirección **IP de tu VPS** (la puedes ver en la sección *VPS* de tu panel de Hostinger, ej: `185.xxx.xxx.xxx`).
   - **TTL**: `300` o el valor por defecto.
4. Haz clic en **Añadir registro**.

---

## 📦 Paso 2: Generar y Subir el Archivo del Juego al VPS

El proyecto incluye un script en PowerShell para empaquetar el juego sin archivos innecesarios de Windows.

### 2.1 Generar el archivo `.zip`:
Abre PowerShell en tu ordenador y ejecuta:
```powershell
powershell -ExecutionPolicy Bypass -File .\package-deploy.ps1
```
*(Esto creará `juego-deploy.zip` en la carpeta del juego).*

### 2.2 Subir el archivo al VPS:
Puedes subir `juego-deploy.zip` de dos formas muy fáciles:
- **Opción A (Terminal con SCP)**:
  ```powershell
  scp .\juego-deploy.zip root@TU_IP_DEL_VPS:/root/
  ```
- **Opción B (FileZilla o WinSCP)**:
  Conéctate por SFTP a la IP de tu VPS con usuario `root` y tu contraseña, y arrastra `juego-deploy.zip` a `/root/`.

---

## ⚙️ Paso 3: Ejecutar la Instalación en el VPS (¡1 Solo Comando!)

1. Conéctate a tu VPS por SSH desde PowerShell o Terminal:
   ```bash
   ssh root@TU_IP_DEL_VPS
   ```
2. Descomprime el archivo en `/var/www/juego`:
   ```bash
   apt update && apt install -y unzip
   mkdir -p /var/www/juego
   unzip -o /root/juego-deploy.zip -d /var/www/juego/
   ```
3. Dale permisos de ejecución al script y ejecútalo:
   ```bash
   chmod +x /var/www/juego/setup-vps.sh
   /var/www/juego/setup-vps.sh
   ```

El script se encargará automáticamente de:
- Instalar Node.js 20 LTS, Nginx, Certbot y PM2.
- Instalar las dependencias de Node.js (`sqlite3`, `bcrypt`, etc.).
- Iniciar el servidor backend con PM2 (manteniéndolo activo 24/7 incluso si el VPS se reinicia).
- Configurar Nginx para que redirija las visitas de `juego.adrianweb.es` al juego.
- Activar el certificado SSL HTTPS gratuito de Let's Encrypt.

---

## 🔍 Comandos útiles en tu VPS

- **Ver el estado del juego**:
  ```bash
  pm2 status
  ```
- **Ver logs en tiempo real (visitas, logins, errores)**:
  ```bash
  pm2 logs juego-pachin
  ```
- **Reiniciar el juego tras un cambio**:
  ```bash
  pm2 restart juego-pachin
  ```

---

¡Listo! Una vez finalizado el script, abre tu navegador y entra a:
👉 **https://juego.adrianweb.es**
