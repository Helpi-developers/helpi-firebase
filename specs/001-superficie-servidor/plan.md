# Implementation Plan: Superficie de servidor de Helpi

**Branch**: `001-superficie-servidor` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-superficie-servidor/spec.md`

## Summary

Este repositorio implementa el perímetro de servidor de Helpi: **reglas de seguridad** que
aíslan el perfil de una persona con discapacidad, **cinco funciones de pegamento** que
resuelven lo que ningún cliente puede hacer por sí mismo, **un índice** derivado de una
consulta declarada, y **un script de publicación** que deja modelo y catálogo disponibles
como una unidad.

El enfoque técnico se apoya en tres decisiones que Phase 0 justifica en detalle:

1. **La autorización se evalúa leyendo `uids_autorizados` del documento padre** desde las
   reglas. Es la única alternativa que hace efectiva la revocación en la solicitud siguiente
   (FR-006); las alternativas más baratas se descartan por eso, no por costo.
2. **Los artefactos de Storage no son el punto de compromiso de una publicación.** El
   documento `modelos/{version}` lo es. Eso convierte una operación no transaccional en una
   indivisible desde el resultado observable (FR-033).
3. **La propagación de pictogramas obliga a agregar un campo al modelo compartido.** Los
   pasos están embebidos dentro de las rutinas y el almacén no permite filtrar por un campo
   dentro de un arreglo de mapas, así que localizar las rutinas que referencian un
   pictograma exige un arreglo desnormalizado a nivel del documento de rutina.

## Technical Context

**Language/Version**: TypeScript 5.x sobre Node 22 (LTS), fijado en `engines` de
`functions/package.json`

**Primary Dependencies**: `firebase-functions` v2 (2.ª generación), `firebase-admin`;
`@firebase/rules-unit-testing` para pruebas de reglas

**Storage**: Firestore (documentos) y Cloud Storage (artefactos y archivos por cuenta). El
modelo de datos es compartido con `helpi-android` y este repositorio no lo rediseña

**Testing**: Firebase Emulator Suite (Firestore, Storage, Auth, Functions).
`@firebase/rules-unit-testing` para reglas; pruebas de integración por función contra el
emulador. Sin dispositivo, sin proyecto real

**Target Platform**: Cloud Functions 2.ª generación, disparadores de evento y llamables

**Project Type**: Superficie de servicios administrados. Sin cliente web, sin API REST
pública

**Performance Goals**: No hay objetivo de latencia declarado en la especificación. La
restricción real es de **volumen**: NFR-005 prohíbe rutas de escritura de alta frecuencia y
FR-104 limita el agregado a una escritura por perfil y por día

**Constraints**: Toda regla se verifica contra el emulador sin intervención humana
(criterio maestro de la spec). Toda función se dispara por evento y termina (FR-074 a
FR-076). El despliegue a producción ocurre solo desde integración continua

**Scale/Scope**: 109 requisitos funcionales, 8 no funcionales, 39 criterios de éxito, 10
historias. 5 funciones, 2 archivos de reglas, 1 índice explícito, 1 script de publicación

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verificación contra `.specify/memory/constitution.md` v1.0.0.

| Principio | Estado | Cómo lo satisface el plan |
|---|---|---|
| I. La especificación manda | ✅ | Cada artefacto de este plan declara los FR que lo originan. Ningún componente sin traza |
| II. Ejecución local primero | ⚠️ **Violación documentada** | La constitución compromete **tres** funciones; la spec aprobada llegó a **cinco**. Ver Complexity Tracking |
| III. Funciones como pegamento liviano | ✅ | Ninguna función contiene lógica de dominio. Las cinco son movimiento de datos y envío. Sin sondeo |
| IV. Privacidad como restricción dura | ⚠️ **Tensión abierta** | Sin rutas para video, keypoints, glosas ni credenciales. Pero FR-093 conserva el nombre visible de una cuenta eliminada. Ver Complexity Tracking |
| V. La regla de tutor | ✅ | `uids_autorizados` evaluado sobre el documento padre es el único mecanismo. Cuatro pruebas por regla |
| VI. Prueba de permitido y denegado | ✅ | La matriz de reglas en `contracts/reglas-matriz.md` fija los cuatro casos por ruta |
| VII. FCM solo con mensajes de datos | ✅ | Los tres contratos de FCM en `contracts/fcm-payloads.md` prohíben la clave `notification` |
| VIII. Publicación atómica | ✅ | El script valida antes de publicar y usa el documento de versión como punto de compromiso |
| IX. Dos zonas de Storage | ✅ | Definidas en `contracts/reglas-matriz.md`, sin solapamiento ni hueco |
| X. Colecciones globales de solo lectura | ✅ | Escritura únicamente con credenciales de administración |
| XI. El tutor no alcanza la traducción | ✅ | `resumenes/{fecha}` queda fuera del alcance autorizado |
| XII. Pruebas contra el emulador | ✅ | Sin reglas permisivas, credenciales de test explícitas, sin mezclar administración y usuario |
| XIII. Manejo de errores explícito | ✅ | Registrar y relanzar. Cloud Logging y Error Reporting. Sin Sentry |
| XIV. Despliegue solo desde CI | ✅ | Flujo de despliegue manual disparado desde CI |
| XV. Sin propagación instantánea | ✅ | Ninguna regla depende del orden de llegada de dos escrituras |
| XVI. Sin código en fase de planificación | ✅ | Este comando genera solo documentos |

**Resultado del gate**: pasa con **dos violaciones documentadas** en Complexity Tracking.
Ninguna es silenciosa: ambas provienen de decisiones explícitas registradas en
`spec.md § Clarifications`.

## Project Structure

### Documentation (this feature)

```text
specs/001-superficie-servidor/
├── plan.md              # Este archivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1: solo lo que este repositorio agrega o restringe
├── quickstart.md        # Phase 1: levantar emulador, sembrar y verificar
├── contracts/           # Phase 1
│   ├── documentos.md        # Formas de documento que leen y escriben las funciones
│   ├── fcm-payloads.md      # Mensaje de datos por función que notifica
│   ├── manifiesto.md        # Manifiesto de publicación y documento de versión
│   └── reglas-matriz.md     # Matriz de rutas por rol, permitido y denegado
├── checklists/
│   ├── requirements.md
│   └── validacion.md
└── tasks.md             # Phase 2 (/speckit-tasks — no lo crea este comando)
```

### Source Code (repository root)

```text
functions/
├── src/
│   ├── index.ts                      # Único punto de exportación de las 5 funciones
│   ├── aviso-emergencia/             # Función 1 — FR-042 a FR-049
│   ├── novedades-tema/               # Función 2 — FR-050 a FR-053
│   ├── borrado-cascada/              # Función 3 — FR-054 a FR-065, FR-091 a FR-099
│   ├── alta-acompanante/             # Función 4 — FR-077 a FR-085, FR-105
│   ├── propagacion-pictograma/       # Función 5 — FR-066 a FR-073
│   └── comun/
│       ├── tipos.ts                  # Formas de documento (contracts/documentos.md)
│       ├── errores.ts                # Registrar y relanzar — Principio XIII
│       ├── envio.ts                  # Construcción de mensajes de datos + depuración de destinos
│       └── vencimientos.ts           # Instantes absolutos — FR-106 a FR-109
├── test/
│   └── integracion/                  # Una prueba por función contra el emulador
├── package.json
└── tsconfig.json

