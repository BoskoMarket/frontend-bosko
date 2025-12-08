# Bosko Search & Perfil - Diseño de Alto Nivel

```
┌─────────────── UI Reutilizable ───────────────┐
│ SearchBar · SearchResultsList · ServiceCard  │
│ Gallery · KeywordChips · SettingsButton ·    │
│ ServiceForm                                   │
└────────────────────────────▲──────────────────┘
                             │ props/controladas
┌────────────────────────────┴──────────────────┐
│                Features / Vistas              │
│ SearchPage · ProfilePage · ProfileDetailPage │
│ SettingsPage                                  │
└────────────────────────────▲──────────────────┘
                             │ hooks (`useBoskoData`)
┌────────────────────────────┴──────────────────┐
│         Estado Compartido (Context)          │
│ BoskoDataProvider + selectores:              │
│  - `useSearchState` (query, status, results) │
│  - `useCurrentUser` (user CRUD)              │
│  - `useServiceManager` (CRUD único servicio) │
│  - `useProfile(id)` (vista pública)          │
└────────────────────────────▲──────────────────┘
                             │ API abstracta
┌────────────────────────────┴──────────────────┐
│              API Client (stub)               │
│ `api.searchServices`, `api.getUser(id)` etc  │
│ delegan a Repository                         │
└────────────────────────────▲──────────────────┘
                             │ implementaciones
┌────────────────────────────┴──────────────────┐
│     Capa de Datos (Repository Interface)      │
│ `InMemoryRepository` -> arreglos mutables     │
│ Listo para swap por `HttpRepository` futuro   │
└───────────────────────────────────────────────┘
```

## Flujo de búsqueda incremental
1. `SearchPage` mantiene `inputValue` controlado y usa `useDebouncedValue(275ms)`.
2. Al cambiar el valor desacoplado, llama `useSearchState().runSearch(query)`.
3. `BoskoDataContext` delega en `api.searchEntities` que consulta el `Repository`.
4. Los resultados se rankean por coincidencia (nombre usuario > servicio > keyword) y se
   muestran en `SearchResultsList`. Seleccionar un resultado navega a `/profile/:id`.

## Gestión de perfil y servicio único
- `ProfilePage` siempre representa al usuario autenticado (mock `currentUserId`).
- Muestra `ServiceCard` con galería, precio, zona, disponibilidad, rating simulado y
  keywords. Si no existe servicio, presenta CTA para crearlo.
- `ServiceForm` maneja crear/editar; `deleteService` disponible cuando hay servicio.
- Datos persisten en `BoskoDataContext` vía `api.createOrUpdateService` y `api.deleteService`.

## Settings
- `SettingsPage` expone formulario (nombre, avatar URL, bio) del usuario actual.
- Es accesible desde la pestaña Perfil mediante `SettingsButton` en el encabezado.
- Editar perfil ya no se permite dentro de `ProfilePage`.

## Navegación
- Nuevas rutas Expo Router:
  - `/search` → `SearchPage` en pestaña dedicada.
  - `/settings` → `SettingsPage`.
  - `/profile/[id]` → `ProfileDetailPage` (vista pública solo lectura).
  - `/profile` (pestaña) → `ProfilePage` para CRUD del servicio propio.

## Accesibilidad e i18n
- Componentes clave aceptan `accessibilityLabel` y roles apropiados.
- `t()` centralizado en `src/shared/i18n/strings.ts`.

## Tests
- Unit tests (`Jest`) cubren ranking + CRUD (repositorio y store).
- Prueba E2E (`Playwright`) monta la UI Expo Web minimal embebida y valida búsqueda y CRUD
  mediante interacciones sintéticas (sin backend real).
