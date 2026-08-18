# Quickstart — levantar, sembrar y verificar

**Fase**: 1 | **Plan**: [plan.md](./plan.md)

Cómo llevar este repositorio de cero a haber verificado cada regla y cada función **sin
dispositivo, sin proyecto real y sin intervención humana**. Ese es el criterio maestro de la
especificación, y este documento es su comprobación operativa.

> Este documento es una guía de validación. Los detalles de forma están en
> [contracts/](./contracts/); el desglose de trabajo va a `tasks.md`, que genera
> `/speckit-tasks`.

---

## 1. Requisitos previos

- Node 22 (LTS). La versión se fija en `engines` de `functions/package.json`.
- Firebase CLI.
- Java, que el Emulator Suite necesita para Firestore y Storage.

**Nunca se apunta al proyecto real.** Todo corre contra el emulador (Principio XII).

---

## 2. Levantar el emulador

```bash
firebase emulators:start --only firestore,storage,auth,functions
```

Verificación: la interfaz del emulador lista los cuatro servicios y las cinco funciones
aparecen registradas. Si falta alguna, el problema está en las exportaciones de
`functions/src/index.ts`.

---

## 3. Sembrar datos de prueba

El sembrado usa **credenciales de administración** y ocurre siempre en el preparado, nunca
dentro de una aserción (Principio XII).

Cuatro identidades, una por clase de solicitante de
[contracts/reglas-matriz.md](./contracts/reglas-matriz.md):

| Identidad | Rol |
|---|---|
| `propietaria` | dueña del perfil bajo prueba |
| `autorizada` | figura en `uids_autorizados` de ese perfil |
| `ajena` | autenticada, sin autorización |
| *(sin identidad)* | no autenticada |

Estado mínimo a sembrar:

- `usuarios/propietaria` con `uids_autorizados: ["autorizada"]`
- una rutina, un dispositivo, un pictograma y un resumen bajo ese perfil
- `usuarios/segunda` con `uids_autorizados: ["propietaria"]`, para los casos de
  eliminación que tocan perfiles ajenos
- `vocabularios/v1/senas` con entradas de distinta `fecha_actualizacion`, incluida una
  retirada
- `modelos/v1` y `config/modelo_activo`

**Sin reglas permisivas.** `allow read, write: if true` está prohibido incluso para sembrar
(Principio XII): el sembrado va por SDK de administración, que no evalúa reglas.

---

## 4. Verificar las reglas

```bash
npm run test:reglas
```

Recorre [contracts/reglas-matriz.md](./contracts/reglas-matriz.md). **Una prueba por celda**,
con el caso permitido y el denegado juntos: probar solo el permitido no verifica nada, porque
una regla que autoriza a todos también lo pasa (NFR-006).

Escenarios que conviene mirar a mano la primera vez, porque son los que más fácil se rompen
en un refactor:

| Escenario | Resultado esperado | Requisitos |
|---|---|---|
| `autorizada` lee `usuarios/propietaria/rutinas/*` | permitido | FR-003 |
| `autorizada` lee `usuarios/propietaria/resumenes/*` | **permitido** — consultar el cumplimiento es su razón de ser | FR-103 |
| `autorizada` **escribe** `usuarios/propietaria/resumenes/*` | denegado | FR-104 |
| `ajena` lee cualquier ruta del perfil | denegado, sin revelar si existe | FR-004, FR-006 |
| sin identidad, cualquier ruta | denegado | FR-005 |
| `autorizada` agrega una identidad a `uids_autorizados` | denegado | FR-085 |
| `propietaria` agrega una identidad a `uids_autorizados` | **denegado** — solo la función 4 | FR-085 |
| escritura de rutina sin `actualizada_por` | rechazada | FR-014 |
| escritura de rutina con autoría ajena a la identidad autenticada | rechazada | FR-016 |
| escritura de resumen con una glosa adentro | rechazada | FR-101 |
| segundo resumen para el mismo día | rechazada — el id del documento es la fecha | FR-105 |
| escritura en una ruta de Storage inventada | denegada — la ruta no existe | FR-031 |

---

## 5. Verificar la ventana de gracia sin esperar 30 días

Es el caso que hace operativo el criterio maestro. **No hace falta reloj inyectable ni
acortar la ventana por configuración**: el vencimiento es un instante absoluto (FR-107 a
FR-110), así que se siembra ya pasado.

1. Sembrar `eliminaciones_pendientes/propietaria` con `vence_en` **en el futuro**.
   - `propietaria` lee cualquier ruta de su perfil → **denegado** (FR-056)
   - `autorizada` lee cualquier ruta → **denegado** (FR-056)
   - `propietaria` lee `eliminaciones_pendientes/propietaria` → **permitido** (FR-097)
   - `autorizada` lee ese mismo documento → **denegado** (FR-097)
   - `propietaria` lee `eliminaciones_pendientes/segunda` → **denegado**
