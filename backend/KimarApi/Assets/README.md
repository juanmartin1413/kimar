# Logo de los comprobantes

`kimar-logo.jpg` es la versión JPEG del recurso existente `web/public/logoLangoBackground.png`, usado por el login de acceso interno. Conserva sus dimensiones de 1024 × 1024. El generador PDF lo incorpora como recurso de la aplicación y aplica un recorte circular al dibujarlo, igual que el login.

Se incluye dentro del proyecto backend porque Railway construye con `backend/KimarApi` como contexto Docker. La emisión no requiere red para descargar el logo, fuentes instaladas ni bibliotecas gráficas del sistema operativo.
