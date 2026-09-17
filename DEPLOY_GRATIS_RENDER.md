# 🌐 Despliegue 100% Gratuito: juego.adrianweb.es con Render

Si solo tienes el dominio comprado en Hostinger y **no tienes contratado ningún hosting ni VPS**, puedes alojar el juego **completamente gratis** en **Render.com** y conectarle tu subdominio `juego.adrianweb.es` con certificado SSL HTTPS automático.

---

## 📋 Pasos para publicar el juego gratis

### Paso 1: Subir tu código a GitHub
1. Entra en [GitHub.com](https://github.com) e inicia sesión (o crea una cuenta si no tienes).
2. Crea un nuevo repositorio (hazlo público o privado, el que prefieras), por ejemplo llamado `pachin-rpg`. No inicialices con README ni .gitignore (ya los tenemos).
3. En la terminal de tu ordenador, ejecuta estos dos comandos para subir el proyecto:
   ```bash
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/pachin-rpg.git
   git push -u origin main
   ```

---

### Paso 2: Crear el servicio en Render.com (Gratis)
1. Ve a [Render.com](https://render.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **New +** > **Web Service**.
3. Selecciona **Build and deploy from a Git repository** y elige tu repositorio `pachin-rpg`.
4. Rellena los campos (la mayoría se detectan solos):
   - **Name**: `pachin-juego`
   - **Region**: Frankfurt (EU Central) *(o la más cercana a España)*
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Haz clic en **Deploy Web Service**.

En 2 minutos tu juego estará funcionando en una URL como `https://pachin-juego.onrender.com`.

---

### Paso 3: Conectar tu subdominio `juego.adrianweb.es`
1. En tu panel de Render, entra a tu servicio y en el menú lateral ve a **Settings** > **Custom Domains**.
2. Haz clic en **Add Custom Domain** y escribe:
   ```text
   juego.adrianweb.es
   ```
3. Render te mostrará las instrucciones de DNS para verificar el dominio. Te pedirá crear un registro **CNAME** que apunta a tu URL de Render (por ejemplo: `pachin-juego.onrender.com`).

---

### Paso 4: Añadir el registro CNAME en Hostinger
1. Ve a tu panel de **Hostinger** (hPanel).
2. Entra en **Dominios** > Selecciona **`adrianweb.es`** > **DNS / Servidores de nombres**.
3. Añade el siguiente registro:
   - **Tipo**: `CNAME`
   - **Nombre**: `juego`
   - **Objetivo / Apunta a**: `pachin-juego.onrender.com` *(el valor exacto que te dio Render)*
   - **TTL**: `300`
4. Haz clic en **Añadir registro**.

---

### 🎉 ¡Listo!
En pocos minutos Render verificará el registro y activará el **certificado SSL HTTPS gratuito**. Podrás entrar directamente a:
👉 **https://juego.adrianweb.es**
