# Research — Superficie de servidor de Helpi

**Fase**: 0 | **Fecha**: 2026-08-18 | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

Decisiones técnicas con su fundamento, alternativas descartadas y umbral de revisión. Las
divergencias detectadas respecto del modelo de datos compartido se registran acá, **no se
resuelven**: el modelo es la referencia común con `helpi-android` y cambiarlo por cuenta
propia rompería la otra punta.

---

## R-001 — Por qué cada una de las cinco funciones no puede resolverse en el cliente

**Decisión**: se implementan las cinco funciones que la especificación aprobada compromete.

**Fundamento**: el Principio II exige justificación explícita por función. Cuatro de las
cinco **escriben sobre datos a los que el cliente que las origina no tiene acceso**; la
primera requiere credenciales de envío que ningún cliente puede tener.

| # | Función | Por qué el cliente no puede | Requisitos |
|---|---|---|---|
| 1 | Aviso de emergencia por aviso remoto | El envío por FCM exige credenciales de servidor que ningún cliente puede tener. **Corregido**: no lee perfiles ajenos, porque los dispositivos de acompañante cuelgan del propio perfil (D-002) | FR-042 a FR-049 |
| 2 | Publicación de novedades por temas | El envío a un tema exige credenciales de servidor. No hay forma de que un cliente publique a un tema sin poder publicar a cualquiera | FR-050 a FR-053 |
| 3 | Borrado en cascada | Debe eliminar la referencia a la cuenta en `uids_autorizados` de **otros** perfiles (FR-061) y recorrer subcolecciones y Storage. FR-004 le deniega tocar esos perfiles | FR-054 a FR-065 |
| 4 | Alta de acompañante | Escribe en un perfil sobre el que quien canjea el código **todavía no tiene ningún acceso**. Es la definición del problema: si el cliente pudiera hacerlo, la regla de tutor no separaría nada | FR-077 a FR-085 |
| 5 | Propagación de pictograma | Escribe en rutinas de perfiles ajenos al que originó el cambio de etiqueta | FR-066 a FR-073 |

**Alternativas consideradas y descartadas**:

- **Función 4 → intercambio manual de identificadores.** El acompañante muestra su
  identificador de cuenta y la persona usuaria lo agrega a su propia lista. Cero código de
  servidor. Descartada en `spec.md § Clarifications`: exige un canal fuera del servidor y un
  encuentro presencial o una captura, inviable cuando el acompañante es un terapeuta remoto.
- **Función 4 → documento de solicitud validado por reglas.** Descartada por el Principio IV:
  exigiría persistir el código de vinculación, y la constitución prohíbe guardar tokens de
  vinculación en el almacén de documentos.
- **Función 5 → resolver la etiqueta en el cliente.** El catálogo ya se sincroniza al
  dispositivo (FR-022), así que la búsqueda sería local y no costaría ninguna lectura de
  servidor. **Fue la opción recomendada durante la clarificación y quien decide eligió la
  contraria**, conservando la duplicación. Queda registrada acá porque sigue siendo la
  salida si el abanico de escritura resulta inmanejable.

**Umbral de revisión**: si aparece una sexta función, revisar si el Principio II sigue
describiendo la realidad o si la arquitectura cambió de hecho.

---

## R-002 — Estrategia de autorización y su costo

**Decisión**: las reglas evalúan la pertenencia a `uids_autorizados` **leyendo el documento
padre** `usuarios/{uid}` desde la regla del documento hijo.

**Fundamento**: es la única de las tres alternativas que hace efectiva la revocación en la
solicitud inmediatamente posterior, que es lo que exige FR-006 y lo que el Principio V
convierte en el único mecanismo de separación del perfil.

**Costo**: cada `get()` dentro de una regla es **una lectura facturada**. Toda operación
sobre un documento hijo (`rutinas`, `dispositivos`, `pictogramas`, `resumenes`) pasa a
costar su propia lectura más una.

Orden de magnitud, para no discutir a ciegas:

| Escenario | Lecturas extra / mes | Costo mensual aproximado |
|---|---|---|
| 1.000 personas usuarias, 10 aperturas de rutina por día | 300.000 | menos de USD 0,20 |
| 10.000 personas usuarias, 10 aperturas por día | 3.000.000 | cerca de USD 1,80 |