reglas/
├── firestore.rules                   # FR-001 a FR-024, FR-056 a FR-057, FR-097 a FR-104
└── storage.rules                     # FR-025 a FR-031

indices/
└── firestore.indexes.json            # Un índice de alcance de grupo — FR-072

scripts/
└── publicar-modelo/                  # FR-032 a FR-041, FR-086 a FR-090

tests/
└── reglas/
    ├── firestore/                    # Cuatro casos por regla
    └── storage/

.github/workflows/
├── verificacion.yml                  # Tipos + reglas + funciones en cada PR
└── despliegue.yml                    # Manual, solo desde CI — Principio XIV

firebase.json
.firebaserc
```

**Structure Decision**: separación por responsabilidad, como pide la entrada. Cada carpeta
de primer nivel corresponde a una clase de artefacto que este repositorio contiene y a un
tipo de prueba distinto: `functions/` se prueba con integración contra el emulador,
`reglas/` con pruebas unitarias de reglas, `scripts/` con su propia prueba de publicación e
interrupción. `functions/src/comun/` existe únicamente para lo que comparten dos o más
funciones; no es una capa de dominio, que por el Principio III no vive acá.

Las reglas y los índices se separan de `functions/` a propósito: se despliegan con un ciclo
propio, no requieren compilación, y mezclarlos con el código de funciones invita a que una
prueba de reglas termine importando código de funciones.

## Trazabilidad de artefactos

Cada componente se origina en requisitos concretos. Un componente sin fila acá no debe
existir.

| Componente | Requisitos | Historia |
|---|---|---|
| `reglas/firestore.rules` — perfil | FR-001 a FR-017 | 1, 2 |
| `reglas/firestore.rules` — colecciones globales | FR-018 a FR-021 | 5 |
| `reglas/firestore.rules` — gracia y agregado | FR-056, FR-057, FR-097 a FR-104 | 7 |
| `reglas/storage.rules` | FR-025 a FR-031 | 3 |
| `indices/firestore.indexes.json` | FR-023, FR-072 | 5, 9 |
| `functions/src/aviso-emergencia/` | FR-042 a FR-049 | 4 |
| `functions/src/novedades-tema/` | FR-050 a FR-053 | 8 |
| `functions/src/borrado-cascada/` | FR-054 a FR-065, FR-091 a FR-096 | 7 |
| `functions/src/alta-acompanante/` | FR-077 a FR-085, FR-105 | 10 |
| `functions/src/propagacion-pictograma/` | FR-066 a FR-073 | 9 |
| `functions/src/comun/vencimientos.ts` | FR-106 a FR-109 | 7, 10 |
| `scripts/publicar-modelo/` | FR-032 a FR-041, FR-086 a FR-090 | 6 |
| `.github/workflows/` | NFR-006, Principios XII y XIV | — |

## Decisiones y restricciones de implementación

Las justificaciones completas están en [research.md](./research.md); acá queda lo que
gobierna el código.

1. **La autorización se resuelve con una lectura dentro de la regla.** Una función auxiliar
   de reglas lee `usuarios/{uid}` y evalúa pertenencia a `uids_autorizados`. Se acepta el
   costo de una lectura facturada por acceso a documento hijo. No se implementan ahora ni
   claims personalizados ni desnormalización (R-002).
2. **El punto de compromiso de una publicación es el documento `modelos/{version}`.** Los
   artefactos de Storage subidos sin ese documento son inertes: nada los referencia. Una
   interrupción no deja una versión utilizable a medias (R-004).
3. **Toda función es idempotente y reintentable.** Los disparadores de evento pueden
   entregar más de una vez; FR-064 y FR-073 ya lo exigen para dos de ellas, y el plan lo
   extiende a las cinco por consistencia.
4. **Ningún `catch` vacío.** Registrar con contexto y relanzar, o responder con el código
   apropiado en las funciones llamables. Sin datos personales identificables en los
   registros (FR-049).
5. **Todo vencimiento viaja como instante absoluto en el dato que vence.** Ninguna función
   ni regla calcula una duración en el momento de la comprobación (FR-106 a FR-109). Es lo
   que hace que una prueba pueda sembrar el estado vencido.
6. **El disparo diferido del borrado es una tarea encolada de disparo único**, nunca un
   barrido periódico (FR-058). Ver R-005 para la elección del mecanismo y su comprobación
   en el emulador.
7. **Las reglas deniegan por defecto.** La raíz cierra todo y cada ruta se abre
   explícitamente. Es lo que garantiza FR-031 y FR-030: una ruta no declarada no existe.

## Complexity Tracking

| Violación | Por qué es necesaria | Alternativa más simple, y por qué se rechazó |
|---|---|---|
| **Cinco funciones en lugar de las tres comprometidas** (Principio II) | Las funciones 4 y 5 son escrituras sobre perfiles ajenos al que las origina. Ningún cliente puede hacerlas: quien canjea un código todavía no figura en ninguna lista de autorizados, y quien renombra un pictograma no tiene acceso a las rutinas de otros perfiles | Función 4: que la persona usuaria agregue el identificador del acompañante a mano. Rechazada en `spec.md § Clarifications` por inviable fuera de un encuentro presencial. Función 5: que el cliente resuelva la etiqueta contra el catálogo que ya sincroniza. Recomendada durante la clarificación y **rechazada explícitamente** por quien decide, que optó por conservar la duplicación |
| **FR-093 conserva el nombre visible de una cuenta eliminada** (Principio IV) | Permite a la persona usuaria entender quién modificó sus rutinas después de que ese acompañante cerró su cuenta | Guardar solo la marca de cuenta eliminada de FR-092. Está registrada como revisable en `spec.md § Assumptions`; no se resolvió porque la decisión fue conservar el nombre. **Requiere confirmación de un revisor antes de implementar** |

Ambas violaciones nacen de decisiones explícitas y registradas, no de deriva de diseño.

**Acción de gobernanza pendiente**: la constitución v1.0.0 sigue describiendo la superficie
comprometida como tres funciones. Corresponde una enmienda MINOR que la lleve a cinco, o
dejar constancia de por qué no se enmienda, **antes** de `/speckit-implement`.
