# Data model — lo que este repositorio impone o restringe

**Fase**: 1 | **Fecha**: 2026-08-18 | **Plan**: [plan.md](./plan.md)

El modelo de datos completo es la referencia compartida con `helpi-android` y **no se
reproduce acá**. Este documento registra únicamente tres cosas: qué campos necesita este
repositorio y no existen, qué restricciones impone sobre campos que sí existen, y qué formas
lee cada función.

> Todo lo listado bajo **Campos que faltan** es una divergencia pendiente de acuerdo con
> `helpi-android`, detallada en [research.md](./research.md) § Divergencias. No debe
> implementarse sin ese acuerdo.

---

## 1. Campos que faltan y este repositorio necesita

| Colección | Campo propuesto | Para qué | Requisitos | Divergencia |
|---|---|---|---|---|
| `usuarios/{uid}/rutinas/{id}` | `pictogramas_referenciados: string[]` | Localizar por consulta las rutinas que referencian un pictograma. Sin él, FR-071 no tiene consulta posible | FR-071, FR-072 | D-001 |
| `usuarios/{uid}/rutinas/{id}` | `fecha_actualizacion: timestamp` | Registrar cuándo se modificó, con la fecha del servidor | FR-015, FR-017 | D-002 |
| *(ver §2)* | marca de pendiente de eliminación e instante de vencimiento | Suspender el perfil y exponer el indicador de estado | FR-054 a FR-057, FR-097 a FR-099 | D-003 |
| *(ver §3)* | nombre visible de la cuenta al vincularse | Conservar la autoría legible tras eliminar la cuenta | FR-093 | D-005 |

**`pictogramas_referenciados` lo mantiene el cliente**, porque es quien escribe las rutinas.
La función de propagación solo lo lee para encontrar los documentos y después actualiza las
etiquetas duplicadas dentro de los pasos.

---

## 2. El indicador de estado no puede vivir dentro de `usuarios/{uid}`

**Problema.** FR-056 deniega toda lectura del perfil pendiente de eliminación, y FR-097
permite al propietario leer un indicador de estado. Las reglas de seguridad **conceden o
deniegan el documento completo**: no existe forma de permitir la lectura de un campo y
denegar los demás del mismo documento. Poner la marca dentro de `usuarios/{uid}` hace las
dos reglas incompatibles.

**Forma propuesta**: una colección de primer nivel separada, con el mismo identificador.

```
eliminaciones_pendientes/{uid}
├── vence_en: timestamp        # instante absoluto — FR-108
└── solicitada_en: timestamp
```

- Lectura: solo el cliente cuyo uid coincide con el del documento (FR-097).
- Escritura desde el cliente: **ninguna**. La crea la función 3 al aceptar la solicitud
  (FR-054) y la borra al cancelar (FR-057).
- La existencia del documento **es** la marca: `usuarios/{uid}` no lleva ningún campo nuevo,
  y las reglas de `usuarios/**` consultan la existencia de este documento para denegar
  durante la gracia (FR-056).
- FR-099 exige que leerlo sobre un perfil que no está pendiente sea indistinguible de un
  perfil inexistente: se satisface solo porque el documento no existe.

**Costo**: la comprobación agrega **una lectura más** a cada evaluación de regla sobre el
perfil, encima de la de `uids_autorizados` (R-002). Dos lecturas por acceso a documento
hijo. Es la consecuencia directa de la decisión de suspender el perfil durante la gracia y
conviene tenerla presente si se revisa el umbral de R-002.

**Alternativa registrada, no elegida**: mantener la marca dentro de `usuarios/{uid}` y
aceptar que el propietario no pueda leer su estado. Contradice FR-097, que existe
precisamente porque esa situación se detectó como defecto (CHK026).

---

## 3. Restricciones sobre campos que ya existen

### `usuarios/{uid}.uids_autorizados`

- Arreglo de identificadores de cuenta. **Único mecanismo de separación** (Principio V).
- Escritura desde el cliente: solo el propietario, y solo para **quitar** identidades
  (FR-007). El alta la hace la función 4 (FR-085): ninguna regla de cliente puede agregar
  una identidad ajena.
- Sin entradas duplicadas (FR-083).
- FR-093 exige conservar el nombre visible de una cuenta eliminada. Un arreglo de cadenas no
  puede hacerlo. **Hace falta una forma paralela**, y su diseño depende de resolver D-005 y
  la tensión de FR-093 con el Principio IV. No se propone forma acá.

### `usuarios/{uid}/rutinas/{id}.actualizada_por`

- La escribe el cliente y la regla la **valida contra la identidad autenticada**: si no
  coincide, se rechaza (FR-016). La autoría no la declara el cliente por su cuenta.
- Junto con `fecha_actualizacion` (D-002), es obligatoria: una escritura sin cualquiera de
  las dos se rechaza (FR-014, FR-015).

### `usuarios/{uid}/resumenes/{fecha}`