**El costo no es la restricción vinculante a esta escala.** Las restricciones reales son
otras dos: el límite de `get()`/`exists()` por evaluación de regla, y la latencia agregada
en un dispositivo de gama baja con conexión intermitente.

**Alternativas consideradas, diferidas con su umbral**:

| Alternativa | Qué ahorra | Por qué se difiere | Umbral para reconsiderarla |
|---|---|---|---|
| **Claims personalizados en el token** — la lista de perfiles autorizados viaja en el token de autenticación | Elimina por completo la lectura extra | **Rompe FR-006.** Un claim se propaga recién al refrescarse el token, así que una revocación tardaría hasta el próximo refresco. Un acompañante revocado conservaría acceso durante ese lapso. Además el token tiene un límite de tamaño que una persona con muchos vínculos podría alcanzar | Solo si FR-006 se relaja explícitamente para admitir una ventana de revocación. Es un cambio de especificación, no de implementación |
| **Desnormalizar `uids_autorizados` en cada documento hijo** | Elimina la lectura extra sin tocar la semántica de revocación | Cada alta o baja de la lista exige reescribir todos los documentos hijos de ese perfil. Es una escritura en abanico, el mismo patrón que el plan ya señala como el de mayor riesgo (función 5) | Cuando las lecturas extra superen el millón mensual **y** el perfil promedio tenga pocos documentos hijos, de modo que el abanico de una revocación sea acotado |
| **Aplanar la jerarquía** — mover los hijos a colecciones de primer nivel con el uid en el documento | La regla evalúa un campo propio, sin `get()` | Rompe el modelo compartido con `helpi-android` | No corresponde a este repositorio decidirlo |

**Consecuencia de diseño**: las reglas deben minimizar `get()` por evaluación. Cuando una
regla ya leyó el perfil para una comprobación, la misma lectura sirve para las demás
condiciones de esa evaluación.

**Relación con AMB-005**: esta es exactamente la ambigüedad que la especificación dejó
abierta como no bloqueante. Este documento le pone números; la decisión de cambiar de
estrategia sigue pendiente y depende de cifras de uso reales.

---

## R-003 — Índices: qué consulta exige cuál

**Decisión**: se declara **un solo índice explícito**. Las otras dos consultas de la
especificación quedan cubiertas por la indexación automática de campo único.

**Fundamento**: el almacén indexa automáticamente cada campo de un documento, incluidos los
arreglos para consultas de pertenencia. Un índice compuesto hace falta solo cuando una
consulta combina dos dimensiones, y un índice de alcance de grupo de colección hace falta
cuando la consulta cruza subcolecciones del mismo nombre bajo padres distintos.

| Consulta declarada | Requisito | Forma | ¿Índice explícito? |
|---|---|---|---|
| Entradas de catálogo modificadas después de una fecha | FR-022, FR-023 | `vocabularios/{version}/senas` con filtro de rango sobre `fecha_actualizacion` | **No.** Campo único, indexación automática |
| Perfiles cuya lista de autorizados contiene una identidad | FR-062, FR-094 | `usuarios` con pertenencia sobre `uids_autorizados` | **No.** Arreglo de campo único, indexación automática |
| Rutinas de **todos** los perfiles que referencian un pictograma | FR-071, FR-072 | Grupo de colección `rutinas` con pertenencia sobre un arreglo desnormalizado | **Sí.** El alcance de grupo de colección no se indexa automáticamente |
| Rutinas de **un** perfil que referencian un pictograma | FR-070 | `usuarios/{uid}/rutinas` con pertenencia | **No.** Alcance de colección, automático |

**Consecuencia para la especificación**: FR-023 y FR-062 exigen "disponer del índice que
soporta la consulta". Se cumplen sin declarar nada, porque el índice existe por defecto. El
requisito no queda incumplido, pero **`firestore.indexes.json` tendrá una sola entrada**, no
tres. Conviene que quien revise no lo lea como un olvido.

**Caso que sí produciría un índice compuesto**: si la propagación debe **excluir** rutinas
borradas lógicamente, la consulta pasa a combinar pertenencia al arreglo con igualdad sobre
`deleted_at`, y eso ya exige un índice compuesto de alcance de grupo. Ver D-004: la
especificación no dice si las rutinas borradas lógicamente se propagan.

---

## R-004 — Comportamiento del script de publicación ante interrupción

**Decisión**: el **documento `modelos/{version}` es el punto de compromiso**. Los artefactos
en Storage no hacen disponible una versión por sí solos.

