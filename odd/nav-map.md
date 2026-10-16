# Mapa de navegación

Se completa durante la migración del design system (`odd/tasks/design-system-centralization.md`): cada pantalla migrada agrega sus salidas acá.

Qué registrar por pantalla: cada `router.push/replace/back/navigate`, `<Link href>`, `<Redirect>`, guards de `_layout`, y aperturas de modales o URLs externas.

Validación: el destino tiene que existir como ruta en `app/` (respetando grupos `(tabs)` y params `[id]`). Si no existe, o los params no coinciden → estado ❌ y fila en "Enlaces rotos".

Estados: ✅ ok · ❌ roto · ⚠️ dudoso (ruta dinámica armada con string, param opcional, destino condicional).

## Rutas existentes (`app/`)

_Se completa en la primera tarea de migración (T4) listando `app/`._

## Salidas por pantalla

| Pantalla (ruta) | Archivo | Disparador (UI) | Acción | Destino | Params | Estado |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |

## Enlaces rotos / dudosos

| Origen | Archivo:línea | Destino | Problema |
|---|---|---|---|
| — | — | — | — |

## Pantallas sin entrada

Rutas de `app/` a las que no llega ningún enlace (huérfanas).

_Se completa en T13 cruzando "Rutas existentes" con la columna "Destino"._