Contiene el **cumplimiento de rutinas del día** (FR-100). **No es el ámbito de traducción**, que quedó fuera del alcance de esta funcionalidad.

- Solo conteos y duraciones. **Ninguna glosa, texto ni transcripción**; una escritura que
  los incluya se rechaza (FR-101).
- Escritura: solo el propietario (FR-102). **Lectura: también las cuentas autorizadas**
  (FR-103), porque consultar el cumplimiento es la razón por la que el resumen existe.
- El identificador del documento es la fecha, así que existe como máximo uno por perfil y
  por día (FR-105), que es lo que satisface NFR-005.

### `vocabularios/{version}/senas/{id}`

- `fecha_actualizacion` es lo que hace posible la sincronización por diferencia (FR-022).
- El retiro de una entrada debe ser **observable por esa misma consulta** (FR-024): una
  entrada retirada sigue devolviéndose con una marca, no desaparece. Un borrado físico
  dejaría a los dispositivos que ya la tenían sin enterarse.

### `modelos/{version}` y `config/modelo_activo`

Forma completa en [contracts/manifiesto.md](./contracts/manifiesto.md).

- Solo lectura para todo cliente (FR-020). Escritura únicamente con credenciales de
  administración (FR-021).
- `config/modelo_activo` expresa la versión vigente **y la versión mínima de aplicación
  compatible** (FR-038).
- `modelos/{version}` es el **punto de compromiso** de una publicación (R-004): mientras no
  exista, los artefactos en Storage son inertes.

---

## 4. Zonas de Cloud Storage

Dos zonas con reglas opuestas, sin solapamiento ni hueco (FR-030). Matriz completa en
[contracts/reglas-matriz.md](./contracts/reglas-matriz.md).

| Zona | Ruta | Lectura | Escritura desde cliente |
|---|---|---|---|
| Pública | `modelos/{version}/...` | Cualquier cliente autenticado | Ninguna |
| Por cuenta | `usuarios/{uid}/...` | Propietario y `uids_autorizados` | Propietario y `uids_autorizados` |

**Rutas que no existen y no deben crearse** (FR-031, NFR-001): ninguna para video, puntos
clave corporales, secuencias de glosas reconocidas, contenido de conversaciones ni material
de autenticación. Se garantiza con **denegación por defecto en la raíz** y apertura
explícita ruta por ruta: lo que no está declarado, no existe.

---

## 5. Qué lee y escribe cada función

Formas de documento en [contracts/documentos.md](./contracts/documentos.md).

| Función | Lee | Escribe | Requisitos |
|---|---|---|---|
| 1 · Aviso de emergencia | `usuarios/{uid}.uids_autorizados`, `usuarios/{autorizado}/dispositivos/*` | Elimina destinos inválidos. **Nada más: no persiste el evento** (FR-045) | FR-042 a FR-049 |
| 2 · Novedades por tema | Nada del perfil | Nada | FR-050 a FR-053 |
| 3 · Borrado en cascada | `eliminaciones_pendientes/{uid}`, todo el subárbol de `usuarios/{uid}`, `usuarios` filtrado por pertenencia a `uids_autorizados` | Crea y borra `eliminaciones_pendientes/{uid}`; borra el subárbol y los archivos por cuenta; quita la identidad de las listas ajenas | FR-054 a FR-065, FR-091 a FR-099 |
| 4 · Alta de acompañante | Nada: el código se verifica sin consultar ningún almacén (FR-078) | Agrega la identidad a `usuarios/{uid}.uids_autorizados` | FR-077 a FR-085 |
| 5 · Propagación de pictograma | Grupo de colección `rutinas` filtrado por `pictogramas_referenciados` | Solo la etiqueta y la ubicación duplicadas dentro de los pasos (FR-069) | FR-066 a FR-073 |

**El código de vinculación no aparece en ninguna fila.** FR-079 prohíbe persistirlo, y
FR-078 exige que sea verificable sin consultar ningún almacén: viaja firmado y con su
instante de vencimiento adentro.

---

## 6. Invariantes que las pruebas deben sostener

Cada uno se traduce en al menos una prueba de reglas o de integración.

1. Ninguna ruta acepta video, puntos clave, glosas ni credenciales (NFR-001, FR-031).
2. Ninguna cuenta autorizada **escribe** `resumenes` (FR-104), aunque sí lo lee (FR-103).
3. Ninguna regla de cliente agrega una identidad a `uids_autorizados` (FR-085).
4. Un perfil pendiente de eliminación admite exactamente dos operaciones, ambas del
   propietario (SC-035).
5. La propagación no modifica ningún campo fuera de las etiquetas duplicadas, y ninguna
   lista de autorizados (FR-069).
6. Todo vencimiento es un instante absoluto sembrable en una prueba (FR-107 a FR-110).
7. Ningún envío lleva carga de notificación (FR-043, FR-052, FR-096).