**Orden de ejecución**:

1. Validar localmente: que existe `vocabularios/{version}` referenciado, que los hashes del
   manifiesto corresponden a los artefactos, y que la versión no fue publicada antes.
2. Subir modelo, catálogo y manifiesto a rutas nuevas propias de la versión.
3. Verificar los hashes de lo subido contra el manifiesto.
4. Escribir `modelos/{version}`. **Punto de compromiso**: recién acá la versión existe.
5. Aplicar la retención de FR-086 a FR-090: eliminar versiones fuera de las tres más
   recientes, nunca la vigente.
6. Actualizar `config/modelo_activo`. **Último paso, siempre.**

**Fundamento**: Cloud Storage no ofrece transacciones entre objetos, así que la
indivisibilidad de FR-033 no puede lograrse en el almacenamiento. Se logra en la
**observabilidad**: nada consulta Storage por su cuenta; los clientes llegan a los
artefactos a través del documento de versión. Sin ese documento, los objetos subidos son
inertes.

**Comportamiento ante interrupción, por etapa**:

| Interrumpido en | Estado resultante | Recuperación |
|---|---|---|
| 1–3 | Puede haber objetos huérfanos en la ruta de la versión. Ninguna versión disponible | El script informa los huérfanos y **rechaza reutilizar ese número de versión** (FR-034). Se publica con el siguiente |
| 4 | La versión existe y es válida, pero no es la vigente | Reejecutar solo el paso 6, o dejarla como está: una versión publicada y no vigente es un estado legítimo |
| 5 | Retención aplicada parcialmente. Sobran versiones antiguas | Reejecutable sin efectos: eliminar lo ya eliminado no falla |
| 6 | Estado final correcto | — |

**Consecuencia aceptada**: una publicación interrumpida **quema un número de versión**. Es
deliberado. La alternativa —limpiar los huérfanos y reutilizar el número— reintroduce la
sobrescritura que FR-034 prohíbe, y con ella el riesgo de que un dispositivo que alcanzó a
descargar los artefactos de la primera tentativa quede con un modelo que no corresponde a su
catálogo.

**Credenciales y modo de ejecución**: cuenta de servicio con SDK de administración,
ejecutado **únicamente desde integración continua** (Principio XIV). Nunca desde una máquina
local, nunca desde la consola. El script recibe la versión y la ruta de los artefactos que
produce `helpi-ml`; **no los genera ni los entrena**.

**Alternativa descartada**: publicar primero el documento y después los artefactos. Deja una
ventana en la que la versión existe y sus artefactos no, que es precisamente la traducción
incorrecta sin error visible que el Principio VIII busca impedir.

---

## R-005 — Mecanismo de ejecución diferida del borrado

**Decisión**: tarea encolada de **disparo único**, agendada en el momento de la solicitud con
el instante de vencimiento como dato.

**Fundamento**: FR-058 prohíbe el barrido periódico, y FR-074 prohíbe el sondeo en general.
Una tarea encolada se dispara por evento —el vencimiento de su propia programación— y
termina, que es lo que el Principio III admite.

**Cómo se comprueba en el emulador**: FR-108 a FR-110 resuelven el problema sin ningún
mecanismo de control del tiempo. La marca de pendiente lleva su instante de vencimiento, así
que una prueba siembra el estado con un instante ya pasado e invoca el manejador
directamente. **No hace falta un reloj inyectable ni acortar la ventana por configuración.**

**Consecuencia**: el manejador del borrado debe ser invocable de forma independiente del
encolado, para que la prueba de integración pueda ejercitarlo sin depender del programador.

**Riesgo abierto**: si una tarea encolada se pierde, el perfil queda suspendido de forma
indefinida y no hay barrido que lo detecte, porque está prohibido. Es el hallazgo CHK049 del
checklist de validación, sin resolver. La salida conocida —un barrido de reconciliación—
contradice FR-058, así que la decisión no corresponde a este plan.

---

## R-006 — Localización de las rutinas que referencian un pictograma

**Decisión**: la propagación requiere un **arreglo desnormalizado a nivel del documento de
rutina** con los identificadores de pictograma que sus pasos referencian.

