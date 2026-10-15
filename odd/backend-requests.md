# Pedidos al backend

Registro de **lo que el frontend necesita que el backend construya o confirme**. Cada entrada describe el contrato propuesto (método, ruta, auth, campos, validaciones, respuesta, errores) y cómo se comporta la app mientras el endpoint no exista, para poder pasarla tal cual al equipo de backend.

Formato: una entrada por pedido, con ID `BRxx`. Estados: ⬜ pendiente de backend · 🟡 en desarrollo · ✅ desplegado y verificado desde la app.

Relacionado: `odd/ux-gaps.md` (huecos de UX que originan estos pedidos).

---

## BR01 — Subir/quitar portada de perfil

**Estado:** ⬜ pendiente de backend · **Origen:** G10 (`odd/ux-gaps.md`) · **Frontend:** implementado

### Contexto

`GET /users/me` ya devuelve `bannerUrl`, y `ProfileScreen` lo muestra (con un degradé de marca como respaldo), pero no existe forma de subir, cambiar ni quitar la portada. El frontend ya tiene la pantalla y el cliente listos contra el contrato de abajo.

### 1. Subir o reemplazar portada

- **Método y ruta:** `POST /users/me/banner`
- **Auth:** JWT (Bearer), usuario autenticado. Aplica a su propio perfil.
- **Content-Type:** `multipart/form-data`
- **Campos del request:**
  - `banner` (archivo, obligatorio)
- **Validaciones:**
  - Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`
  - Tamaño máximo: 5 MB
  - Proporción recomendada: 3:1 (la app recorta a 3:1 antes de enviar)
- **Procesamiento:** el servidor redimensiona a ~1500×500 y **reemplaza** la portada anterior (borrando el archivo previo).
- **Respuesta 200/201:**
  ```json
  { "bannerUrl": "https://..." }
  ```
  (Con el envelope habitual `{ success, timestamp, data }` el cliente ya desenvuelve `data`.)
- **Errores:**
  - `400` archivo ausente o inválido
  - `401` sin sesión
  - `413` archivo demasiado grande
  - `415` tipo de archivo no soportado

### 2. Quitar portada

- **Método y ruta:** `DELETE /users/me/banner`
- **Auth:** JWT (Bearer)
- **Efecto:** deja `bannerUrl = null` y elimina el archivo almacenado.
- **Respuesta:** `200 { "bannerUrl": null }` o `204` sin cuerpo (el cliente acepta ambas).
- **Errores:** `401` sin sesión. Si no hay portada, debería ser idempotente (200/204).

### 3. Lectura

- `GET /users/me` ya devuelve `bannerUrl` (string o `null`/ausente). Sin cambios.

### Notas

- El cliente no valida el tipo real del archivo: la validación definitiva debe estar en el servidor.
- El cliente envía siempre el archivo recortado y comprimido (calidad 0.8), con nombre `banner.jpg` y tipo `image/jpeg`.
- Se agradece confirmar si `bannerUrl` pasa por CDN con cache; el cliente refresca el perfil tras subir, pero un cambio de URL en cada subida evita imágenes viejas en cache.

### Estado del frontend

- Implementado y testeado contra el contrato propuesto.
- Archivos:
  - `src/features/profile/services/profile.ts` — `uploadBanner`, `removeBanner`
  - `src/hooks/queries/useProfileQuery.ts` — `useUploadBanner`, `useRemoveBanner` (actualizan y refrescan el perfil)
  - `src/features/profile/utils/bannerErrors.ts` — mapeo de errores a mensajes
  - `src/features/users/screens/EditProfileScreen.tsx` — sección "Portada" (vista previa 3:1, "Cambiar portada", "Quitar" con confirmación)
  - `__tests__/profileBanner.test.ts`, `__tests__/profile.test.tsx`
- **Comportamiento hasta que se despliegue:** si el servidor responde `404`, `405` o `501`, la app muestra "La portada todavía no está disponible." y no cambia nada. `413` muestra un mensaje de tamaño (máx. 5 MB); `400`/`415`, un mensaje de formato; cualquier otro error, el mensaje genérico. Nunca falla ni se cierra.
- **Al desplegar:** no hace falta tocar el frontend. Verificar subida, reemplazo y quitado desde la app y pasar este pedido a ✅.
