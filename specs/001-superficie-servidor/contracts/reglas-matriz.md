# Contrato de reglas — matriz de rutas por rol

**Fase**: 1 | **Plan**: [../plan.md](../plan.md)

Es el contrato central del repositorio. Cada fila declara el resultado esperado de las
**cuatro clases de solicitante**, y cada celda se traduce en una prueba. Una regla con menos
de cuatro celdas verificadas no se fusiona (NFR-006, Principio VI).

**Clases**: **P** propietario · **A** cuenta en `uids_autorizados` · **NA** autenticado no
autorizado · **NAu** no autenticado.

**Leyenda**: ✅ permitido · ❌ denegado · ➖ no aplica a esta ruta.

---

## Firestore

### Perfil y subcolecciones

| Ruta | Operación | P | A | NA | NAu | Requisitos |
|---|---|---|---|---|---|---|
| `usuarios/{uid}` | leer | ✅ | ✅ | ❌ | ❌ | FR-002 a FR-005 |
| `usuarios/{uid}` | escribir campos generales | ✅ | ✅ | ❌ | ❌ | FR-002, FR-003 |
| `usuarios/{uid}.uids_autorizados` | quitar una identidad | ✅ | ❌ | ❌ | ❌ | FR-007 |
| `usuarios/{uid}.uids_autorizados` | agregar una identidad | ❌ | ❌ | ❌ | ❌ | FR-085 — solo la función 4 |
| `usuarios` | enumerar o consultar perfiles ajenos | ❌ | ❌ | ❌ | ❌ | FR-008 |
| `usuarios/{uid}/rutinas/{id}` | leer y escribir | ✅ | ✅ | ❌ | ❌ | FR-003, FR-011 |
| `usuarios/{uid}/dispositivos/{id}` | leer y escribir | ✅ | ✅ | ❌ | ❌ | FR-011 |
| `usuarios/{uid}/pictogramas/{id}` | leer y escribir | ✅ | ✅ | ❌ | ❌ | FR-011 |
| `usuarios/{uid}/resumenes/{fecha}` | leer y escribir | ✅ | **❌** | ❌ | ❌ | FR-102, FR-103 |

> La fila de `resumenes` es la única asimetría del perfil: una cuenta autorizada tiene acceso
> a todo lo demás y a esto no. Es el ámbito de traducción (Principio XI). Una prueba debe
> fijarla explícitamente para que no se pierda en un refactor.

### Validaciones de escritura sobre rutinas

Se aplican **además** de la autorización. Todas se prueban con caso aceptado y rechazado.

| Condición de la escritura | Resultado | Requisitos |
|---|---|---|
| Sin `actualizada_por` | ❌ rechazada | FR-014 |
| Sin `fecha_actualizacion` | ❌ rechazada | FR-015 |
| `actualizada_por` distinto de la identidad autenticada | ❌ rechazada | FR-016 |
| `fecha_actualizacion` distinta de la fecha del servidor | ❌ rechazada | FR-017 |
| Con ambos campos correctos | ✅ aceptada | FR-014 a FR-017 |

### Validaciones sobre el agregado diario

| Condición | Resultado | Requisitos |
|---|---|---|
| Solo conteos y duraciones | ✅ aceptada | FR-100 |
| Incluye glosa, texto o transcripción | ❌ rechazada | FR-101 |
| Segundo documento para el mismo día | ❌ rechazada | FR-104 |

### Ventana de gracia

Cuando existe `eliminaciones_pendientes/{uid}`, estas filas **sustituyen** a las de arriba.

| Ruta | Operación | P | A | NA | NAu | Requisitos |
|---|---|---|---|---|---|---|
| `usuarios/{uid}/**` | cualquiera | ❌ | ❌ | ❌ | ❌ | FR-056 |
| `eliminaciones_pendientes/{uid}` | leer | ✅ | ❌ | ❌ | ❌ | FR-097 |
| `eliminaciones_pendientes/{uid}` | escribir o borrar | ❌ | ❌ | ❌ | ❌ | Solo la función 3 |
| `eliminaciones_pendientes/{otro}` | leer | ➖ | ➖ | ❌ | ❌ | FR-097 |