**Fundamento**: el modelo compartido embebe actividades y pasos dentro del documento de
rutina. El almacén **no permite filtrar por un campo que está dentro de un arreglo de
mapas**: no existe consulta que devuelva "rutinas cuyo algún paso referencia el pictograma
P" sobre esa forma. Sin un arreglo plano al nivel del documento, cumplir FR-071 exigiría
recorrer todas las rutinas de todos los perfiles, que es exactamente lo que FR-071 prohíbe.

**Consecuencia**: este repositorio **impone un campo nuevo al modelo compartido**. Queda
registrado en [data-model.md](./data-model.md) y en D-001 como divergencia a acordar con
`helpi-android`, porque el cliente es quien escribe las rutinas y por lo tanto quien debe
mantener ese arreglo.

**Alternativa descartada**: que la función recorra todas las rutinas. Descartada por FR-071,
que exige explícitamente no recorrer los perfiles que no referencian el pictograma.

---

## R-007 — Mensajes de datos y depuración de destinos

**Decisión**: los tres envíos de este repositorio se construyen **sin la clave
`notification`**, únicamente con carga de datos.

**Fundamento**: Principio VII y FR-043, FR-052 y FR-096. Una carga de notificación se
muestra sin ejecutar el código del cliente, lo que saltearía las franjas de silencio y el
modo de bajo estímulo. En una aplicación de accesibilidad eso no es una molestia: es un
estímulo no consentido.

**Cómo se verifica sin dispositivo**: la construcción del mensaje se aísla en
`functions/src/comun/envio.ts` y se prueba sobre la estructura resultante. La prueba afirma
la **ausencia** de la clave. Esto hace verificable en el emulador un requisito que de otro
modo exigiría un teléfono.

**Depuración de destinos** (FR-046): ocurre dentro de las funciones de envío ya
comprometidas, como reacción al fallo de una entrega. No es una capacidad aparte y **no
tiene disparador propio**, porque tenerlo la convertiría en el sondeo que FR-074 prohíbe.

**Cómo se simula el proveedor de envío en pruebas**: es el hallazgo CHK054, abierto. La
opción viable es aislar el envío detrás de una interfaz e inyectar un doble que devuelva el
fallo de destino inválido, dejando la lógica de depuración verificable sin salir del
emulador. Se registra acá; la decisión corresponde a `/speckit-tasks`.

---

## Divergencias respecto del modelo de datos compartido

Contrastadas contra `Documentacion/modelo_datos_firebase_helpi.md`. **No se resuelven acá.**
El modelo es la referencia común con `helpi-android` y cada divergencia necesita acuerdo
entre ambos repositorios.

> **Corrección del 2026-08-18.** La primera versión de esta sección declaró dos divergencias
> que no existen y omitió cinco que sí. Se rehízo contra el documento real.

### D-001 — Falta el arreglo de pictogramas referenciados en la rutina *(confirmada, y más grave de lo previsto)*

El modelo embebe `pasos` dentro de `actividades`, y `actividades` dentro de la rutina: el
identificador de pictograma queda **doblemente anidado** en
`actividades[].pasos[].id_pictograma`. Firestore no permite filtrar por un campo dentro de un
arreglo de mapas, así que **no existe consulta** que devuelva las rutinas que referencian un
pictograma.

El propio modelo, en su sección *Consecuencia de desnormalizar*, resuelve el problema con una
función disparada por la escritura del pictograma, pero **no advierte que primero hay que
poder encontrar las rutinas afectadas**. Sin un arreglo plano al nivel del documento de
rutina, FR-069 obliga a recorrer todas las rutinas de todos los perfiles, que es justo lo que
prohíbe.

**Hace falta**: `pictogramas_referenciados: string[]` en el documento de rutina, mantenido
por el cliente, que es quien escribe las rutinas.

### D-002 — Los dispositivos del acompañante cuelgan del perfil de la persona usuaria

El modelo define `usuarios/{id}/dispositivos/{id}` con `tipo: USUARIO | TUTOR`: **el token
del acompañante vive bajo el perfil de la persona usuaria**, no bajo el suyo propio.

El plan y los contratos asumían lo contrario y hacían que la función de emergencia leyera
`usuarios/{autorizado}/dispositivos/*`. Es una ruta que el modelo no usa, y su corrección
**simplifica la función**: deja de haber lectura cruzada de perfiles.

**Consecuencia sobre R-001**: la justificación de la función 1 frente al Principio II ya no
puede apoyarse en que lee perfiles ajenos. La razón que queda en pie, y alcanza, es que el
envío exige credenciales de servidor que ningún cliente puede tener.

