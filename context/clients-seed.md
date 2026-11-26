# Clientes iniciales

Fuente vigente: `Kimar - Bases de datos - Clientes.csv`, recibido el 26/11/2026.
La planilla reemplaza completamente la cartera inicial anterior.

- Luciano: 27 clientes.
- Marcos: 24 clientes.
- Manolo: 12 clientes.
- Total: 63 clientes, sin clientes adicionales de listas anteriores.

Los datos completos están en `backend/KimarApi/Data/Seed/clientes-2026-11-26.json`,
un recurso embebido que carga `ClientesSeed.GetAll` al inicializar una base vacía.
`backend/scripts/PrepararClientes.ps1 -Csv <ruta>` permite regenerar ese recurso
con el CSV original (UTF-8, incluyendo celdas multilínea).

Se conservan los nombres de la planilla; se recortan espacios externos y se
interpretan celdas vacías y guiones como datos no informados. La provincia se
normaliza quitando su punto final para coincidir con el selector del sistema.
No se corrigen geográficamente los datos ni se inventan valores faltantes.

La dirección se separa en Calle, Altura y CodigoPostal. Las alturas compuestas
(como 475/485) se conservan. Locales, kilómetros y referencias permanecen en
Calle, sin interpretarlos como alturas. DireccionOriginal en el recurso conserva
el texto fuente para revisar la separación; no es un campo de la base de datos.

El seed se aplica únicamente sobre una base vacía. Para recrear el entorno de
prueba de Railway, seguir `backend/RAILWAY.md`; actualizar el código sobre una
base poblada no reemplaza ni elimina sus clientes existentes.