2. Invocar la cancelación → el documento desaparece y el acceso vuelve (FR-057, SC-028).
3. Sembrar de nuevo con `vence_en` **en el pasado** e invocar el manejador del borrado
   directamente, sin pasar por el encolado.
   - el subárbol del perfil deja de existir (FR-059)
   - los archivos por cuenta dejan de devolver contenido (FR-060)
   - `usuarios/segunda.uids_autorizados` ya no contiene `propietaria` (FR-061)
   - **los archivos que `propietaria` escribió en `usuarios/segunda/`** siguen existiendo
     (FR-091)
4. Reejecutar el manejador sobre la cuenta ya borrada → termina sin error y sin efectos
   (FR-064, SC-019).

---

## 6. Verificar las funciones

```bash
npm run test:funciones
```

Al menos una prueba de integración por función, contra el emulador.

| Función | Qué se afirma | Requisitos |
|---|---|---|
| 1 · Aviso de emergencia | Se emite un envío por dispositivo de tipo acompañante registrado **bajo el propio perfil**; **el mensaje no tiene clave `notification`**; el contenido no lleva datos sensibles; **tras procesar, ningún almacén tiene registro del evento** | FR-042 a FR-049 |
| 1 · destino inválido | El destino se elimina del perfil y los demás reciben su envío igual | FR-046, FR-047 |
| 2 · Novedad por tema | Se emite al tema; el mensaje anuncia disponibilidad y no transporta el contenido; sin clave `notification` | FR-050 a FR-053 |
| 3 · Borrado en cascada | Ver § 5 | FR-054 a FR-065 |
| 4 · Alta de acompañante | Un código vigente agrega la identidad; el acceso pasa de denegado a permitido | FR-077 a FR-080 |
| 4 · rechazos | Código vencido, ya canjeado, manipulado e inexistente devuelven **el mismo código y el mismo cuerpo**; el rechazo por límite de tasa también | FR-081, FR-106 |
| 4 · límite de tasa | Al sexto intento fallido en una hora se rechaza aunque el código sea válido, en cualquiera de los dos ejes de conteo | FR-084 |
| 5 · Propagación | Las rutinas de dos perfiles distintos reflejan la etiqueta nueva; **ningún otro campo cambió**; ninguna lista de autorizados cambió; reejecutar no produce efectos | FR-066 a FR-073 |

**Ninguna prueba puede construir un mensaje con carga de notificación**, ni siquiera para
comprobar que se rechaza (Principio VII). La afirmación es sobre la **ausencia** de la clave.

**Sin mezclar credenciales.** El sembrado con administración va en el preparado; la aserción
usa la identidad de test que corresponde.

---

## 7. Verificar el script de publicación

```bash
npm run publicar -- --version v2 --artefactos <ruta> --emulador
```

| Escenario | Resultado esperado | Requisitos |
|---|---|---|
| Publicación completa | Los tres artefactos quedan disponibles y `config/modelo_activo` apunta a `v2` | FR-032, FR-033 |
| Republicar `v2` | **Rechazado**, artefactos existentes intactos | FR-034 |
| Interrumpir antes de escribir `modelos/v2` | La versión **no** figura disponible; los objetos subidos quedan huérfanos e inertes; el número de versión queda quemado | FR-033, R-004 |
| Anunciar vigente una versión sin su vocabulario | **Rechazado**, el indicador conserva su valor | FR-037 |
| Revertir a `v1` | Se completa cambiando solo `config/modelo_activo`, sin republicar nada | FR-039 |
| Publicar una cuarta versión | Quedan 3, más la vigente si cayera fuera de la ventana | FR-086 a FR-088 |
| Cliente intenta escribir en `modelos/**` | Denegado | FR-029 |

---

## 8. Verificación completa

```bash
npm run verificar        # tipos + reglas + funciones
```

Es lo que corre integración continua en cada solicitud de incorporación. Los tres deben
estar en verde para fusionar, sin excepciones manuales.

**El despliegue a producción no ocurre acá.** Es una acción deliberada, disparada
manualmente desde integración continua, nunca desde una máquina local (Principio XIV).

---

## Qué no se puede verificar todavía

Dos huecos conocidos, ambos registrados como hallazgos abiertos en
[checklists/validacion.md](./checklists/validacion.md):

- **Simulación del proveedor de envío** (CHK054). Que un destino resulte inválido depende de
  una respuesta externa. La salida propuesta en [research.md](./research.md) § R-007 es
  aislar el envío detrás de una interfaz e inyectar un doble, pero la decisión corresponde a
  `/speckit-tasks`.
- **Volumen del abanico de la propagación** (CHK008, CHK062). No hay cota declarada de
  perfiles alcanzados ni comportamiento definido al exceder el tiempo de ejecución, así que
  tampoco hay un escenario de prueba que fije el límite.
