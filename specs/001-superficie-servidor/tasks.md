---
description: "Task list for feature implementation"
---

# Tasks: Superficie de servidor de Helpi

**Input**: Documentos de diseño en `specs/001-superficie-servidor/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: obligatorios. El Principio VI de la constitución hace de la prueba de caso
permitido y caso denegado un criterio de aceptación no negociable. **Una tarea de reglas sin
su tarea de pruebas es un defecto de generación.**

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable — archivos distintos, sin dependencias pendientes
- **[Story]**: historia de usuario de `spec.md` a la que traza la tarea
- Toda ruta es relativa a la raíz de **helpi-firebase**

---

## Límite de alcance

**Toda tarea de este documento produce o modifica archivos dentro de `helpi-firebase`.**

No existe ninguna tarea que implique código Kotlin o Java, entrenamiento o preprocesamiento,
extracción de landmarks, inferencia, interfaz de usuario, programación de alarmas ni
ejecución de rutinas. Donde una capacidad exige trabajo del otro lado de un límite de
repositorio, la tarea de acá es **definir y versionar el contrato**, y la contraparte queda
anotada como dependencia externa.

### Dependencias externas — no generan tarea en este repositorio

| Qué se espera | De quién | Bloquea |
|---|---|---|
| Artefacto de modelo y catálogo de señas de cada versión | `helpi-ml` | Fase 6 en producción; no bloquea el desarrollo, que usa artefactos de prueba |
| Mantener `pictogramas_referenciados` al escribir una rutina (D-001) | `helpi-android` | Fase 5E |
| Mantener `tutores[]` en sincronía con `uids_autorizados` (D-003) | `helpi-android` | T019, Fase 5D |
| Leer `eliminaciones_pendientes/{uid}` para mostrar el estado pendiente (D-004) | `helpi-android` | Nada acá; el contrato ya existe |
| Consumo de los contratos de `contracts/` | `helpi-android` | Nada acá; se versionan y se publican |

### Bloqueos conocidos antes de empezar

| # | Bloqueo | Origen | Qué frena |
|---|---|---|---|
| B-1 | D-001, D-003 y D-004 son divergencias del modelo compartido sin acordar | `research.md` § Divergencias | T036, Fase 5E |
| B-2 | El abanico de la propagación no tiene cota ni comportamiento definido al exceder el tiempo de ejecución | CHK008, CHK062 | Criterios de aceptación de la Fase 5E |
| B-3 | `deleted_at` no está ligado a ningún requisito: no se sabe si la propagación alcanza rutinas borradas lógicamente. Tampoco está contemplado `pictograma_origen: APK` | D-005, D-006 | T050, T092 |
| B-4 | FR-093 conserva el nombre visible de una cuenta eliminada, en tensión con el Principio IV | `spec.md` § Assumptions | T080 |
| B-5 | Cómo simular que el proveedor de envío reporta un destino inválido | CHK054 | T067, T106 |

**Ninguno de estos bloqueos se resuelve inventando una decisión.** Cada uno vuelve a
`/speckit-clarify` o a un acuerdo con `helpi-android`.

---

## Fase 0: Andamiaje del repositorio y del entorno de pruebas

**Propósito**: dejar el repositorio capaz de correr una prueba contra el emulador. Nada de
esto depende de la especificación funcional y **todo lo demás depende de esto**.

- [ ] T001 Crear la estructura de carpetas de `plan.md` § Project Structure: `functions/src/`, `functions/test/`, `reglas/`, `indices/`, `scripts/`, `tests/reglas/`
- [ ] T002 Inicializar `functions/package.json` con `firebase-functions` v2 y `firebase-admin`, y fijar `engines.node` en 22
- [ ] T003 Configurar `functions/tsconfig.json` en modo estricto, con salida a `functions/lib/`
- [ ] T004 [P] Configurar formateo y análisis estático en `.editorconfig` y la configuración de lint de `functions/`
- [ ] T005 Crear `firebase.json` declarando los emuladores de Firestore, Storage, Auth y Functions, y apuntando a `reglas/firestore.rules`, `reglas/storage.rules` e `indices/firestore.indexes.json`
- [ ] T006 [P] Crear `.firebaserc` sin proyecto real por defecto, de modo que un comando sin `--project` no pueda alcanzar producción
- [ ] T007 Inicializar `tests/reglas/package.json` con `@firebase/rules-unit-testing` y su corredor de pruebas
- [ ] T008 Crear los helpers de las cuatro clases de solicitante en `tests/reglas/helpers/identidades.ts`: `propietaria`, `autorizada`, `ajena` y sin autenticar, según `contracts/reglas-matriz.md`
- [ ] T009 Crear el helper de siembra con credenciales de administración en `tests/reglas/helpers/siembra.ts`, **separado de toda aserción**, según `quickstart.md` § 3
- [ ] T010 [P] Crear el conjunto de datos de siembra en `tests/reglas/fixtures/base.ts`: perfil de `propietaria` con `uids_autorizados`, perfil de `segunda`, subcolecciones, entradas de catálogo con distinta fecha y una retirada
- [ ] T011 Crear el helper de instantes en `tests/reglas/helpers/vencimientos.ts` para sembrar vencimientos ya pasados y futuros (FR-107 a FR-110), que es lo que evita esperar 30 días
- [ ] T012 [P] Definir los guiones `verificar`, `test:reglas` y `test:funciones` en el `package.json` de la raíz
- [ ] T013 Crear el flujo de verificación en `.github/workflows/verificacion.yml`: comprobación de tipos, pruebas de reglas y pruebas de funciones sobre el emulador, en cada solicitud de incorporación
- [ ] T014 [P] Crear el flujo de despliegue en `.github/workflows/despliegue.yml`, **manual y solo desde integración continua**, nunca automático (Principio XIV)

**Punto de control**: `npm run verificar` arranca el emulador, no encuentra pruebas y
termina en verde. `firebase emulators:start` levanta los cuatro servicios.

---

## Fase 1: Reglas de Firestore

**Propósito**: la única barrera técnica que protege datos sensibles bajo la Ley N.º 25.326.
Va **antes** que cualquier función, a propósito.

Cada tarea de reglas tiene su tarea de pruebas, y cada tarea de pruebas cubre las cuatro
clases: propietaria permitida, autorizada permitida, autenticada no autorizada denegada, no
autenticada denegada.

### Cimiento de autorización

- [ ] T015 [US1] Escribir la denegación por defecto en la raíz de `reglas/firestore.rules`: `match /{document=**}` cerrado a todo
- [ ] T016 [US1] Escribir la función auxiliar de autorización en `reglas/firestore.rules` que lee `usuarios/{uid}` y evalúa pertenencia a `uids_autorizados`, según `research.md` § R-002
- [ ] T017 [US1] Escribir las reglas de lectura y escritura de `usuarios/{uid}` en `reglas/firestore.rules` (FR-002 a FR-005)
- [ ] T018 [US1] Escribir las pruebas de `usuarios/{uid}` en `tests/reglas/firestore/perfil.test.ts` con las cuatro clases
- [ ] T019 [US1] Escribir las reglas de `uids_autorizados` en `reglas/firestore.rules`: quitar permitido solo a la propietaria, **agregar denegado a todos** (FR-007, FR-085)
- [ ] T020 [US1] Escribir las pruebas de `uids_autorizados` en `tests/reglas/firestore/autorizados.test.ts`, incluido el caso de que **ni siquiera la propietaria** puede agregar una identidad
- [ ] T021 [US1] Escribir la denegación de enumeración de perfiles en `reglas/firestore.rules`, acotada a los clientes (FR-008)
- [ ] T022 [US1] Escribir las pruebas de enumeración en `tests/reglas/firestore/enumeracion.test.ts`: ninguna consulta devuelve perfiles ni identificadores ajenos
- [ ] T023 [US1] Escribir las pruebas de revocación en `tests/reglas/firestore/revocacion.test.ts`: retirada una identidad, toda solicitud posterior se deniega sin acción de su parte (FR-006)

### Subcolecciones del perfil

- [ ] T024 [US2] Escribir las reglas de `usuarios/{uid}/rutinas/{id}` en `reglas/firestore.rules` (FR-003, FR-011)
- [ ] T025 [P] [US2] Escribir las pruebas de rutinas en `tests/reglas/firestore/rutinas.test.ts` con las cuatro clases
- [ ] T026 [US2] Escribir las reglas de `usuarios/{uid}/dispositivos/{id}` en `reglas/firestore.rules` (FR-011)
- [ ] T027 [P] [US2] Escribir las pruebas de dispositivos en `tests/reglas/firestore/dispositivos.test.ts` con las cuatro clases
- [ ] T028 [US2] Escribir las validaciones de escritura de rutina en `reglas/firestore.rules`: rechazo sin `actualizada_por`, sin `fecha_actualizacion`, con autoría ajena a la identidad autenticada, o con fecha distinta de la del servidor (FR-014 a FR-017)
- [ ] T029 [US2] Escribir las pruebas de validación de rutina en `tests/reglas/firestore/rutinas-validacion.test.ts`, con caso aceptado y los cuatro rechazos
- [ ] T030 [US2] Escribir las reglas de `usuarios/{uid}/pictogramas/{id}` en `reglas/firestore.rules` (FR-011)
- [ ] T031 [P] [US2] Escribir las pruebas de pictogramas personalizados en `tests/reglas/firestore/pictogramas.test.ts` con las cuatro clases
- [ ] T032 [US2] Escribir las reglas de `usuarios/{uid}/resumenes/{fecha}` en `reglas/firestore.rules`: escritura solo de la propietaria, **lectura también de las cuentas autorizadas** (FR-102, FR-103, FR-104)
- [ ] T033 [US2] Escribir las pruebas del resumen diario en `tests/reglas/firestore/resumenes.test.ts` con las cuatro clases, fijando que la cuenta autorizada **lee pero no escribe**
- [ ] T034 [US2] Escribir las validaciones de contenido del resumen en `reglas/firestore.rules`: rechazo si incluye glosa, texto o transcripción (FR-101), y un documento por día por identificador de fecha (FR-105)
- [ ] T035 [US2] Escribir las pruebas de contenido del resumen en `tests/reglas/firestore/resumenes-contenido.test.ts`

### Ventana de gracia

- [ ] T036 [US7] Escribir las reglas de `eliminaciones_pendientes/{uid}` en `reglas/firestore.rules`: lectura solo de la propietaria, escritura y borrado denegados a todo cliente (FR-097 a FR-099) — **bloqueada por B-1 (D-004)**
- [ ] T037 [US7] Escribir la denegación de `usuarios/{uid}/**` cuando existe `eliminaciones_pendientes/{uid}` en `reglas/firestore.rules` (FR-056)
- [ ] T038 [US7] Escribir las pruebas de la ventana de gracia en `tests/reglas/firestore/gracia.test.ts` según `quickstart.md` § 5: con vencimiento futuro y pasado, indicador legible solo por la propietaria, perfil denegado a todos

### Colecciones globales

- [ ] T039 [US5] Escribir las reglas de `vocabularios/{version}/senas`, `modelos/{version}`, `config/modelo_activo` y `pictogramas/{id}` en `reglas/firestore.rules`: lectura para todo autenticado, escritura denegada a todo cliente (FR-018 a FR-021)
- [ ] T040 [P] [US5] Escribir las pruebas de colecciones globales en `tests/reglas/firestore/globales.test.ts`, declarando explícitamente que las clases propietaria y autorizada **no aplican** acá, según `contracts/reglas-matriz.md` (hallazgo CHK014)

**Punto de control**: `npm run test:reglas` en verde, y toda celda no ➖ de la sección
Firestore de `contracts/reglas-matriz.md` tiene su prueba.

---

## Fase 2: Reglas de Cloud Storage

- [ ] T041 [US3] Escribir la denegación por defecto en la raíz de `reglas/storage.rules`: `match /{allPaths=**}` cerrado
- [ ] T042 [US3] Escribir las reglas de la zona pública en `reglas/storage.rules`: `modelos/{version}/**` legible por todo autenticado, escritura denegada a todo cliente (FR-028, FR-029)
- [ ] T043 [US3] Escribir las pruebas de la zona pública en `tests/reglas/storage/zona-publica.test.ts` con las cuatro clases
- [ ] T044 [US3] Escribir las reglas de la zona de pictogramas globales en `reglas/storage.rules`: `pictogramas/**` legible por todo autenticado, escritura denegada (D-010)
- [ ] T045 [US3] Escribir las reglas de la zona por cuenta en `reglas/storage.rules`: `usuarios/{uid}/pictogramas/**` y `usuarios/{uid}/audios/**` para propietaria y autorizadas (FR-025 a FR-027)
- [ ] T046 [US3] Escribir las pruebas de la zona por cuenta en `tests/reglas/storage/zona-cuenta.test.ts` con las cuatro clases
- [ ] T047 [US3] Escribir la prueba de ausencia de rutas en `tests/reglas/storage/rutas-inexistentes.test.ts`: intentos de escritura de video y de puntos clave corporales en rutas inventadas, todos denegados (FR-031, NFR-001)
- [ ] T048 [US3] Escribir la prueba de cobertura de zonas en `tests/reglas/storage/zonas-cobertura.test.ts`: ninguna ubicación queda cubierta por ambas reglas ni sin cubrir (FR-030)

**Punto de control**: `npm run test:reglas` cubre Firestore y Storage. La prueba de T046
pasa porque **la ruta no existe**, no porque una regla la deniegue.

---

## Fase 3: Índices

Ver `research.md` § R-003: de las tres consultas declaradas, **solo una exige índice
explícito**. Las otras dos quedan cubiertas por la indexación automática de campo único, y
eso conviene dejarlo escrito para que no se lea como un olvido.

- [ ] T049 [US9] Declarar el índice de alcance de grupo de colección para `rutinas` sobre `pictogramas_referenciados` en `indices/firestore.indexes.json` (FR-071, FR-072)
- [ ] T050 [US5] Escribir la verificación en `tests/reglas/firestore/consultas.test.ts` de que la consulta por diferencia del catálogo resuelve sin índice explícito (FR-022, FR-023)
- [ ] T051 [US7] Escribir la verificación en `tests/reglas/firestore/consultas.test.ts` de que la consulta de perfiles por pertenencia a `uids_autorizados` resuelve sin índice explícito (FR-062) — **revisar B-3: si la propagación debe excluir rutinas borradas lógicamente, hace falta un índice compuesto**
- [ ] T052 Documentar en `indices/README.md` qué consulta justifica cada entrada del archivo de índices y por qué las otras dos no llevan entrada

**Punto de control**: la consulta de grupo de colección de T048 se ejecuta contra el
emulador sin ser rechazada por falta de índice.

---

## Fase 4: Contratos versionados

Estas tareas producen **archivos de contrato y sus validaciones, no lógica**. Preceden a
toda tarea que consuma el contrato.

- [ ] T053 [P] Definir los tipos de documento en `functions/src/comun/tipos.ts` derivados de `contracts/documentos.md`: perfil, rutina, dispositivo, resumen y eliminación pendiente
- [ ] T054 [P] Definir el tipo del manifiesto y del documento de versión en `functions/src/comun/tipos-publicacion.ts` derivados de `contracts/manifiesto.md`
- [ ] T055 Definir el constructor de mensajes de datos en `functions/src/comun/envio.ts`, **sin ninguna rama que produzca la clave `notification`** (FR-043, FR-052, FR-096)
- [ ] T056 [US4] Definir el mensaje de emergencia en `functions/src/comun/envio.ts` según `contracts/fcm-payloads.md` § 1
- [ ] T057 [US8] Definir el mensaje de novedad en `functions/src/comun/envio.ts` según `contracts/fcm-payloads.md` § 2
- [ ] T058 [US7] Definir el mensaje de cierre de vínculo en `functions/src/comun/envio.ts` según `contracts/fcm-payloads.md` § 3
- [ ] T059 Escribir las pruebas de forma del mensaje en `functions/test/contratos/envio.test.ts`: los tres mensajes **carecen de la clave `notification`** y no llevan datos sensibles
- [ ] T060 [P] Definir el módulo de vencimientos en `functions/src/comun/vencimientos.ts`: todo vencimiento es un instante absoluto y la comparación es contra la hora del servidor (FR-107 a FR-110)
- [ ] T061 [P] Escribir las pruebas de vencimientos en `functions/test/contratos/vencimientos.test.ts`: un instante ya pasado produce el mismo resultado que uno vencido por el paso del tiempo
- [ ] T062 Definir el módulo de errores en `functions/src/comun/errores.ts`: registrar con contexto y relanzar, sin datos personales identificables, y respuestas indistinguibles donde la especificación lo exige (FR-081, FR-099, FR-106)

**Punto de control**: `npm run test:funciones` corre las pruebas de contrato en verde sin
que exista todavía ninguna función.

---

## Fase 5A: Función 1 — Aviso a contactos de confianza

**Historia**: US4 (P1) · **Requisitos**: FR-042 a FR-049

- [ ] T063 [US4] Implementar la función llamable en `functions/src/aviso-emergencia/index.ts`: permitida solo a la propietaria sobre su propio perfil (FR-042, FR-048)
- [ ] T064 [US4] Implementar la resolución de destinos en `functions/src/aviso-emergencia/destinos.ts`: leer `usuarios/{uid}/dispositivos` **del propio perfil** filtrando por `tipo: TUTOR` (D-002). Sin lectura cruzada de perfiles
- [ ] T065 [US4] Implementar la emisión en `functions/src/aviso-emergencia/index.ts` continuando con el resto de los destinos ante un fallo (FR-047)
- [ ] T066 [US4] Escribir la prueba de integración en `functions/test/integracion/aviso-emergencia.test.ts`: se emite un envío por destino, el mensaje no lleva `notification`, y **tras procesar ningún almacén tiene registro del evento** (FR-045)
- [ ] T067 [US4] Escribir la prueba de autorización en `functions/test/integracion/aviso-emergencia-acceso.test.ts`: permitida a la propietaria, denegada a la cuenta autorizada, a la ajena y a la no autenticada
- [ ] T068 [US4] Implementar la depuración de destinos inválidos en `functions/src/comun/envio.ts` y su prueba en `functions/test/integracion/destinos-invalidos.test.ts` (FR-046) — **bloqueada por B-5**

**Punto de control**: la prueba de T065 recorre los almacenes tras el envío y encuentra cero
registros del evento.

---

## Fase 5B: Función 2 — Publicación de novedades por temas

**Historia**: US8 (P3) · **Requisitos**: FR-050 a FR-053

- [ ] T069 [US8] Implementar la función disparada por evento en `functions/src/novedades-tema/index.ts` (FR-050)
- [ ] T070 [US8] Implementar la resolución de tema por categoría en `functions/src/novedades-tema/temas.ts`, terminando sin error y sin emitir cuando no corresponde a ningún tema (FR-053)
- [ ] T071 [US8] Escribir la prueba de integración en `functions/test/integracion/novedades-tema.test.ts`: se emite al tema, el mensaje anuncia disponibilidad y **no transporta el contenido** (FR-051)
- [ ] T072 [US8] Escribir la prueba de forma en `functions/test/integracion/novedades-forma.test.ts`: el mensaje carece de `notification` (FR-052)

**Punto de control**: publicar contenido en el emulador produce exactamente un envío al tema
correspondiente y cero al resto.

---

## Fase 5C: Función 3 — Borrado en cascada al eliminar una cuenta

**Historia**: US7 (P2) · **Requisitos**: FR-054 a FR-065, FR-091 a FR-099

- [ ] T073 [US7] Implementar la solicitud de eliminación en `functions/src/borrado-cascada/solicitar.ts`: crea `eliminaciones_pendientes/{uid}` con `vence_en` a 30 días y encola la tarea diferida (FR-054, FR-055)
- [ ] T074 [US7] Implementar la cancelación en `functions/src/borrado-cascada/cancelar.ts`: retira la marca y deja la tarea sin efecto, permitida solo a la propietaria (FR-057)
- [ ] T075 [US7] Implementar el manejador del borrado efectivo en `functions/src/borrado-cascada/ejecutar.ts`, **invocable de forma independiente del encolado** para que la prueba lo ejercite sin depender del programador (`research.md` § R-005)
- [ ] T076 [US7] Implementar el borrado del subárbol del perfil en `functions/src/borrado-cascada/subarbol.ts` (FR-059)
- [ ] T077 [US7] Implementar el borrado de los archivos de la zona por cuenta en `functions/src/borrado-cascada/archivos.ts` (FR-060)
- [ ] T078 [US7] Implementar la eliminación de la identidad en las listas de autorizados ajenas en `functions/src/borrado-cascada/referencias.ts`, sin alterar esos perfiles en ningún otro aspecto (FR-061)
- [ ] T079 [US7] Implementar la conservación de los archivos que la cuenta escribió en perfiles ajenos en `functions/src/borrado-cascada/referencias.ts` (FR-091)
- [ ] T080 [US7] Implementar el aviso de cierre de vínculo en `functions/src/borrado-cascada/aviso.ts`: informativo, **no condiciona la eliminación** (FR-094, FR-095)
- [ ] T081 [US7] Implementar la despersonalización de la autoría en `functions/src/borrado-cascada/autoria.ts`: reemplazar el identificador por una marca de cuenta eliminada (FR-092) — **bloqueada por B-4 en lo que respecta a conservar el nombre visible (FR-093)**
- [ ] T082 [US7] Escribir la prueba de integración del ciclo completo en `functions/test/integracion/borrado-cascada.test.ts` según `quickstart.md` § 5, incluida la reejecución sobre una cuenta ya borrada sin error ni efectos (FR-064)

**Punto de control**: el escenario completo de `quickstart.md` § 5 pasa sin esperar 30 días,
sembrando `vence_en` en el pasado.

---

## Fase 5D: Función 4 — Alta de un acompañante en la lista de autorizados

**Historia**: US10 (P1) · **Requisitos**: FR-077 a FR-085, FR-106

Esta función existe porque la especificación aprobada la incorporó (AMB-001) y la
constitución v1.1.0 la reconoce como capacidad comprometida.

- [ ] T083 [US10] Implementar la emisión del código en `functions/src/alta-acompanante/emitir.ts`: firmado, con vencimiento a 10 minutos, permitido solo a la propietaria sobre su propio perfil (FR-077, FR-078)
- [ ] T084 [US10] Implementar la verificación del código en `functions/src/alta-acompanante/verificar.ts` **sin consultar ningún almacén** y sin persistir nada (FR-078, FR-079)
- [ ] T085 [US10] Implementar el canje en `functions/src/alta-acompanante/canjear.ts`: agrega la identidad a `uids_autorizados` sin duplicados (FR-080, FR-083)
- [ ] T086 [US10] Implementar el límite de tasa en `functions/src/alta-acompanante/tasa.ts`: 5 intentos fallidos por hora, contados por cuenta solicitante **y** por perfil emisor (FR-084)
- [ ] T087 [US10] Escribir la prueba de integración del canje en `functions/test/integracion/alta-acompanante.test.ts`: el acceso pasa de denegado a permitido tras el canje
- [ ] T088 [US10] Escribir la prueba de rechazos indistinguibles en `functions/test/integracion/alta-rechazos.test.ts`: vencido, ya canjeado, manipulado, inexistente y por límite de tasa devuelven **el mismo código y el mismo cuerpo** (FR-081, FR-106)
- [ ] T089 [US10] Escribir la prueba de no persistencia en `functions/test/integracion/alta-persistencia.test.ts`: tras el canje, ningún almacén contiene el código ni valor derivado (FR-079)

**Punto de control**: T088 recorre los almacenes y encuentra cero rastros del código.

---

## Fase 5E: Función 5 — Propagación de los datos duplicados de un pictograma

**Historia**: US9 (P3) · **Requisitos**: FR-066 a FR-073

> **Es la operación de mayor riesgo del repositorio**: escribe en abanico sobre perfiles
> ajenos con credenciales de administración, eludiendo por diseño la regla que separa un
> perfil de otro. **Bloqueada por B-1 (D-001) y B-2 (cota del abanico).**

- [ ] T090 [US9] Implementar la localización de rutinas en `functions/src/propagacion-pictograma/localizar.ts` mediante la consulta de grupo de colección de T048, sin recorrer los perfiles que no referencian el pictograma (FR-071)
- [ ] T091 [US9] Implementar la actualización acotada en `functions/src/propagacion-pictograma/actualizar.ts`: **solo etiqueta y ubicación** dentro de los pasos que referencian el pictograma (FR-069)
- [ ] T092 [US9] Implementar el acotamiento del pictograma personalizado en `functions/src/propagacion-pictograma/localizar.ts`: alcanza únicamente las rutinas de su propio perfil (FR-070)
- [ ] T093 [US9] Implementar la reintentabilidad en `functions/src/propagacion-pictograma/index.ts` (FR-073) — **revisar B-3 antes: define si la consulta excluye rutinas borradas lógicamente**
- [ ] T094 [US9] Escribir la prueba de integración en `functions/test/integracion/propagacion.test.ts`: dos perfiles distintos reflejan la etiqueta nueva
- [ ] T095 [US9] Escribir la prueba de acotamiento en `functions/test/integracion/propagacion-acotamiento.test.ts`: **ningún campo fuera de las etiquetas duplicadas cambió y ninguna lista de autorizados cambió** (FR-069)

**Punto de control**: T094 compara los perfiles afectados antes y después y confirma que el
único cambio son las etiquetas duplicadas.

---

## Fase 6: Script de publicación de modelos

**Historia**: US6 (P2) · **Requisitos**: FR-032 a FR-041, FR-086 a FR-090

- [ ] T096 [US6] Implementar la validación previa en `scripts/publicar-modelo/validar.ts`: que exista el vocabulario referenciado y que corresponda (FR-036)
- [ ] T097 [US6] Implementar la verificación de hashes contra el manifiesto en `scripts/publicar-modelo/hashes.ts` (FR-035)
- [ ] T098 [US6] Implementar el rechazo de versión ya publicada en `scripts/publicar-modelo/validar.ts`, dejando los artefactos existentes intactos (FR-034)
- [ ] T099 [US6] Implementar la subida a rutas nuevas por versión en `scripts/publicar-modelo/subir.ts` (FR-032)
- [ ] T100 [US6] Implementar la escritura de `modelos/{version}` en `scripts/publicar-modelo/publicar.ts` como **punto de compromiso** (FR-033)
- [ ] T101 [US6] Implementar la retención en `scripts/publicar-modelo/retencion.ts`: conservar las 3 más recientes, **nunca eliminar la vigente** (FR-086 a FR-088)
- [ ] T102 [US6] Implementar la actualización de `config/modelo_activo` en `scripts/publicar-modelo/activar.ts` como **último paso siempre** (FR-037, FR-039)
- [ ] T103 [US6] Implementar la comprobación de indicador colgado en `scripts/publicar-modelo/diagnostico.ts`: detecta un indicador que apunta a una versión inexistente (FR-040)
- [ ] T104 [US6] Escribir la prueba de publicación completa en `scripts/publicar-modelo/test/publicacion.test.ts` según `quickstart.md` § 7
- [ ] T105 [US6] Escribir la prueba de interrupción en `scripts/publicar-modelo/test/interrupcion.test.ts`: interrumpido antes del punto de compromiso, la versión **no figura disponible** y el número queda quemado (`research.md` § R-004)
- [ ] T106 [US6] Escribir la prueba de rechazo por catálogo inexistente o no coincidente en `scripts/publicar-modelo/test/catalogo.test.ts`: el indicador conserva su valor anterior (FR-037)

**Punto de control**: revertir a una versión anterior se completa cambiando solo
`config/modelo_activo`, sin republicar ningún artefacto.

---

## Fase 7: Endurecimiento y verificación transversal

- [ ] T107 Auditar que ninguna función tiene un `catch` vacío, recorriendo `functions/src/**`, y agregar la regla de análisis estático que lo impida (Principio XIII)
- [ ] T108 Escribir la verificación en `tests/reglas/auditoria/permisivas.test.ts` de que **ninguna prueba ni ninguna regla usa `allow read, write: if true`** (Principio XII)
- [ ] T109 Escribir la verificación en `functions/test/auditoria/notificacion.test.ts` de que **ninguna prueba construye un mensaje con carga de notificación**, ni siquiera para comprobar que se rechaza (Principio VII)
- [ ] T110 Escribir la verificación en `tests/reglas/auditoria/credenciales.test.ts` de que ninguna prueba mezcla credenciales de administración con credenciales de usuario en el mismo caso (Principio XII)
- [ ] T111 Verificar que los registros de las cinco funciones no contienen datos personales identificables, en `functions/test/auditoria/registros.test.ts` (FR-049)
- [ ] T112 Verificar la cobertura de la matriz en `tests/reglas/auditoria/cobertura.test.ts`: toda celda no ➖ de `contracts/reglas-matriz.md` tiene una prueba asociada (NFR-006)
- [ ] T113 Documentar en `README.md` cómo levantar el emulador y correr la verificación, remitiendo a `quickstart.md`

**Punto de control**: `npm run verificar` en verde, con las cuatro auditorías incluidas.

---

## Fase 8: Validación end to end según quickstart.md

- [ ] T114 Recorrer `quickstart.md` § 4 y confirmar que cada escenario de la tabla de reglas produce el resultado esperado
- [ ] T115 Recorrer `quickstart.md` § 5 y confirmar el ciclo completo de la ventana de gracia sin esperar la ventana real
- [ ] T116 Recorrer `quickstart.md` § 6 y confirmar la tabla de funciones, incluidas las afirmaciones de ausencia de la clave `notification`
- [ ] T117 Recorrer `quickstart.md` § 7 y confirmar la tabla del script de publicación
- [ ] T118 Registrar en `quickstart.md` toda divergencia entre lo documentado y lo observado, **sin corregir la especificación por cuenta propia**

**Punto de control**: los cuatro recorridos pasan contra el emulador, sin dispositivo y sin
intervención humana. Es el criterio maestro de `spec.md`.

---

## Dependencias entre fases

```
Fase 0  ──────────────────────────────────────────► todo lo demás
   │
   ├─► Fase 1 (reglas Firestore) ──┐
   ├─► Fase 2 (reglas Storage) ────┤
   ├─► Fase 3 (índices) ───────────┤
   │                               │
   └─► Fase 4 (contratos) ─────────┼──► Fase 5A, 5B, 5C, 5D, 5E
                                   │         │
                                   └─────────┴──► Fase 6 ──► Fase 7 ──► Fase 8
```

**Reglas de orden que no se negocian**:

- La Fase 4 precede a toda fase que consuma un contrato (5A a 5E y 6).
- Las Fases 1 y 2 preceden a las funciones: las reglas son la barrera, no el pegamento.
- La Fase 3 precede a la 5E: sin el índice de T048, la consulta de T089 se rechaza.
- Dentro de cada fase, la tarea de reglas precede a su tarea de pruebas.

**Dependencias puntuales**:

| Tarea | Depende de |
|---|---|
| T016 a T040 | T015 (denegación por defecto) |
| T017, T019, T024, T026, T030, T032 | T016 (función auxiliar de autorización) |
| T037 | T036 (`eliminaciones_pendientes` debe existir) |
| T054 a T058 | T052 (tipos) |
| T062 a T094 | T054, T059, T061 (envío, vencimientos, errores) |
| T067 | T054 |
| T072 a T081 | T036, T037 (reglas de la gracia) |
| T089 | T048 (índice) |
| T111 | todas las tareas de pruebas de las Fases 1 y 2 |

---

## Paralelización

Las tareas marcadas **[P]** tocan archivos distintos y no dependen entre sí.

> **Regla que gobierna la marca.** Escribir el mismo archivo descalifica el paralelismo,
> aunque las tareas sean conceptualmente independientes. Tres grupos perdieron la marca por
> este motivo y **deben hacerse en secuencia**:
>
> | Archivo compartido | Tareas |
> |---|---|
> | `reglas/firestore.rules` | T024, T026, T030, T039 |
> | `functions/src/comun/envio.ts` | T056, T057, T058 |
> | `tests/reglas/firestore/consultas.test.ts` | T050, T051 |

**Fase 0**: T004, T006, T010, T012 y T014 pueden correr en paralelo una vez creado T001.

**Fase 1**: las **pruebas** son paralelizables entre sí porque cada una tiene su archivo:
`{T025, T027, T031, T040}`. Las reglas que esas pruebas ejercitan comparten
`firestore.rules` y van en secuencia.

**Fase 4**: T053, T054, T060 y T061 en paralelo. T056, T057 y T058 escriben el mismo módulo
de envío y van en secuencia sobre la base de T055.

**Fases 5A a 5E**: las cinco funciones son independientes entre sí una vez terminada la
Fase 4. Se pueden repartir entre personas distintas: cada una tiene su propia carpeta.

---

## Estrategia de entrega

**MVP: Fases 0, 1 y 2.** Las reglas de seguridad con sus pruebas, sin ninguna función.

Es un incremento entregable de verdad: deja el perfil de una persona con discapacidad
aislado de cualquier otra cuenta, que es la única barrera técnica que protege datos
sensibles bajo la Ley N.º 25.326. Cubre las historias P1 de aislamiento y alcance (US1, US2,
US3) y no depende de ninguna función.

**Incremento 2: Fases 3, 4 y 5D.** Agrega el alta de acompañante, sin la cual la lista de
autorizados no tiene forma de poblarse y el caso "autorizada permitida" del MVP solo puede
probarse con datos sembrados.

**Incremento 3: Fases 5A y 5C.** Emergencia y borrado en cascada: la función de mayor
consecuencia y el derecho de supresión.

**Incremento 4: Fases 5B, 5E y 6.** Novedades, propagación y publicación. **La 5E no debe
empezar hasta cerrar B-1 y B-2.**

**Cierre: Fases 7 y 8.**
