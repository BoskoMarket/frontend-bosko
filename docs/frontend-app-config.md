# Bosko — Configuración de arranque

`GET /api/v1/app/config` es público y devuelve el wrapper habitual. El interceptor axios del frontend ya lo desempaqueta.

```json
{"success":true,"data":{"minVersion":"0.0.0","maintenanceMode":false},"timestamp":"..."}
```

Incluye solo versión mínima global, estado de mantenimiento y mensaje opcional. No entrega credenciales ni configuración de proveedores. No modifica pagos ni KYC.

| Variable de backend | Valor por defecto | Uso |
|---|---|---|
| `APP_MIN_VERSION` | `0.0.0` | Versión mínima numérica `x.y.z` |
| `APP_MAINTENANCE_MODE` | `false` | `true` bloquea la interfaz mediante el gate existente |
| `APP_MAINTENANCE_MESSAGE` | ausente | Mensaje opcional, máximo 500 caracteres |

La configuración se lee al iniciar el proceso: cambiar variables requiere reinicio/despliegue. Valores inválidos impiden iniciar en lugar de activar un mantenimiento accidental. Sin variables nuevas la app queda habilitada. Respuesta `Cache-Control: no-store`; frontend conserva su caché existente de cinco minutos, por lo que no es un interruptor instantáneo.

Esto es un aviso/control de interfaz; no bloquea las operaciones HTTP del backend ni reemplaza autorización. Se mantiene el comportamiento de dejar entrar ante errores de red del frontend. No fuerza una versión mínima diferente por Android/iOS, no publica enlaces de tiendas ni ofrece un panel de edición; esos campos no forman parte del contrato actual.

No hace falta modificar frontend para consumirlo: ya existen `fetchAppConfig` y `useAppGate`. Actualizar el comentario que dice que el endpoint no existe. CI prueba valores por defecto, validación, ausencia de secretos y HTTP público con wrapper.