### D-003 — El vínculo tiene dos representaciones y la especificación solo modela una

El modelo guarda el vínculo dos veces: el arreglo embebido `tutores[]` —con `uid`, `nombre`,
`parentesco`, `telefono`, `email`, `estado: ACTIVO | INACTIVO`— y el arreglo plano
`uids_autorizados[]` que evalúan las reglas.

La especificación solo modela el segundo. Quedan sin definir:

- si la función de alta escribe **ambos** arreglos,
- si revocar quita de `uids_autorizados`, pone `estado: INACTIVO` en `tutores[]`, o las dos
  cosas,
- qué pasa si los dos arreglos se desincronizan.

**Efecto colateral favorable**: el "nombre visible de la cuenta al vincularse" que exige
FR-093 **ya existe** en `tutores[].nombre`. La primera versión de este documento lo declaró
faltante, y era falso.

### D-004 — Falta la marca de pendiente de eliminación

FR-054 a FR-057 y FR-097 a FR-099 exigen marcar el perfil como pendiente, con su instante de
vencimiento, y exponer un indicador legible solo por la propietaria. **El modelo no tiene
nada de eso**: en su sección *Pendientes* menciona el borrado en cascada, pero no contempla
ninguna ventana de gracia.

La colección `eliminaciones_pendientes/{uid}` que propone `data-model.md` es una **adición
completa** al modelo compartido, y `helpi-android` necesita conocerla para mostrar el estado.

### D-005 — El borrado lógico no interactúa con nada de la especificación

El modelo aplica `deleted_at` en **tres niveles**: rutina, actividad y paso. La
especificación no lo menciona ni una vez. Quedan sin definir:

- si la propagación de pictogramas alcanza a los pasos borrados lógicamente,
- si el borrado en cascada de FR-059 elimina físicamente lo ya borrado lógicamente.

La primera pregunta además decide si hace falta un índice compuesto (R-003).

### D-006 — `pictograma_origen: APK` no está contemplado

El modelo distingue tres orígenes: `APK`, `GLOBAL` y `PERSONAL`. Los del banco base viajan
dentro de la aplicación y **no están en Firestore**. La propagación de FR-066 a FR-073 debe
saltearlos, y ningún requisito lo dice.

### D-007 — El modo invitado sí tiene documento en el servidor

El modelo define `modo: INVITADO | REGISTRADO` dentro de `usuarios/{id}`, o sea que una
persona en modo invitado **sí tiene perfil en Firestore**. La especificación asumía lo
contrario al declarar el modo invitado como comportamiento puramente local. Ningún requisito
liga `modo` a ninguna regla, y hace falta decidir si condiciona algún acceso.

### D-008 — Divergencias de nomenclatura

Cuatro nombres de los contratos no coinciden con el modelo. El modelo manda.

| En los contratos | En el modelo | Dónde corregir |
|---|---|---|
| `token` | `token_fcm` | `contracts/documentos.md` |
| `vocabulario_version` | `version_vocabulario` | `contracts/manifiesto.md` |
| `version_minima_app` | `min_version_app` | `contracts/manifiesto.md` |
| `rutas{}` y `hashes{}` | `storage_path` y `hash`, singulares | `contracts/manifiesto.md` |

`deleted_at` es el único campo en inglés de todo el modelo, contra la convención de nombres
de dominio en español de la constitución. Se registra por consistencia; corregirlo es un
cambio del modelo compartido.

### D-009 — El manifiesto de publicación es una adición estructural

El modelo pone `hash` y `storage_path` **dentro de `modelos/{version}`** y no contempla
ningún artefacto de manifiesto separado. FR-035 exige uno.

Es una adición defendible —permite verificar la integridad antes de reemplazar el modelo
activo— pero es una adición, no una derivación, y `helpi-android` debe conocerla para
consumirla.

### D-010 — Falta la zona de Storage de los pictogramas globales

El modelo ubica los pictogramas globales en `pictogramas/higiene/cepillar.webp`. La matriz de
reglas de `contracts/reglas-matriz.md` solo declara `modelos/**` y `usuarios/**`, así que con
la denegación por defecto **las imágenes globales quedan inalcanzables**.

Falta también decidir la ruta de `img_perfil` y de `audio_path`, que el modelo declara como
rutas de Storage sin fijar su prefijo.
