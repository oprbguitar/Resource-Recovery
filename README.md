# REsource Recovery

Prototipo educativo y gamificado de segregación de residuos creado por **Séptimo B de Innova Schools**. La experiencia enseña a separar materiales, simula la validación de acciones, suma puntos y actualiza un ranking guardado en `localStorage`.

## Uso local

No requiere instalación ni compilación. Desde PowerShell:

```bash
cd "C:\Users\oprbg\Documents\Proyectos Codex\resource recovery"
python -m http.server 5500
```

Luego abre `http://localhost:5500`.

## Estructura

- `index.html`: contenido y estructura accesible de las siete secciones.
- `styles.css`: diseño responsivo, animaciones y paneles internos.
- `script.js`: navegación, estado, puntos, validación y ranking.
- `assets/`: ilustración local usada por la portada.
- `.nojekyll`: compatibilidad con GitHub Pages.

## Publicar en GitHub

```bash
git init
git remote add origin https://github.com/oprbguitar/Resource-Recovery.git
git add .
git commit -m "Initial REsource Recovery prototype"
git branch -M main
git push -u origin main
```

En GitHub abre **Settings → Pages** y configura:

- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/(root)**

URL esperada: `https://oprbguitar.github.io/Resource-Recovery/`

## Notas del prototipo

- No utiliza backend, frameworks ni API externas.
- QR y cámara son simulaciones educativas; el sitio no solicita permisos del dispositivo.
- Los puntos se conservan en el navegador mediante `localStorage`.
- La página evita el desplazamiento global; el contenido adicional se desplaza dentro del panel activo.