> Cancelar la eliminación (FR-057) **no es una escritura de cliente**: es una llamada a la
> función 3, que valida que quien llama sea el propietario. Por eso la fila de escritura
> directa está denegada para todos.

### Colecciones globales

| Ruta | Operación | P | A | NA | NAu | Requisitos |
|---|---|---|---|---|---|---|
| `vocabularios/{version}/senas/{id}` | leer | ✅ | ✅ | ✅ | ❌ | FR-018, FR-019 |
| `modelos/{version}` | leer | ✅ | ✅ | ✅ | ❌ | FR-018, FR-019 |
| `config/modelo_activo` | leer | ✅ | ✅ | ✅ | ❌ | FR-018, FR-019 |
| `pictogramas/{id}` | leer | ✅ | ✅ | ✅ | ❌ | FR-018, FR-019 |
| cualquiera de las anteriores | crear, modificar, borrar | ❌ | ❌ | ❌ | ❌ | FR-020 |

> Acá las clases P y A no significan nada: no hay perfil de por medio. Lo que separa es
> autenticado de no autenticado. Se declara explícitamente porque el checklist de validación
> marcó como hallazgo (CHK014) que la especificación no dice dónde la taxonomía de cuatro
> clases deja de aplicar.

### Cierre

| Ruta | Operación | Todas las clases | Requisitos |
|---|---|---|---|
| `/{document=**}` | cualquiera | ❌ | Denegación por defecto |

Toda ruta no listada arriba está denegada. Es lo que hace ciertos a FR-031 y NFR-001: una
ruta no declarada no existe.

---

## Cloud Storage

### Zona pública

| Ruta | Operación | P | A | NA | NAu | Requisitos |
|---|---|---|---|---|---|---|
| `modelos/{version}/modelo` | leer | ✅ | ✅ | ✅ | ❌ | FR-028 |
| `modelos/{version}/catalogo` | leer | ✅ | ✅ | ✅ | ❌ | FR-028 |
| `modelos/{version}/manifiesto` | leer | ✅ | ✅ | ✅ | ❌ | FR-028 |
| `modelos/**` | escribir | ❌ | ❌ | ❌ | ❌ | FR-029 |

### Zona por cuenta

| Ruta | Operación | P | A | NA | NAu | Requisitos |
|---|---|---|---|---|---|---|
| `usuarios/{uid}/pictogramas/{archivo}` | leer y escribir | ✅ | ✅ | ❌ | ❌ | FR-025 a FR-027 |
| `usuarios/{uid}/audios/{archivo}` | leer y escribir | ✅ | ✅ | ❌ | ❌ | FR-025 a FR-027 |

### Cierre

| Ruta | Operación | Todas las clases | Requisitos |
|---|---|---|---|
| `/{allPaths=**}` | cualquiera | ❌ | FR-030, FR-031 |

**Ninguna ruta admite video ni puntos clave corporales**, y no por una regla que los deniegue
sino porque no existe ruta que los acepte. La prueba correspondiente intenta escribir en una
ruta inventada y espera denegación.

---

## Cómo se prueba esta matriz

- Una prueba por celda no ➖. Las celdas ✅ y ❌ de la misma fila van juntas: probar solo el
  permitido no verifica nada, porque una regla que autoriza a todos también lo pasa.
- **Credenciales de test explícitas.** Prohibido `allow read, write: if true`, incluso en
  pruebas (Principio XII).
- **Sin mezclar credenciales de administración y de usuario en el mismo test.** El sembrado
  con credenciales de administración va en el preparado, nunca en la aserción.
- Las filas de la ventana de gracia se prueban sembrando `eliminaciones_pendientes/{uid}`
  con `vence_en` en el pasado y en el futuro: ambos casos deniegan el perfil, y solo el
  vencido habilita el borrado efectivo.
