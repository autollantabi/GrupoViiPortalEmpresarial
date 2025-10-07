# 🚀 Proyecto en Vite + React

Este proyecto es una aplicación web desarrollada con **Vite + React**. La aplicación está optimizada para un rendimiento rápido en desarrollo y producción.

## 📦 Instalación y configuración

### 🔹 **1. Clonar el repositorio**
```bash
git clone https://github.com/tuusuario/tuprojecto.git
cd tuprojecto
```

### 🔹 **2. Instalar dependencias**
Ejecuta el siguiente comando para instalar todas las dependencias necesarias:

```bash
npm install
```

### 🔹 **3. Configurar variables de entorno**
Crea un archivo **`.env`** en la raíz del proyecto y agrega las siguientes variables:

```env
VITE_ENV=development
VITE_DEVELOPMENT_URL=http://localhost:5000
VITE_PRODUCTION_URL=https://miapi.com
VITE_DEVELOPMENT_URL_NEW=http://localhost:5001
VITE_PRODUCTION_URL_NEW=https://miapi.com/new
```

---

## 📌 **Ejecutar el proyecto**

### 🚀 **Modo Desarrollo**
```bash
npm run dev
```
Luego, abre **http://localhost:3000** en tu navegador.

### 🏗️ **Construcción para producción**
```bash
npm run build
```
Esto generará una carpeta **`dist/`** con los archivos listos para desplegar en producción.

### 🌎 **Previsualizar producción**
```bash
npm run preview
```

---

## 🛠 **Estructura del Proyecto**
```
📂 src
 ┣ 📂 assets               # Archivos estáticos (imágenes, estilos, fuentes, etc.)
 ┃ ┣ 📂 images             # Imágenes del proyecto
 ┃ ┣ 📂 fonts              # Fuentes personalizadas
 ┃ ┗ 📜 global.css         # Estilos globales
 ┃
 ┣ 📂 components           # Componentes reutilizables
 ┃ ┣ 📂 UI                 # Botones, tarjetas, inputs, modales, etc.
 ┃ ┣ 📂 layout             # Header, Sidebar, Footer, etc.
 ┃ ┗ 📜 index.js           # Exporta todos los componentes
 ┃
 ┣ 📂 pages                # Páginas principales
 ┃ ┣ 📂 Home               # Página de inicio
 ┃ ┣ 📂 Dashboard          # Dashboard de usuarios
 ┃ ┗ 📂 Auth               # Login, Registro, Recuperación de contraseña
 ┃
 ┣ 📂 hooks                # Hooks personalizados
 ┃ ┣ 📜 useAuth.js         # Hook de autenticación
 ┃ ┣ 📜 useFetch.js        # Hook para peticiones HTTP
 ┃ ┗ 📜 useTheme.js        # Hook para gestionar temas
 ┃
 ┣ 📂 context              # Context API para manejar estado global
 ┃ ┣ 📜 AuthContext.jsx    # Contexto de autenticación
 ┃ ┗ 📜 ThemeContext.jsx   # Contexto para temas
 ┃
 ┣ 📂 config               # Configuración global del proyecto
 ┃ ┣ 📜 routes.js          # Definición de rutas de React Router
 ┃ ┗ 📜 constants.js       # Constantes generales
 ┃
 ┣ 📂 services             # Llamadas a APIs y lógica de negocio
 ┃ ┣ 📜 authService.js     # Autenticación con API
 ┃ ┣ 📜 userService.js     # Manejo de usuarios
 ┃ ┗ 📜 productService.js  # API de productos
 ┃
 ┣ 📂 utils                # Funciones de utilidad
 ┃ ┣ 📜 formatDate.js      # Formateo de fechas
 ┃ ┣ 📜 helpers.js         # Funciones genéricas
 ┃ ┗ 📜 validations.js     # Validaciones de formularios
 ┃
 ┣ 📂 router               # Configuración de React Router
 ┃ ┣ 📜 AppRouter.jsx      # Rutas principales
 ┃ ┗ 📜 ProtectedRoute.jsx # Ruta protegida
 ┃
 ┣ 📜 App.jsx              # Componente principal de la app
 ┣ 📜 main.jsx             # Punto de entrada de React
 ┗ 📜 index.css            # Estilos globales
```

---

## 🔥 **Dependencias principales**
- ⚛️ **React** - Librería principal
- ⚡ **Vite** - Empaquetador ultra rápido
- 🎨 **React Router** - Manejo de rutas en la aplicación
- 📦 **Axios** - Cliente HTTP para consumo de APIs

---

## 🚀 **Despliegue**
Para desplegar en **Vercel, Netlify o cualquier hosting**, usa:
```bash
npm run build
```
Luego, sube la carpeta `dist/` al hosting de tu elección.

---

## 👨‍💻 **Colaboradores**
- 🧑‍💻 **[Diego](https://github.com/BrujoFurioso22)** - Desarrollador FrontEnd

---

¡Gracias por visitar el proyecto! ⭐ **Si te gusta, dale una estrella al repositorio en GitHub.** 😊

