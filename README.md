# REsource Recovery

Prototipo educativo y gamificado de segregación de residuos creado por **Séptimo B de Innova Schools**. La experiencia enseña a separar materiales según los tachos de colores del Perú (NTP 900.058), incluye un juego de arrastrar y soltar con confeti, una trivia ambiental, logros, un contador de impacto y un ranking guardado en `localStorage`.

## Novedades del rediseño

- **Tipografía con jerarquía**: Poppins (display) + Inter (cuerpo) desde Google Fonts.
- **Modo oscuro** con interruptor en la cabecera (se recuerda en `localStorage`).
- **Barra de progreso del recorrido** (1 → 8) que avanza con la navegación.
- **Identidad cromática de tachos** según la norma peruana (marrón, blanco, azul, verde, amarillo, negro).
- **Juego de clasificación** con arrastrar y soltar (mouse y táctil), racha, bonus y confeti.
- **Trivia ambiental** de opción múltiple con puntaje.
- **Logros/medallas** desbloqueables (bronce, plata, oro y retos del juego).
- **Contador de impacto** estimado (botellas, agua y CO₂).
- **Microanimaciones**: aparición de secciones, puntos animados y efectos al pasar el cursor.

Todo funciona en GitHub Pages sin servidor (solo HTML/CSS/JS). El confeti está implementado a mano, sin librerías externas.

> Sugerencia de imágenes: el sitio usa emojis como íconos. Si generas un set de ilustraciones (mascota "RE", tachos de colores, residuos, medallas e infografía del ciclo), pídelas con un mismo estilo —"flat vector illustration, soft green palette, rounded shapes, friendly, educational, white background"— y reemplaza los emojis por `<img>` para mayor identidad visual.

## Uso local

No requiere instalación ni compilación. Desde PowerShell:

```bash
cd ruta/al/proyecto/resource-recovery
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
