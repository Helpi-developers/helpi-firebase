# Feature Specification: Superficie de servidor de Helpi

**Feature Branch**: `001-superficie-servidor`

**Created**: 2026-08-18

**Last Updated**: 2026-08-18

**Status**: Draft

**Input**: User description: "Especificar la superficie de servidor de Helpi. Este repositorio contiene exclusivamente funciones de servidor, reglas de seguridad del almacén de documentos y del almacén de archivos, índices, configuración del entorno de emulación y el script de publicación de modelos. No contiene ni especifica ninguna funcionalidad de la aplicación del dispositivo."

---

## Contexto y perímetro

El dispositivo de Helpi es autónomo. El servidor existe para resolver únicamente lo que el
dispositivo no puede saber por sí mismo. Esta especificación describe ese perímetro en
términos de **comportamiento observable del servidor**.

**Naturaleza de los datos.** Datos de salud y discapacidad, sensibles bajo la Ley
N.º 25.326 de Argentina.

### Regla de redacción

Estas tres reglas gobiernan cada enunciado del documento. Un requisito que las incumpla no
pertenece a esta especificación.

1. **Verificable contra el entorno de emulación, sin dispositivo.** Cada requisito se
   comprueba emitiendo una solicitud y observando el resultado del servidor. Si un
   enunciado no puede probarse así, no está acá.
2. **El cliente es no confiable y anónimo.** Se describe qué se le **permite** y qué se le
   **deniega**. Nunca qué hace internamente, cómo decide, ni cómo presenta la información.
3. **Los resultados se expresan como permitido / denegado / aceptado / rechazado /
   presente / ausente.** No como intención, experiencia ni estado del dispositivo.

### Superficie comprometida

La arquitectura acota el servidor a **cinco funciones**:

| # | Función | Disparador |
|---|---|---|
| 1 | Aviso a contactos de confianza | Evento de emergencia |
| 2 | Publicación de novedades por temas | Publicación de contenido nuevo |
| 3 | Borrado en cascada al eliminar una cuenta | Solicitud de eliminación, cancelación, y vencimiento de la ventana de gracia |
| 4 | Alta de un acompañante en la lista de autorizados | Canje de un código de vinculación |
| 5 | Propagación de los datos duplicados de un pictograma | Cambio de etiqueta o ubicación de un pictograma |

Todo lo demás se resuelve con **reglas de acceso, índices de consulta y el proceso de
publicación**, sin código de servidor en ejecución.

Las funciones 4 y 5 se incorporaron por decisión explícita registrada en
`## Clarifications`. Su justificación frente al Principio II:

- **Función 4**: es una escritura sobre el perfil de otra cuenta, que ningún cliente puede
  realizar por definición, porque quien canjea el código todavía no figura en ninguna lista
  de autorizados.
- **Función 5**: es una escritura sobre documentos de perfiles ajenos al que originó el
  cambio; ningún cliente tiene acceso a esos perfiles.

> **Nota de riesgo sobre la función 5.** Es la única operación del repositorio que escribe
> en abanico sobre perfiles de terceros con credenciales de administración, es decir, la
> única que por diseño elude la regla que separa un perfil de otro. Los requisitos FR-066 a
> FR-073 acotan qué puede tocar; su revisión es obligatoria ante cualquier cambio.

### Actores

Los actores son **clases de solicitante**, no personas. Cada regla se verifica contra las
cuatro primeras.

| Actor | Definición operativa |
|---|---|
| **Cliente propietario** | Autenticado; su identidad coincide con el identificador del perfil solicitado. |
| **Cliente autorizado** | Autenticado; su identidad figura en la lista de autorizados del perfil solicitado. |
| **Cliente no autorizado** | Autenticado; no es propietario ni figura en la lista de autorizados. |
| **Cliente no autenticado** | Sin identidad. |
| **Proceso de publicación** | Opera con credenciales de administración. Queda **fuera del alcance de las reglas de cliente**; su comportamiento se verifica por separado. |

---

## Clarifications

### Session 2026-08-18

- Q: ¿Cómo llega la cuenta de un acompañante a la lista de autorizados de un perfil, si esa cuenta todavía no tiene ningún acceso a ese perfil? (AMB-001) → A: Cuarta función. El acompañante presenta un código de vinculación; la función lo valida con credenciales de administración y agrega su identidad a la lista. El código se emite firmado y con vencimiento, y no se persiste en ningún almacén. La superficie pasa de tres a cuatro funciones.
- Q: Cuando cambia la etiqueta o la ubicación de un pictograma, ¿cómo quedan al día las copias de ese dato dentro de los pasos de rutina? (AMB-007) → A: Quinta función. Un cambio de pictograma dispara una función que actualiza las copias en las rutinas de todos los perfiles afectados, con credenciales de administración. Se conserva la duplicación del dato dentro del paso. La superficie pasa de cuatro a cinco funciones.
- Q: ¿Cómo se comprueba en el entorno de emulación que algo venció, sin esperar los 30 días de la gracia ni los 10 minutos del código? (Historia 7, FR-078, FR-084) → A: Todo vencimiento se expresa como un instante absoluto presente en el dato que vence, nunca como una duración implícita. Una prueba siembra el estado con un instante ya pasado y obtiene el mismo resultado que si hubiera esperado la ventana real. Sin reloj inyectable ni configuración de duraciones.
- Q: ¿Qué vigencia tiene el código de vinculación y cuántos intentos de canje fallidos se admiten? (FR-078, FR-084) → A: Vigencia de 10 minutos. Se rechazan los canjes posteriores a 5 intentos fallidos en una hora, contados en dos ejes independientes —por cuenta solicitante y por perfil emisor—, aplicando el que se alcance primero. El rechazo por límite es indistinguible del rechazo por código inválido.
- Q: ¿Quién puede disparar el evento de emergencia de un perfil? (FR-042, FR-048) → A: Únicamente el cliente propietario, sobre su propio perfil. Se deniega a las cuentas autorizadas, a los autenticados no autorizados y a las solicitudes no autenticadas: estar en la lista de autorizados no habilita este disparo.
- Q: ¿Qué contiene el ámbito de traducción que FR-013 impide leer a una cuenta autorizada, si NFR-001 prohíbe almacenar secuencias de señas y contenido de conversaciones? (FR-012, FR-013, NFR-001) → A: Solo un agregado diario de conteos y duraciones, sin glosas, texto ni transcripción. Legible y escribible únicamente por el propietario, denegado a las cuentas autorizadas. Lo prohibido por NFR-001 no tiene ruta definida; el agregado sí, y sobre él opera la regla de FR-013.
- Q: Durante la ventana de gracia, ¿qué operaciones quedan permitidas sobre un perfil marcado como pendiente de eliminación? (FR-056, FR-057) → A: Solo dos, y ambas reservadas al propietario: cancelar la eliminación, y leer un indicador de estado que contiene únicamente si el perfil está pendiente y la fecha de vencimiento. Todo lo demás se deniega, incluidas las cuentas autorizadas.
- Q: Cuando un acompañante elimina su propia cuenta, ¿qué pasa con los audios y pictogramas que grabó dentro de la zona por cuenta del perfil al que acompañaba? (AMB-004) → A: Se conservan en el perfil de destino, cuyo propietario es su dueño. De la cuenta eliminada sobrevive el nombre visible que tenía al vincularse; su identificador se reemplaza por una marca de cuenta eliminada. La persona usuaria recibe un aviso de que un vínculo suyo se está cerrando, pero ese aviso es informativo: no bloquea la eliminación de la cuenta del tutor, porque el derecho de supresión de esa cuenta no admite veto de un tercero.
- Q: Al confirmar una versión nueva de modelo y catálogo, ¿qué pasa con las versiones anteriores? (AMB-002) → A: Se conservan las últimas 3 versiones. Al confirmar una nueva, la más antigua fuera de esa ventana se elimina, salvo que sea la versión vigente. La reversión de FR-039 alcanza únicamente a las versiones dentro de la ventana.
- Q: ¿El borrado en cascada corre de inmediato o hay un período de gracia durante el cual la cuenta puede recuperarse? (AMB-003) → A: Período de gracia. La solicitud marca el perfil como pendiente de eliminación y le deniega todo acceso; el borrado efectivo corre al vencer la ventana. Se ejecuta mediante una tarea diferida de disparo único, encolada en el momento de la solicitud, no mediante un barrido periódico, para no violar FR-074.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aislamiento del perfil por la lista de autorizados (Priority: P1)

Toda la información de una persona usuaria —datos anidados, rutinas, resúmenes diarios,
pictogramas personalizados e identificadores de dispositivo— cuelga de su documento de
perfil. El servidor concede lectura y escritura al propietario y a las cuentas que figuran
en su lista de autorizados, y las deniega a cualquier otro solicitante.

**Why this priority**: Es el único mecanismo de separación entre el perfil de una persona
con discapacidad y cualquier otra cuenta del sistema. Todas las demás historias operan
sobre datos que esta regla protege.

**Independent Test**: Se verifica emitiendo, para cada ruta del perfil, una solicitud de
lectura y una de escritura desde las cuatro clases de solicitante, y comparando el
resultado con el esperado. No requiere ninguna función en ejecución.

**Acceptance Scenarios**:

1. **Given** un perfil existente, **When** el cliente propietario lee o escribe cualquier
   ruta de ese perfil, **Then** la solicitud se **permite**.
2. **Given** un perfil cuya lista de autorizados contiene la identidad del solicitante,
   **When** ese cliente lee o escribe una ruta de ese perfil dentro de su alcance
   (Historia 2), **Then** la solicitud se **permite**.
3. **Given** un perfil cuya lista de autorizados **no** contiene la identidad del
   solicitante, **When** ese cliente autenticado lee cualquier ruta de ese perfil,
   **Then** la solicitud se **deniega**.
4. **Given** el mismo perfil, **When** ese cliente autenticado escribe cualquier ruta de
   ese perfil, **Then** la solicitud se **deniega** y el contenido de la ruta no cambia.
5. **Given** cualquier perfil, **When** un cliente no autenticado lee o escribe cualquier
   ruta, **Then** la solicitud se **deniega**.
6. **Given** una identidad presente en la lista de autorizados, **When** el propietario la
   retira de esa lista, **Then** toda solicitud posterior de esa identidad sobre ese perfil
   se **deniega**.
7. **Given** un perfil, **When** un cliente autorizado intenta modificar la lista de
   autorizados de ese perfil, **Then** la solicitud se **deniega**: solo el propietario la
   modifica.
8. **Given** la colección de perfiles, **When** un cliente autenticado solicita una
   enumeración de perfiles o de identificadores de perfil, **Then** la solicitud se
   **deniega**; no existe ninguna consulta que devuelva perfiles ajenos, ni siquiera sus
   identificadores.

---

### User Story 2 - Alcance del acceso autorizado y autoría obligatoria (Priority: P1)

Estar en la lista de autorizados no concede acceso total. El acceso autorizado alcanza
rutinas, configuración e identificadores de dispositivo. No existe ninguna ruta que admita
la escritura de datos del ámbito de traducción, para ninguna cuenta, ni siquiera la
propietaria. Y toda escritura sobre una rutina debe declarar qué cuenta la realizó y
cuándo; sin eso, se rechaza.

**Why this priority**: Sin el límite de alcance, la Historia 1 concede a un acompañante
todo el perfil, incluido lo que la constitución del proyecto prohíbe que vea. Sin autoría
obligatoria, un cambio remoto es irrastreable en el momento en que hay más de una cuenta
autorizada.

**Independent Test**: Se verifica emitiendo escrituras sobre cada subconjunto de rutas
desde una cuenta autorizada, y escrituras de rutina con y sin el campo de autoría, y
comparando el resultado esperado. No requiere ninguna función en ejecución.

**Acceptance Scenarios**:

1. **Given** un cliente autorizado, **When** lee o escribe rutinas, configuración o
   identificadores de dispositivo del perfil, **Then** la solicitud se **permite**.
2. **Given** un cliente autorizado, **When** lee cualquier ruta del ámbito de traducción
   del perfil, **Then** la solicitud se **deniega**.
3. **Given** el cliente **propietario**, **When** intenta escribir datos del ámbito de
   traducción, **Then** la solicitud se **deniega**: no existe ninguna ruta que los admita,
   y la propiedad del perfil no habilita ninguna excepción.
4. **Given** un cliente autorizado, **When** escribe una rutina declarando la identidad
   autenticada del propio solicitante y la fecha del servidor, **Then** la solicitud se
   **permite**.
5. **Given** un cliente autorizado, **When** escribe una rutina **sin** el campo de autoría
   o **sin** el campo de fecha, **Then** la solicitud se **rechaza**.
6. **Given** un cliente autorizado, **When** escribe una rutina declarando una identidad de
   autoría distinta de la suya, **Then** la solicitud se **rechaza**.
7. **Given** un cliente autorizado, **When** escribe una rutina declarando una fecha que no
   es la del servidor, **Then** la solicitud se **rechaza**: la fecha no la fija el cliente.

---

### User Story 3 - Dos zonas de archivos con reglas opuestas (Priority: P1)

El almacén de archivos tiene una zona por cuenta y una zona pública, con reglas contrarias,
y ninguna ubicación queda cubierta por ambas. Ninguna ruta, en ninguna zona, admite la
escritura de video ni de puntos clave corporales.

**Why this priority**: Los archivos por cuenta contienen audios y pictogramas de una
persona con discapacidad. Una ubicación mal clasificada los deja legibles por todo el
proyecto, y a diferencia de un documento, un archivo mal expuesto puede quedar en caché
fuera de alcance.

**Independent Test**: Se verifica emitiendo lectura y escritura contra una ubicación de
cada zona desde las cuatro clases de solicitante, y comprobando además que ninguna
ubicación responde a las reglas de las dos zonas.

**Acceptance Scenarios**:

1. **Given** una ubicación de la zona por cuenta, **When** el cliente propietario del
   perfil lee o escribe, **Then** la solicitud se **permite**.
2. **Given** una ubicación de la zona por cuenta, **When** un cliente autorizado de ese
   perfil lee o escribe, **Then** la solicitud se **permite**.
3. **Given** una ubicación de la zona por cuenta, **When** un cliente autenticado no
   autorizado lee o escribe, **Then** la solicitud se **deniega**.
4. **Given** una ubicación de la zona por cuenta, **When** un cliente no autenticado lee o
   escribe, **Then** la solicitud se **deniega**.
5. **Given** una ubicación de la zona pública —artefacto de modelo, catálogo o manifiesto—,
   **When** cualquier cliente autenticado lee, **Then** la solicitud se **permite**.
6. **Given** una ubicación de la zona pública, **When** un cliente no autenticado lee,
   **Then** la solicitud se **deniega**.
7. **Given** una ubicación de la zona pública, **When** **cualquier** cliente escribe,
   **Then** la solicitud se **deniega**, sea propietario, autorizado o no.
8. **Given** el conjunto de ubicaciones definidas, **When** se evalúa cuál regla las
   cubre, **Then** ninguna queda cubierta por las reglas de ambas zonas y ninguna queda sin
   cubrir.

---

### User Story 4 - Aviso a contactos de confianza (Priority: P1)

*Función comprometida n.º 1.*

Ante un evento de emergencia, la función notifica a los identificadores de dispositivo
registrados de las cuentas autorizadas del perfil. El aviso se entrega de forma que el
cliente ejecute su propia lógica antes de mostrarlo. No persiste ningún registro del
evento. Los identificadores que resultan inválidos al enviar se depuran.

**Why this priority**: Es la función con consecuencias más directas y la que concentra las
dos restricciones más estrictas del proyecto: la forma de entrega y la no persistencia. Su
modo de falla —un aviso que el sistema operativo muestra por su cuenta— saltearía los
mecanismos de accesibilidad del cliente.

**Independent Test**: Se verifica disparando el evento contra un perfil de prueba con
identificadores válidos e inválidos registrados, e inspeccionando: los envíos emitidos, su
forma, su contenido, el estado de los identificadores después, y los almacenes.

**Acceptance Scenarios**:

1. **Given** un perfil con dos cuentas autorizadas, cada una con un identificador de
   dispositivo registrado, **When** se dispara el evento de emergencia, **Then** se emite
   un envío a cada uno de esos identificadores.
2. **Given** un envío emitido, **When** se inspecciona su forma, **Then** no contiene
   ninguna carga que el sistema operativo del cliente pueda mostrar por su cuenta; el
   cliente ejecuta su lógica antes de que nada se muestre.
3. **Given** un envío emitido, **When** se inspecciona su contenido, **Then** no incluye
   datos sensibles de la persona usuaria.
4. **Given** un evento de emergencia procesado, **When** se recorren los almacenes,
   **Then** no existe ningún registro del evento: ni el hecho, ni su hora, ni sus
   destinatarios, ni ningún dato derivado.
5. **Given** un perfil con un identificador válido y uno que el proveedor de envío reporta
   como inválido, **When** se dispara el evento, **Then** el identificador válido recibe su
   envío y el inválido se elimina del perfil.
6. **Given** un perfil sin ninguna cuenta autorizada, o sin identificadores registrados,
   **When** se dispara el evento, **Then** la función termina sin emitir envíos y sin
   error.
7. **Given** un cliente propietario, **When** dispara el evento de emergencia de su propio
   perfil, **Then** la solicitud se **permite**.
7a. **Given** una cuenta autorizada de ese perfil, **When** intenta disparar el evento de
    emergencia, **Then** la solicitud se **deniega**: estar autorizada no habilita este
    disparo.
7b. **Given** un cliente autenticado no autorizado, o una solicitud no autenticada, **When**
    intenta disparar el evento de emergencia, **Then** la solicitud se **deniega**.
8. **Given** un fallo de entrega, **When** la función lo procesa, **Then** lo registra para
   diagnóstico sin datos personales identificables, y continúa con los demás destinos.

---

### User Story 5 - Distribución de contenido de solo lectura y consulta por diferencia (Priority: P2)

El catálogo de señas, las versiones de modelo, el indicador de versión vigente y los
pictogramas incorporados después de publicada la aplicación son legibles por cualquier
cliente autenticado y escribibles por ninguno. El catálogo puede consultarse por diferencia
respecto de una fecha, y existe el índice que lo hace posible.

**Why this priority**: Es lo que permite que el contenido crezca sin publicar una versión
nueva de la aplicación. La consulta por diferencia no es una optimización: sin ella cada
cliente descarga el catálogo completo en cada sincronización.

**Independent Test**: Se verifica leyendo y escribiendo cada colección global desde las
cuatro clases de solicitante, y emitiendo una consulta por diferencia contra una fecha
dada, comprobando que se resuelve y que devuelve solo lo modificado después de esa fecha.

**Acceptance Scenarios**:

1. **Given** las colecciones globales —catálogo de señas, versiones de modelo, indicador de
   versión vigente, pictogramas globales—, **When** un cliente autenticado cualquiera lee,
   **Then** la solicitud se **permite**.
2. **Given** las mismas colecciones, **When** un cliente no autenticado lee, **Then** la
   solicitud se **deniega**.
3. **Given** las mismas colecciones, **When** **cualquier** cliente crea, modifica o borra
   una entrada, **Then** la solicitud se **deniega**, en toda circunstancia.
4. **Given** un catálogo con entradas modificadas en distintas fechas, **When** un cliente
   autenticado consulta las entradas modificadas después de una fecha dada, **Then** la
   consulta se resuelve y devuelve únicamente esas entradas.
5. **Given** la misma consulta, **When** se ejecuta, **Then** existe el índice que la
   soporta; la consulta no se rechaza por falta de índice.
6. **Given** una entrada de catálogo retirada, **When** se consulta por diferencia desde
   una fecha anterior al retiro, **Then** la entrada aparece marcada como retirada; el
   retiro es observable por diferencia, no solo por ausencia.

---

### User Story 6 - Publicación de modelo y catálogo (Priority: P2)

*Ejecutada por el proceso de publicación, con credenciales de administración.*

Publicar una versión deja disponibles, en una ubicación nueva y propia de esa versión, el
artefacto del modelo, su catálogo y un manifiesto de verificación. Es indivisible: o quedan
los tres, o no queda ninguno. Una ubicación ya publicada nunca se sobrescribe. El proceso
rechaza anunciar como vigente una versión cuyo catálogo no exista o no corresponda.

**Why this priority**: El cliente llega con un modelo incorporado, así que esta historia
mejora el reconocimiento pero no lo habilita. Su modo de falla, en cambio, es silencioso:
un modelo desincronizado de su catálogo produce traducciones incorrectas sin ningún error
observable.

**Independent Test**: Se verifica ejecutando el proceso contra el entorno de emulación:
publicando una versión completa, interrumpiendo una publicación entre artefacto y catálogo,
intentando publicar sobre una ubicación existente, e intentando activar una versión sin
catálogo correspondiente.

**Acceptance Scenarios**:

1. **Given** un modelo, su catálogo y su manifiesto, **When** el proceso de publicación se
   ejecuta, **Then** los tres quedan disponibles en una ubicación propia de esa versión.
2. **Given** una publicación interrumpida después del artefacto y antes del catálogo,
   **When** se consulta el estado de esa versión, **Then** no figura como disponible: no
   queda una versión utilizable a medias.
3. **Given** una ubicación ya publicada, **When** el proceso intenta escribir en ella,
   **Then** la operación se **rechaza** y el contenido existente no cambia.
4. **Given** una versión publicada, **When** se lee su manifiesto, **Then** permite
   verificar la integridad de los artefactos descargados.
5. **Given** una versión cuyo catálogo asociado no existe o no corresponde a su manifiesto,
   **When** el proceso intenta anunciarla como vigente, **Then** la operación se **rechaza**
   y el indicador de versión vigente conserva su valor anterior.
6. **Given** el indicador de versión vigente, **When** se lee, **Then** expresa también la
   versión mínima de aplicación compatible con esa versión de modelo.
7. **Given** una versión anterior ya publicada, **When** el proceso cambia el indicador de
   versión vigente para apuntar a ella, **Then** la reversión queda completa sin ninguna
   otra operación y sin volver a publicar artefactos.
8. **Given** un indicador de versión vigente que apunta a una versión inexistente, **When**
   se evalúa el estado del sistema, **Then** la condición es detectable: existe una
   comprobación que la identifica en lugar de dejarla pasar en silencio.
9. **Given** cuatro versiones publicadas, **When** se confirma una quinta, **Then** las tres
   más recientes permanecen disponibles y las que quedan fuera de esa ventana dejan de
   existir con sus tres artefactos.
10. **Given** una versión fuera de la ventana de retención que además es la vigente,
    **When** se confirma una versión nueva, **Then** esa versión **no** se elimina.
11. **Given** una versión eliminada por retención, **When** se intenta designarla vigente,
    **Then** la operación se **rechaza** y el indicador conserva su valor anterior.

---

### User Story 7 - Borrado en cascada al eliminar una cuenta (Priority: P2)

*Función comprometida n.º 3.*

La eliminación ocurre en dos tiempos. La **solicitud** marca el perfil como pendiente de
eliminación, le deniega todo acceso y encola una tarea diferida de disparo único. Al
**vencer la ventana de gracia**, esa tarea ejecuta el borrado: documento de perfil, datos
anidados, archivos binarios, y las referencias a esa cuenta en las listas de autorizados de
otros perfiles. Dentro de la ventana, el propietario puede cancelar y recuperar el acceso.

**Why this priority**: El derecho de supresión de la Ley N.º 25.326 debe ser operable y
verificable. Es P2 porque solo opera sobre datos que ya existen, pero no puede quedar fuera
de la primera entrega desplegable.

**Independent Test**: Se verifica creando un perfil con datos anidados, archivos binarios y
presencia en la lista de autorizados de un segundo perfil; solicitando la eliminación;
comprobando la denegación de acceso durante la gracia; y adelantando el vencimiento para
recorrer exhaustivamente las rutas asociadas. La cancelación y la reintentabilidad se
prueban por separado.

**Acceptance Scenarios**:

1. **Given** un cliente propietario, **When** solicita la eliminación de su cuenta,
   **Then** la solicitud se **permite**, el perfil queda marcado como pendiente y se encola
   una tarea diferida de disparo único con el vencimiento de la ventana.
2. **Given** un perfil marcado como pendiente de eliminación, **When** su propietario lee o
   escribe cualquier ruta de ese perfil que no sea la cancelación ni el indicador de estado,
   **Then** la solicitud se **deniega**.
3. **Given** un perfil marcado como pendiente, **When** una cuenta autorizada de ese perfil
   lee o escribe cualquier ruta, incluido el indicador de estado, **Then** la solicitud se
   **deniega**.
3a. **Given** un perfil marcado como pendiente, **When** su propietario lee el indicador de
    estado, **Then** la solicitud se **permite** y devuelve únicamente si está pendiente y
    la fecha de vencimiento.
3b. **Given** un perfil que **no** está pendiente de eliminación, **When** su propietario lee
    el indicador de estado, **Then** la solicitud se **deniega**, con un resultado
    indistinguible del de un perfil inexistente.
4. **Given** un perfil marcado como pendiente, **When** su propietario cancela la
   eliminación antes del vencimiento, **Then** la marca se retira, la tarea diferida queda
   sin efecto y el acceso vuelve a **permitirse**.
5. **Given** un perfil marcado como pendiente, **When** un cliente que no es su propietario
   intenta cancelar la eliminación, **Then** la solicitud se **deniega**.
6. **Given** una ventana de gracia vencida, **When** la tarea diferida se dispara, **Then**
   el documento de perfil y todos sus datos anidados dejan de existir.
7. **Given** la misma ejecución, **When** se inspecciona la zona por cuenta, **Then** las
   ubicaciones de archivos binarios de esa cuenta dejan de devolver contenido.
8. **Given** una cuenta cuya identidad figura en la lista de autorizados de otro perfil,
   **When** vence su ventana y corre el borrado, **Then** esa referencia se elimina de esa
   lista y el otro perfil permanece intacto en todo lo demás.
9. **Given** un borrado completado, **When** se recorren todas las rutas asociadas a la
   cuenta, **Then** ninguna devuelve datos.
10. **Given** un borrado interrumpido a la mitad, **When** se vuelve a disparar, **Then**
    completa la operación y termina sin error; volver a ejecutarlo sobre una cuenta ya
    borrada tampoco produce error.
11. **Given** un cliente autenticado, **When** intenta solicitar la eliminación de una
    cuenta que no es la suya, **Then** la solicitud se **deniega**.
12. **Given** el conjunto de funciones, **When** se inspecciona cómo se dispara el borrado
    efectivo, **Then** proviene de una tarea encolada en el momento de la solicitud y no de
    ningún barrido periódico que busque cuentas vencidas.
13. **Given** una cuenta que escribió audios y pictogramas en la zona por cuenta de otro
    perfil, **When** se completa su borrado, **Then** esos archivos siguen existiendo y el
    propietario de ese otro perfil los sigue leyendo y escribiendo.
14. **Given** los registros de autoría de ese otro perfil, **When** se completa el borrado,
    **Then** el identificador de la cuenta eliminada fue reemplazado por una marca de cuenta
    eliminada, y el nombre visible al vincularse y la fecha del cambio se conservan.
15. **Given** una cuenta que figura en la lista de autorizados de otro perfil, **When**
    entra en eliminación, **Then** ese perfil recibe un aviso del cierre del vínculo, con la
    misma forma de entrega que el aviso de emergencia y sin datos sensibles.
16. **Given** ese aviso sin respuesta, **When** vence la ventana de gracia, **Then** el
    borrado se completa igual: la falta de respuesta de un tercero no lo bloquea.

---

### User Story 8 - Publicación de novedades por temas (Priority: P3)

*Función comprometida n.º 2.*

Al publicarse contenido nuevo, se emite un aviso a los identificadores suscritos al tema
correspondiente. El aviso anuncia disponibilidad y no transporta el contenido. Se entrega
bajo la misma restricción de forma que el aviso de emergencia.

**Why this priority**: Sin esta función el contenido nuevo igual queda disponible; los
clientes lo encuentran en su siguiente consulta. Es una mejora de oportunidad, no una
capacidad.

**Independent Test**: Se verifica publicando contenido y comprobando que se emite un envío
al tema correspondiente, que su contenido no incluye el contenido publicado, y que su forma
cumple la misma restricción que la Historia 4.

**Acceptance Scenarios**:

1. **Given** contenido nuevo publicado, **When** la función se dispara, **Then** se emite
   un envío al tema correspondiente.
2. **Given** un envío de novedad emitido, **When** se inspecciona su contenido, **Then**
   anuncia disponibilidad y no transporta el contenido publicado.
3. **Given** un envío de novedad emitido, **When** se inspecciona su forma, **Then** no
   contiene ninguna carga que el sistema operativo del cliente pueda mostrar por su cuenta.
4. **Given** una publicación que no corresponde a ningún tema definido, **When** la función
   se dispara, **Then** termina sin emitir envíos y sin error.

---

### User Story 9 - Coherencia de las referencias duplicadas a un pictograma (Priority: P3)

Cuando cambia la etiqueta o la ubicación de un pictograma, las referencias duplicadas a ese
pictograma dentro de las rutinas quedan actualizadas, sin que el cliente deba resolverlo
con lecturas adicionales.

**Why this priority**: Es consecuencia de una decisión de rendimiento —duplicar etiqueta y
ubicación dentro del paso para que leer una rutina sea una sola lectura—. Sin esta
historia, un pictograma renombrado conserva la etiqueta vieja dentro de las rutinas.

*Función comprometida n.º 5. Incorporada por la decisión registrada en `## Clarifications`.*

> **Es la operación de mayor riesgo del repositorio.** Escribe en abanico sobre perfiles
> ajenos al que originó el cambio, con credenciales de administración, eludiendo por diseño
> la regla que separa un perfil de otro. Los escenarios 4 a 8 existen para acotar
> exactamente qué puede tocar.

**Independent Test**: Se verifica creando rutinas en dos perfiles distintos que referencian
el mismo pictograma, modificando el pictograma, y comprobando que ambas rutinas reflejan el
valor nuevo, que ningún otro campo de esos perfiles cambió, y que reejecutar la propagación
no produce efectos adicionales.

**Acceptance Scenarios**:

1. **Given** una rutina cuyos pasos duplican la etiqueta y la ubicación de un pictograma,
   **When** cambia la etiqueta o la ubicación de ese pictograma, **Then** los pasos que lo
   referencian quedan actualizados.
2. **Given** una rutina actualizada, **When** un cliente la lee, **Then** obtiene la
   etiqueta y la ubicación vigentes sin lecturas adicionales por paso.
3. **Given** un pictograma global referenciado por rutinas de varios perfiles, **When**
   cambia su etiqueta, **Then** las rutinas de todos esos perfiles quedan actualizadas.
4. **Given** la propagación ejecutada, **When** se comparan los perfiles afectados antes y
   después, **Then** los únicos campos modificados son la etiqueta y la ubicación
   duplicadas dentro de los pasos que referencian ese pictograma.
5. **Given** un pictograma **personalizado** de un perfil, **When** cambia su etiqueta,
   **Then** la propagación alcanza únicamente las rutinas de ese perfil y ninguna de otro.
6. **Given** la propagación ejecutada, **When** se inspeccionan las listas de autorizados
   de los perfiles afectados, **Then** ninguna cambió.
7. **Given** una propagación interrumpida a la mitad, **When** se vuelve a disparar,
   **Then** completa la actualización y termina sin error; reejecutarla sobre un estado ya
   propagado no produce efectos adicionales.
8. **Given** un cambio de pictograma, **When** se dispara la propagación, **Then** la
   función determina qué rutinas lo referencian mediante una consulta con índice, sin
   recorrer los perfiles que no lo referencian.

---

### User Story 10 - Alta de un acompañante en la lista de autorizados (Priority: P1)

*Función comprometida n.º 4. Incorporada por la decisión registrada en `## Clarifications`.*

El propietario obtiene un código de vinculación firmado y con vencimiento. Un cliente
autenticado lo presenta, la función lo valida y agrega su identidad a la lista de
autorizados del perfil que emitió el código. El código no se persiste en ningún almacén.

> **Nota de numeración**: esta historia se numera al final para no invalidar las
> referencias existentes a las Historias 1 a 9. Su prioridad es **P1**: es la única vía
> especificada para poblar la lista de autorizados, de la que dependen las Historias 1, 2
> y 3.

**Why this priority**: Sin esta función, la lista de autorizados no tiene forma de poblarse
y el caso "autorizado permitido" de las Historias 1, 2 y 3 no puede probarse con un sujeto
real. Es también la única función que escribe sobre el perfil de una cuenta distinta de la
que la invoca, así que concentra el mayor riesgo de escalada de privilegios de todo el
repositorio.

**Independent Test**: Se verifica emitiendo un código para un perfil, canjeándolo desde una
segunda identidad, y comprobando que esa identidad queda en la lista y que su acceso pasa
de denegado a permitido. Los casos de código vencido, ya canjeado, ajeno y manipulado se
prueban por separado. No requiere dispositivo.

**Acceptance Scenarios**:

1. **Given** un cliente propietario, **When** solicita un código de vinculación para su
   propio perfil, **Then** la solicitud se **permite** y se emite un código con vencimiento.
2. **Given** un cliente autenticado, **When** solicita un código de vinculación para un
   perfil que no es el suyo, **Then** la solicitud se **deniega**.
3. **Given** un código vigente emitido para un perfil, **When** una segunda identidad
   autenticada lo canjea, **Then** la solicitud se **permite** y esa identidad queda en la
   lista de autorizados de ese perfil.
4. **Given** la identidad recién agregada, **When** lee una ruta del perfil dentro de su
   alcance, **Then** la solicitud se **permite**; antes del canje la misma solicitud se
   denegaba.
5. **Given** un código ya canjeado, **When** se lo vuelve a canjear, **Then** la solicitud
   se **rechaza** y la lista de autorizados no cambia.
6. **Given** un código cuyo vencimiento ya pasó, **When** se lo canjea, **Then** la
   solicitud se **rechaza**.
7. **Given** un código manipulado o inventado, **When** se lo canjea, **Then** la solicitud
   se **rechaza**, con un resultado indistinguible del de un código vencido o ya canjeado.
8. **Given** un cliente no autenticado, **When** intenta canjear un código válido, **Then**
   la solicitud se **deniega**.
9. **Given** un código canjeado o vencido, **When** se recorren los almacenes, **Then** no
   existe ningún registro del código ni de ningún valor derivado de él.
10. **Given** una identidad que ya figura en la lista de autorizados, **When** canjea un
    código nuevo del mismo perfil, **Then** la lista no queda con entradas duplicadas.
11. **Given** un número de intentos de canje fallidos por encima del límite, **When** se
    intenta canjear de nuevo, **Then** la solicitud se **rechaza** aunque el código sea
    válido.

---

### Edge Cases

**Autorización**

- **Cuenta retirada de la lista de autorizados que escribe después de la revocación.** La
  escritura se **deniega**. La revocación surte efecto sobre toda solicitud posterior sin
  requerir ninguna acción de la cuenta revocada.
- **Cliente autenticado que enumera identificadores para alcanzar un perfil ajeno.** Toda
  consulta que devuelva perfiles o identificadores de perfil se **deniega**. El acceso es
  siempre por documento, con evaluación de autorización.
- **Escritura sobre una rutina sin el campo de autoría.** Se **rechaza**. Lo mismo si falta
  la fecha, si la autoría declarada no coincide con la identidad autenticada, o si la fecha
  no es la del servidor.
- **Dos clientes autorizados escribiendo el mismo documento.** Sobrevive la última
  escritura. No hay fusión ni aviso de conflicto. Es un comportamiento **aceptado
  deliberadamente**: la autoría y la fecha obligatorias (Historia 2) permiten reconstruir
  qué ocurrió a posteriori.
- **Código de vinculación canjeado dos veces, vencido o manipulado.** Se **rechaza** en los
  tres casos, con un resultado indistinguible entre ellos, para no revelar qué códigos
  existieron. La lista de autorizados no cambia.
- **Código de vinculación adivinado por fuerza bruta.** Superados 5 intentos fallidos en una
  hora —contados por cuenta solicitante o por perfil emisor, el que se alcance primero— se
  **rechazan** los intentos siguientes aunque el código presentado sea válido. El rechazo es
  indistinguible del de un código inválido.
- **Código de vinculación cuya vigencia de 10 minutos expiró.** Se **rechaza**, con un
  resultado indistinguible del de un código ya canjeado o inexistente.
- **Identidad que canjea un código de un perfil en el que ya figura.** La lista de
  autorizados no queda con entradas duplicadas.
- **Solicitud sin cuenta registrada.** Ninguna ruta la admite: sin identidad autenticada,
  toda lectura y toda escritura se **deniegan**, en el almacén de documentos y en el de
  archivos, en ambas zonas. El único acceso sin autenticar es ninguno.

**Archivos**

- **Cliente que escribe en la zona pública.** Se **deniega**, sea propietario, autorizado o
  no. La zona pública solo se escribe con credenciales de administración.
- **Escritura de video o de puntos clave corporales.** No existe ninguna ruta que la
  admita, en ninguna zona. La solicitud no encuentra destino: no es que se deniegue por
  autorización, es que la ruta no está definida.

**Publicación**

- **Publicación interrumpida entre el artefacto y su catálogo.** La versión no queda
  disponible. Una publicación parcial no produce una versión utilizable a medias.
- **Indicador de versión vigente apuntando a una versión inexistente.** La condición es
  detectable por una comprobación explícita. Anunciar como vigente una versión sin catálogo
  correspondiente se **rechaza** en el momento de la operación.
- **Intento de sobrescribir una ubicación ya publicada.** Se **rechaza** y el contenido
  existente no cambia.

**Funciones**

- **Identificador de dispositivo vencido al momento del envío.** El envío a ese
  identificador falla, el identificador se elimina del perfil, y los demás destinos reciben
  su envío igual.
- **Borrado en cascada interrumpido y reejecutado.** Completa el borrado. Ejecutarlo sobre
  una cuenta ya borrada termina sin error y sin efectos.
- **Acceso a un perfil marcado como pendiente de eliminación.** Se **deniega**, incluso al
  propietario y a sus cuentas autorizadas. La marca suspende el perfil desde el instante de
  la solicitud, sin esperar al vencimiento. Las dos únicas excepciones son la cancelación y
  la lectura del indicador de estado, ambas reservadas al propietario.
- **Cancelación de la eliminación dentro de la ventana.** Solo el propietario puede
  cancelar. Retirada la marca, el acceso vuelve a permitirse y no se perdió ningún dato.
- **Cuenta pendiente de eliminación que figura como autorizada en otro perfil.** Conserva ese
  acceso durante la ventana; la referencia se elimina recién al vencer. Es una decisión
  deliberada: evaluar la suspensión en cada acceso cruzado agregaría una lectura a toda
  solicitud. El propietario del otro perfil siempre puede revocarla por su cuenta.
- **Evento de emergencia sobre un perfil sin cuentas autorizadas.** La función termina sin
  emitir envíos y sin error.

---

## Requirements *(mandatory)*

Cada requisito es verificable emitiendo una solicitud contra el entorno de emulación y
observando el resultado del servidor.

### Functional Requirements

#### Autorización sobre el perfil

- **FR-001**: El servidor DEBE alojar bajo el documento de perfil de una persona usuaria
  todos sus datos: datos anidados, rutinas, resúmenes diarios, pictogramas personalizados e
  identificadores de dispositivo.
- **FR-002**: El servidor DEBE **permitir** la lectura y la escritura de las rutas del
  perfil al cliente cuya identidad coincide con el identificador del perfil.
- **FR-003**: El servidor DEBE **permitir** la lectura y la escritura de las rutas del
  perfil dentro del alcance definido en FR-011 al cliente cuya identidad figura en la lista
  de autorizados de ese perfil.
- **FR-004**: El servidor DEBE **denegar** toda lectura y toda escritura sobre un perfil al
  cliente autenticado que no es su propietario ni figura en su lista de autorizados.
- **FR-005**: El servidor DEBE **denegar** toda lectura y toda escritura a toda solicitud
  no autenticada, sin excepción de ruta.
- **FR-006**: El servidor DEBE **denegar** toda solicitud posterior al retiro de una
  identidad de la lista de autorizados, sin requerir ninguna acción de esa identidad.
- **FR-007**: El servidor DEBE **permitir** la modificación de la lista de autorizados
  únicamente al cliente propietario, y DEBE **denegarla** a los clientes autorizados.
- **FR-008**: El servidor DEBE **denegar** a todo **cliente** cualquier consulta que
  devuelva perfiles o identificadores de perfil ajenos. La restricción alcanza a las cuatro
  clases de solicitante y no al proceso con credenciales de administración, que opera fuera
  de las reglas de cliente y del que dependen FR-061 y FR-094.
- **FR-009**: El servidor DEBE evaluar cada regla de acceso contra las cuatro clases de
  solicitante —propietario, autorizado, autenticado no autorizado y no autenticado— y su
  criterio de aceptación DEBE incluir el resultado esperado de las cuatro.
- **FR-010**: El servidor DEBE verificar toda restricción de acceso del lado del servidor.
  Ninguna restricción PUEDE depender del comportamiento del cliente.

#### Alcance del acceso autorizado

- **FR-011**: El servidor DEBE limitar el acceso de un cliente autorizado a las rutinas, la
  configuración y los identificadores de dispositivo del perfil al que está vinculado.
- **FR-012**: El servidor NO DEBE definir ninguna ruta que admita la escritura de datos del
  ámbito de traducción, para ninguna clase de solicitante, incluida la propietaria.
- **FR-013**: El servidor DEBE **denegar** a un cliente autorizado toda lectura del ámbito
  de traducción del perfil, cuyo único contenido admitido es el agregado diario definido en
  FR-100.
- **FR-014**: El servidor DEBE **rechazar** toda escritura sobre una rutina que no declare
  la identidad de la cuenta que la realiza.
- **FR-015**: El servidor DEBE **rechazar** toda escritura sobre una rutina que no declare
  la fecha en que se realiza.
- **FR-016**: El servidor DEBE **rechazar** toda escritura sobre una rutina cuya autoría
  declarada no coincida con la identidad autenticada del solicitante.
- **FR-017**: El servidor DEBE **rechazar** toda escritura sobre una rutina cuya fecha
  declarada no sea la fecha del servidor.

#### Distribución de contenido de solo lectura

- **FR-018**: El servidor DEBE **permitir** a cualquier cliente autenticado la lectura del
  catálogo de señas, las versiones de modelo, el indicador de versión vigente y los
  pictogramas globales.
- **FR-019**: El servidor DEBE **denegar** la lectura de esos contenidos a las solicitudes
  no autenticadas.
- **FR-020**: El servidor DEBE **denegar** a todo cliente la creación, la modificación y el
  borrado de esos contenidos, en toda circunstancia.
- **FR-021**: El servidor DEBE admitir la escritura de esos contenidos únicamente con
  credenciales de administración.
- **FR-022**: El servidor DEBE resolver una consulta que devuelva las entradas del catálogo
  modificadas después de una fecha dada.
- **FR-023**: El servidor DEBE disponer del índice de consulta que soporta FR-022, de modo
  que la consulta no se rechace por falta de índice.
- **FR-024**: El servidor DEBE representar el retiro de una entrada de catálogo de forma
  observable por la consulta de FR-022, no solo por su ausencia.

#### Archivos binarios

- **FR-025**: El servidor DEBE **permitir** la lectura y la escritura de las ubicaciones de
  la zona por cuenta al cliente propietario del perfil correspondiente.
- **FR-026**: El servidor DEBE **permitir** la lectura y la escritura de esas ubicaciones a
  los clientes autorizados de ese perfil.
- **FR-027**: El servidor DEBE **denegar** el acceso a esas ubicaciones a los clientes
  autenticados no autorizados y a las solicitudes no autenticadas.
- **FR-028**: El servidor DEBE **permitir** a cualquier cliente autenticado la lectura de
  las ubicaciones de la zona pública: artefactos de modelo, catálogo y manifiesto.
- **FR-029**: El servidor DEBE **denegar** la escritura de la zona pública a todo cliente,
  cualquiera sea su relación con cualquier perfil.
- **FR-030**: El servidor DEBE definir las dos zonas de modo que ninguna ubicación quede
  cubierta por las reglas de ambas ni quede sin cubrir.
- **FR-031**: El servidor NO DEBE definir ninguna ruta, en ninguna zona, que admita la
  escritura de video ni de puntos clave corporales.

#### Publicación de modelo y catálogo

- **FR-032**: El proceso de publicación DEBE dejar disponibles, en una ubicación nueva y
  propia de la versión, el artefacto del modelo, su catálogo y un manifiesto de
  verificación.
- **FR-033**: El proceso de publicación DEBE ser indivisible en su resultado observable: o
  la versión queda disponible con sus tres artefactos, o no queda disponible.
- **FR-034**: El proceso de publicación DEBE **rechazar** toda escritura sobre una
  ubicación ya publicada, dejando su contenido intacto.
- **FR-035**: El manifiesto DEBE permitir a un cliente verificar la integridad de los
  artefactos descargados.
- **FR-036**: El proceso de publicación DEBE validar la correspondencia entre modelo,
  catálogo y manifiesto como parte de la operación.
- **FR-037**: El proceso de publicación DEBE **rechazar** todo intento de anunciar como
  vigente una versión cuyo catálogo asociado no exista o no corresponda, dejando el
  indicador de versión vigente en su valor anterior.
- **FR-038**: El indicador de versión vigente DEBE expresar la versión mínima de aplicación
  compatible con la versión de modelo que designa.
- **FR-039**: El cambio del indicador de versión vigente DEBE ser la única operación
  necesaria para revertir a una versión anterior ya publicada.
- **FR-040**: El sistema DEBE disponer de una comprobación que detecte un indicador de
  versión vigente que apunte a una versión inexistente.
- **FR-041**: El proceso de publicación DEBE ser repetible y versionado, y NO DEBE depender
  de una carga manual.

#### Aviso a contactos de confianza

- **FR-042**: El servidor DEBE **permitir** disparar el evento de emergencia de un perfil
  únicamente al cliente propietario de ese perfil. Disparado el evento, el servidor DEBE
  emitir un envío a cada identificador de dispositivo registrado de las cuentas autorizadas
  del perfil.
- **FR-043**: El servidor DEBE emitir el envío en una forma que **no** admita que el
  sistema operativo del cliente lo muestre por su cuenta; el cliente ejecuta su lógica
  antes de que nada se muestre.
- **FR-044**: El servidor NO DEBE incluir datos sensibles en el contenido del envío.
- **FR-045**: El servidor NO DEBE persistir ningún registro del evento de emergencia: ni el
  hecho, ni su hora, ni sus destinatarios, ni ningún dato derivado.
- **FR-046**: El servidor DEBE eliminar del perfil todo identificador de dispositivo que el
  proveedor de envío reporte como inválido durante la emisión.
- **FR-047**: El servidor DEBE continuar la emisión al resto de los destinos cuando la
  emisión a uno de ellos falla.
- **FR-048**: El servidor DEBE **denegar** todo intento de disparar el evento de emergencia
  a las cuentas autorizadas del perfil, a los clientes autenticados no autorizados y a las
  solicitudes no autenticadas. Estar en la lista de autorizados no habilita este disparo.
- **FR-049**: El servidor DEBE registrar los fallos de emisión para diagnóstico, sin datos
  personales identificables.

#### Publicación de novedades por temas

- **FR-050**: Al publicarse contenido nuevo, el servidor DEBE emitir un envío a los
  identificadores suscritos al tema correspondiente.
- **FR-051**: El envío de novedad DEBE anunciar disponibilidad y NO DEBE transportar el
  contenido publicado.
- **FR-052**: El envío de novedad DEBE cumplir la misma restricción de forma que FR-043.
- **FR-053**: El servidor DEBE terminar sin error y sin emitir envíos cuando la publicación
  no corresponde a ningún tema definido.

#### Borrado en cascada al eliminar una cuenta

- **FR-054**: Ante una solicitud de eliminación del cliente propietario, el servidor DEBE
  marcar el perfil como pendiente de eliminación y encolar una tarea diferida de disparo
  único con el vencimiento de la ventana de gracia.
- **FR-055**: La ventana de gracia DEBE durar **30 días** contados desde la solicitud, y su
  vencimiento DEBE quedar registrado como instante absoluto según FR-107.
- **FR-056**: Mientras un perfil está marcado como pendiente de eliminación, el servidor
  DEBE **denegar** toda lectura y toda escritura sobre ese perfil, incluidas las del cliente
  propietario y las de sus cuentas autorizadas, **con las dos únicas excepciones** de
  FR-057 (cancelación por el propietario) y FR-097 (lectura del indicador de estado por el
  propietario). Ninguna otra operación queda permitida.
- **FR-057**: El servidor DEBE **permitir** al cliente propietario cancelar la eliminación
  antes del vencimiento, retirando la marca y dejando la tarea diferida sin efecto, y DEBE
  **denegar** la cancelación a cualquier otro cliente.
- **FR-058**: El servidor NO DEBE ejecutar el borrado efectivo mediante un barrido periódico
  que busque cuentas vencidas: el disparo proviene de la tarea encolada en FR-054. Esta es
  la única forma de ejecución diferida admitida por FR-074.
- **FR-059**: Al vencer la ventana de gracia, el servidor DEBE borrar el documento de perfil
  y todos sus datos anidados.
- **FR-060**: El servidor DEBE borrar todos los archivos binarios alojados en la zona por
  cuenta **del perfil eliminado**. Los archivos que esa cuenta escribió en la zona por
  cuenta de **otro** perfil quedan fuera del borrado: su dueño es el propietario de ese otro
  perfil (FR-091).
- **FR-061**: El servidor DEBE eliminar las referencias a esa cuenta en las listas de
  autorizados de otros perfiles, sin alterar esos perfiles en ningún otro aspecto.
- **FR-062**: El servidor DEBE localizar esos perfiles mediante una consulta por pertenencia
  a la lista de autorizados, y DEBE disponer del índice que la soporta, de modo que la
  consulta no se rechace por falta de índice. La misma consulta y el mismo índice sirven a
  FR-094.
- **FR-063**: Completado el borrado, ninguna ruta asociada a la cuenta DEBE devolver datos.
- **FR-064**: El borrado DEBE ser reintentable: una ejecución interrumpida y vuelta a
  disparar completa la operación, y una ejecución sobre una cuenta ya borrada termina sin
  error y sin efectos.
- **FR-065**: El servidor DEBE **denegar** todo intento de solicitar la eliminación de una
  cuenta ajena al solicitante.

#### Propagación de los datos duplicados de un pictograma

- **FR-066**: Cuando cambia la etiqueta o la ubicación de un pictograma, el servidor DEBE
  actualizar las referencias duplicadas a ese pictograma dentro de las rutinas.
- **FR-067**: Las referencias duplicadas DEBEN quedar disponibles dentro del paso, de modo
  que leer una rutina no requiera lecturas adicionales por paso.
- **FR-068**: La propagación DEBE alcanzar las rutinas de todos los perfiles que
  referencian ese pictograma.
- **FR-069**: La propagación NO DEBE modificar ningún campo fuera de la etiqueta y la
  ubicación duplicadas dentro de los pasos que referencian el pictograma cambiado. En
  particular, NO DEBE modificar ninguna lista de autorizados.
- **FR-070**: La propagación de un pictograma **personalizado** DEBE alcanzar únicamente las
  rutinas del perfil al que ese pictograma pertenece.
- **FR-071**: La propagación DEBE determinar qué rutinas referencian el pictograma mediante
  una consulta con índice, sin recorrer los perfiles que no lo referencian.
- **FR-072**: El servidor DEBE disponer del índice de consulta que soporta FR-071, de modo
  que la consulta no se rechace por falta de índice.
- **FR-073**: La propagación DEBE ser reintentable: una ejecución interrumpida y vuelta a
  disparar completa la actualización, y una ejecución sobre un estado ya propagado termina
  sin error y sin efectos adicionales.

#### Disparo por evento

- **FR-074**: Ninguna función DEBE ejecutarse por sondeo periódico.
- **FR-075**: Ninguna función DEBE permanecer en ejecución: toda función se dispara por un
  evento y termina.
- **FR-076**: Toda función DEBE tener un disparador de evento identificable.

#### Alta de un acompañante en la lista de autorizados

- **FR-077**: El servidor DEBE **permitir** al cliente propietario obtener un código de
  vinculación para su propio perfil, y DEBE **denegar** la solicitud a cualquier otro
  cliente.
- **FR-078**: El código de vinculación DEBE vencer a los **10 minutos** de su emisión, y
  DEBE ser verificable por el servidor sin consultar ningún almacén.
- **FR-079**: El servidor NO DEBE persistir el código de vinculación ni ningún valor
  derivado de él, en ningún almacén y en ningún momento.
- **FR-080**: Ante el canje de un código vigente por un cliente autenticado, el servidor
  DEBE agregar la identidad de ese cliente a la lista de autorizados del perfil que emitió
  el código.
- **FR-081**: El servidor DEBE **rechazar** el canje de un código vencido, ya canjeado,
  manipulado o inexistente, con un resultado indistinguible entre esos casos.
- **FR-082**: El servidor DEBE **denegar** el canje a las solicitudes no autenticadas.
- **FR-083**: El servidor NO DEBE producir entradas duplicadas en la lista de autorizados
  cuando una identidad ya presente canjea un código nuevo del mismo perfil.
- **FR-084**: El servidor DEBE **rechazar** todo canje posterior a **5 intentos fallidos en
  una hora**, aunque el código presentado sea válido. El límite se cuenta en dos ejes
  independientes —por cuenta solicitante y por perfil emisor— y se aplica el que se alcance
  primero.
- **FR-085**: La función de alta DEBE ser la única vía por la que una identidad distinta de
  la propietaria llega a la lista de autorizados. Ninguna regla de cliente PUEDE
  habilitarla.

#### Retención de versiones publicadas

- **FR-086**: El sistema DEBE conservar las 3 versiones publicadas más recientes.
- **FR-087**: Al confirmarse una versión nueva, el proceso de publicación DEBE eliminar las
  versiones que quedan fuera de esa ventana, con sus tres artefactos.
- **FR-088**: El proceso de publicación NO DEBE eliminar la versión designada como vigente,
  aunque quede fuera de la ventana de retención.
- **FR-089**: La eliminación de una versión fuera de la ventana DEBE ser la única mutación
  admitida sobre una ubicación ya publicada. La sobrescritura sigue **rechazada** por
  FR-034.
- **FR-090**: El sistema DEBE **rechazar** todo intento de designar como vigente una versión
  que ya fue eliminada por retención, con el mismo resultado que FR-037.

#### Rastro de una cuenta eliminada en perfiles ajenos

- **FR-091**: El servidor DEBE conservar los archivos binarios que una cuenta eliminada
  escribió en la zona por cuenta de otro perfil. Su propietario es el titular de ese perfil,
  y su acceso no cambia por la eliminación.
- **FR-092**: El servidor DEBE reemplazar, en los registros de autoría de los perfiles
  ajenos, el identificador de la cuenta eliminada por una marca de cuenta eliminada.
- **FR-093**: El servidor DEBE conservar en esos registros el nombre visible que la cuenta
  eliminada tenía al vincularse, y la fecha del cambio.
- **FR-094**: Al entrar una cuenta en eliminación, el servidor DEBE emitir un aviso a los
  perfiles en cuya lista de autorizados figuraba, anunciando el cierre del vínculo.
- **FR-095**: El aviso de FR-094 DEBE ser informativo y NO DEBE condicionar la eliminación:
  la ausencia de respuesta no impide que el borrado se complete al vencer la ventana de
  gracia.
- **FR-096**: El aviso de FR-094 DEBE cumplir la misma restricción de forma que FR-043 y NO
  DEBE incluir datos sensibles.

#### Indicador de estado durante la ventana de gracia

- **FR-097**: El servidor DEBE **permitir** al cliente propietario leer un indicador de
  estado de su propio perfil mientras está pendiente de eliminación, y DEBE **denegar** esa
  lectura a toda otra clase de solicitante, incluidas sus cuentas autorizadas.
- **FR-098**: El indicador de estado DEBE contener únicamente si el perfil está pendiente de
  eliminación y la fecha de vencimiento de la ventana. NO DEBE exponer ningún otro dato del
  perfil.
- **FR-099**: El servidor DEBE **denegar** la lectura del indicador de estado sobre un perfil
  que no está pendiente de eliminación, con un resultado indistinguible del de un perfil
  inexistente.

#### Contenido del ámbito de traducción

- **FR-100**: El único contenido que el servidor admite en el ámbito de traducción de un
  perfil es un **agregado diario** compuesto por conteos y duraciones del día.
- **FR-101**: El servidor NO DEBE admitir en ese agregado ninguna glosa, texto,
  transcripción ni dato del que pueda reconstruirse lo que la persona usuaria expresó. Una
  escritura que incluya cualquiera de ellos se **rechaza**.
- **FR-102**: El servidor DEBE **permitir** al cliente propietario leer y escribir el
  agregado diario de su propio perfil.
- **FR-103**: El servidor DEBE **denegar** la lectura y la escritura del agregado diario a
  los clientes autorizados, a los autenticados no autorizados y a las solicitudes no
  autenticadas.
- **FR-104**: El servidor DEBE admitir como máximo una escritura de agregado diario por
  perfil y por día, y **rechazar** las posteriores dentro del mismo día.

#### Indistinguibilidad de los rechazos de canje

- **FR-105**: El rechazo por límite de tasa DEBE ser indistinguible del rechazo de FR-081,
  para no revelar si el código presentado era válido.

#### Expresión de los vencimientos

- **FR-106**: Todo vencimiento DEBE expresarse como un **instante absoluto** presente en el
  dato que vence, y NO DEBE derivarse de una duración implícita evaluada en el momento de la
  comprobación.
- **FR-107**: La marca de pendiente de eliminación DEBE llevar el instante de vencimiento de
  su ventana de gracia; el código de vinculación, el instante de su vencimiento; y cada
  intento fallido de canje, el instante en que ocurrió.
- **FR-108**: El servidor DEBE determinar que algo venció comparando su instante de
  vencimiento con la hora del servidor, sin ningún otro estado intermedio.
- **FR-109**: Un estado con instante de vencimiento ya pasado DEBE producir el mismo
  resultado que uno que venció por el paso del tiempo, de modo que una prueba pueda sembrar
  el estado vencido sin esperar la ventana real.

### Non-Functional Requirements

Cada requisito no funcional indica su **método de verificación**, porque no todos se
comprueban emitiendo una solicitud.

- **NFR-001** *(Privacidad)*: NO DEBE existir ninguna ruta, regla ni función que permita
  almacenar video, puntos clave corporales, secuencias de señas reconocidas, contenido de
  conversaciones ni material de autenticación.
  **Verificación:** prueba de reglas —intento de escritura denegado o ruta inexistente— más
  revisión de la superficie de rutas definidas.

- **NFR-002** *(Supresión operable)*: El derecho de supresión DEBE ser verificable
  recorriendo las rutas asociadas después del borrado, no declarado. El acceso cesa en el
  instante de la solicitud; el borrado se completa al vencer la ventana de gracia.
  **Verificación:** prueba de función, recorriendo exhaustivamente las rutas.

- **NFR-003** *(El servidor no es requisito de funcionamiento)*: NO DEBE existir ninguna
  capacidad de servidor de la que dependa una operación del cliente.
  **Verificación:** revisión de diseño sobre el inventario de funciones. **No es
  comprobable en el entorno de emulación**: se declara acá porque acota qué puede
  incorporarse, y su cumplimiento se evalúa al aprobar cada capacidad nueva.

- **NFR-004** *(Sin propagación instantánea)*: Ninguna regla ni función DEBE asumir que un
  cambio es visible por otro cliente en el momento de escribirse.
  **Verificación:** revisión de diseño, más ausencia de reglas cuya evaluación dependa del
  orden de llegada de dos escrituras.

- **NFR-005** *(Sin escritura de alta frecuencia)*: NO DEBE existir ninguna ruta de
  escritura destinada a eventos individuales de uso. El servidor recibe agregados.
  **Verificación:** revisión de la superficie de rutas definidas.

- **NFR-006** *(Caso permitido y caso denegado)*: Toda regla DEBE tener criterios de
  aceptación que cubran su caso permitido y su caso denegado. Una regla verificada solo en
  su caso permitido no se considera verificada.
  **Verificación:** cobertura de las pruebas de reglas.

- **NFR-007** *(Superficie mínima)*: Toda capacidad de servidor DEBE justificar por qué no
  puede resolverse en el cliente. Las capacidades comprometidas son cinco; cualquier otra
  queda marcada como ambigüedad hasta que se decida.
  **Verificación:** revisión de diseño al proponer cada capacidad.

- **NFR-008** *(Manejo de errores explícito)*: Ninguna función DEBE descartar un error en
  silencio. Todo error se registra y se relanza, o se responde con un resultado explícito.
  **Verificación:** prueba de función, provocando el fallo y observando el resultado y el
  registro.

### Key Entities

- **Documento de perfil**: Raíz de todos los datos de una persona usuaria. Contiene la
  lista de autorizados. Su identificador determina quién es el propietario.
- **Lista de autorizados**: Conjunto de identidades con acceso al perfil. Solo el
  propietario la modifica directamente; el alta de una identidad ajena ocurre únicamente a
  través de la función de alta. Retirar una identidad revoca su acceso.
- **Código de vinculación**: Valor emitido a pedido del propietario, con vencimiento,
  verificable por el servidor sin consultar ningún almacén. No se persiste. Su canje es la
  única vía por la que una identidad ajena llega a la lista de autorizados.
- **Rutina**: Dato anidado del perfil. Toda escritura declara la identidad de quien la
  realiza y la fecha del servidor. Sus pasos duplican la etiqueta y la ubicación del
  pictograma que referencian.
- **Resumen diario**: Dato anidado del perfil, y único contenido admitido del ámbito de
  traducción. Conteos y duraciones del día; nunca glosas, texto ni transcripción. Una
  escritura por perfil y por día. Legible solo por el propietario.
- **Identificador de dispositivo**: Destino de envío registrado bajo el perfil. Se depura
  cuando el proveedor de envío lo reporta como inválido.
- **Entrada de catálogo**: Elemento del catálogo de señas. Lleva fecha de última
  modificación y estado de retiro, para ser consultable por diferencia.
- **Versión de modelo**: Conjunto de artefacto, catálogo y manifiesto en una ubicación
  propia. Nunca se sobrescribe.
- **Manifiesto de verificación**: Permite comprobar la integridad de los artefactos
  descargados y la correspondencia entre modelo y catálogo.
- **Indicador de versión vigente**: Designa la versión activa y la versión mínima de
  aplicación compatible. Solo lectura para los clientes. Cambiarlo es la operación de
  reversión.
- **Tema de suscripción**: Agrupación de destinos para la publicación de novedades.
- **Evento de emergencia**: Disparador de la función de aviso. No se persiste.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de las reglas de acceso tiene verificado su caso permitido y su caso
  denegado. Ninguna regla se acepta con un solo caso verificado.
- **SC-002**: El 100 % de las reglas sobre rutas de perfil tiene verificados los cuatro
  casos: propietario permitido, autorizado permitido, autenticado no autorizado denegado,
  no autenticado denegado.
- **SC-003**: Un cliente autenticado no autorizado obtiene 0 lecturas exitosas sobre rutas
  de un perfil ajeno, sobre el 100 % de las rutas definidas.
- **SC-004**: Un cliente no autenticado obtiene 0 operaciones exitosas sobre el 100 % de las
  rutas definidas, en el almacén de documentos y en el de archivos.
- **SC-005**: Retirada una identidad de la lista de autorizados, el 100 % de sus solicitudes
  posteriores sobre ese perfil se deniega.
- **SC-006**: Se aceptan 0 escrituras de rutina sin autoría, sin fecha, con autoría distinta
  de la identidad autenticada, o con fecha distinta de la del servidor.
- **SC-007**: Se aceptan 0 escrituras de datos del ámbito de traducción, desde ninguna clase
  de solicitante, incluida la propietaria.
- **SC-008**: Existen 0 rutas que admitan la escritura de video o de puntos clave
  corporales.
- **SC-009**: Se aceptan 0 escrituras de cliente sobre las colecciones globales y sobre la
  zona pública de archivos.
- **SC-010**: La consulta por diferencia sobre el catálogo se resuelve sin rechazo por falta
  de índice en el 100 % de los casos, y un cliente al día recibe 0 entradas.
- **SC-011**: Se aceptan 0 sobrescrituras de una ubicación ya publicada.
- **SC-012**: Quedan 0 versiones anunciadas como vigentes sin un catálogo correspondiente
  que valide contra su manifiesto.
- **SC-013**: Una publicación interrumpida deja 0 versiones disponibles a medias.
- **SC-014**: La reversión a una versión anterior se completa con exactamente 1 operación y
  0 artefactos republicados.
- **SC-015**: Procesado un evento de emergencia, se recuperan 0 registros del evento de
  cualquier almacén.
- **SC-016**: Se emiten 0 envíos en una forma que el sistema operativo del cliente pueda
  mostrar por su cuenta, sobre el 100 % de los envíos de ambas funciones de aviso.
- **SC-017**: Un identificador de dispositivo reportado como inválido queda eliminado del
  perfil en el 100 % de los casos, y los demás destinos del mismo perfil reciben su envío.
- **SC-018**: Completado el borrado en cascada, 0 rutas asociadas a la cuenta devuelven
  datos, y 0 listas de autorizados de otros perfiles conservan su referencia.
- **SC-019**: Reejecutar el borrado sobre una cuenta ya borrada produce 0 errores y 0
  efectos.
- **SC-020**: Se ejecutan 0 funciones por sondeo periódico y 0 funciones permanecen en
  ejecución.
- **SC-021**: Se aceptan 0 canjes de códigos vencidos, ya canjeados, manipulados o
  inexistentes, y 0 canjes desde solicitudes no autenticadas.
- **SC-022**: Canjeado un código, se recuperan 0 registros del código o de cualquier valor
  derivado de él de cualquier almacén.
- **SC-023**: 0 identidades ajenas llegan a una lista de autorizados por una vía distinta de
  la función de alta.
- **SC-024**: Propagado un cambio de pictograma, 0 campos fuera de la etiqueta y la
  ubicación duplicadas resultan modificados en los perfiles afectados, y 0 listas de
  autorizados cambian.
- **SC-025**: La propagación de un pictograma personalizado alcanza 0 perfiles distintos de
  aquel al que pertenece.
- **SC-026**: Reejecutar la propagación sobre un estado ya propagado produce 0 errores y 0
  efectos adicionales.
- **SC-027**: Un perfil marcado como pendiente de eliminación admite exactamente 2
  operaciones exitosas y solo desde su propietario —cancelar y leer el indicador de estado—
  y 0 desde cualquier otra clase de solicitante, incluidas sus cuentas autorizadas.
- **SC-028**: Cancelada la eliminación dentro de la ventana, el acceso del propietario vuelve
  a permitirse en el 100 % de las rutas que tenía antes de solicitarla, y 0 datos se
  perdieron.
- **SC-029**: El borrado efectivo se dispara en el 100 % de los casos desde la tarea encolada
  en el momento de la solicitud, y desde 0 barridos periódicos.
- **SC-030**: Vencida la ventana y completado el borrado, 0 rutas asociadas a la cuenta
  devuelven datos.
- **SC-031**: Tras confirmar una versión nueva, quedan exactamente 3 versiones disponibles,
  más la vigente si esta cayera fuera de esa ventana.
- **SC-032**: Se aceptan 0 designaciones de versión vigente sobre versiones eliminadas por
  retención, y se producen 0 eliminaciones de la versión vigente.
- **SC-033**: Completado el borrado de una cuenta, 0 archivos que esa cuenta escribió en
  perfiles ajenos resultan eliminados, y 0 identificadores de esa cuenta permanecen en los
  registros de autoría de esos perfiles.
- **SC-034**: 0 eliminaciones de cuenta quedan bloqueadas por la falta de respuesta de un
  tercero.
- **SC-035**: Un perfil pendiente de eliminación admite exactamente 2 operaciones del
  propietario y 0 de cualquier otra clase de solicitante.
- **SC-036**: Se aceptan 0 escrituras de agregado diario que incluyan glosas, texto o
  transcripción, y como máximo 1 agregado por perfil y por día.
- **SC-037**: Las cuentas autorizadas obtienen 0 lecturas exitosas del agregado diario.
- **SC-038**: Solo el propietario puede disparar el evento de emergencia: 0 disparos
  exitosos desde cuentas autorizadas, autenticadas no autorizadas o no autenticadas.
- **SC-039**: Se aceptan 0 canjes de códigos con más de 10 minutos de emitidos, y 0 canjes
  posteriores a 5 intentos fallidos en una hora en cualquiera de los dos ejes de conteo.

---

## Ambigüedades abiertas

Registradas para decidirse explícitamente en `/speckit-clarify`, no por omisión durante la
implementación.

**Resueltas.** Sus decisiones están registradas en `## Clarifications`. Los identificadores
no se reutilizan.

| # | Decisión | Aplicada en |
|---|---|---|
| AMB-001 | Alta de acompañante por cuarta función | Historia 10, FR-077 a FR-085, SC-021 a SC-023 |
| AMB-007 | Propagación de pictograma por quinta función | Historia 9, FR-066 a FR-073, SC-024 a SC-026 |
| AMB-003 | Eliminación con ventana de gracia y tarea diferida | Historia 7, FR-054 a FR-065, SC-027 a SC-030 |
| AMB-002 | Retención de las 3 versiones publicadas más recientes | Historia 6, FR-086 a FR-090, SC-031 y SC-032 |
| AMB-004 | Los archivos permanecen; la autoría se despersonaliza | Historia 7, FR-091 a FR-096, SC-033 y SC-034 |

- **AMB-005 — Umbral de volumen de la evaluación de autorización.** *(No bloqueante)*
  Evaluar si un solicitante figura en la lista de autorizados puede requerir una lectura
  adicional por operación. Falta decidir a partir de qué volumen ese costo justifica un
  mecanismo alternativo. Puede diferirse hasta tener cifras reales, pero condiciona el
  diseño de las reglas.

- **AMB-006 — Expresión del consentimiento de un adulto responsable.** *(No bloqueante)*
  Cuando la persona usuaria es menor de edad, falta decidir qué parte de ese consentimiento,
  si alguna, tiene expresión en el servidor: un campo del perfil, una condición de las
  reglas de acceso, o nada. Si no tiene expresión en el servidor, no pertenece a esta
  especificación y debe registrarse en la del dispositivo.

---

## Assumptions

Supuestos adoptados donde la descripción no fijaba un valor. Cada uno es revisable.

- **La lista de autorizados es un campo del propio documento de perfil.** Es lo que permite
  evaluar la autorización en la misma regla que protege el documento. AMB-005 puede
  cambiarlo.
- **El ámbito de traducción se divide en dos.** Lo que **nunca** se almacena —secuencias de
  señas reconocidas, contenido de conversaciones, historial— no tiene ruta definida: FR-012
  se interpreta como ausencia de ruta, no como denegación. Lo que **sí** se almacena es
  únicamente el agregado diario de FR-100, y sobre él sí hay una regla de acceso que
  denegar (FR-103). Esa separación es la que hace verificable a FR-013.
- **La fecha de una escritura de rutina la fija el servidor**, no el cliente. Un valor
  declarado por el cliente que no coincida se rechaza (FR-017).
- **Los resúmenes diarios son agregados producidos fuera del servidor** y el servidor solo
  verifica que no lleguen eventos individuales de uso (NFR-005). La granularidad diaria se
  toma de la restricción de volumen.
- **El proceso de publicación opera con credenciales de administración** y por lo tanto no
  está sujeto a las reglas de cliente. Su comportamiento se verifica con pruebas propias,
  separadas de las pruebas de reglas, y nunca mezclando ambas credenciales en un mismo test.
- **Conservar el nombre visible de una cuenta eliminada es una tensión asumida.** FR-093 lo
  mantiene en los registros de autoría de perfiles ajenos para que la persona usuaria pueda
  entender quién cambió qué. Es un dato personal de alguien que pidió ser borrado, así que
  la decisión es revisable: si se prefiere privilegiar la supresión, se elimina FR-093 y
  queda solo la marca de FR-092.
- **La ventana de gracia de la eliminación dura 30 días.** La duración no fue fijada por la
  decisión que la introdujo; 30 días es la práctica habitual para eliminación de cuenta.
  Se adopta como valor por defecto revisable: cambiarlo no altera ningún requisito, solo el
  vencimiento con que se encola la tarea de FR-054.
- **La ejecución diferida es de disparo único y se encola en el momento de la solicitud.** No
  es un trabajo programado que barra cuentas vencidas, lo que violaría FR-074. Es la única
  forma de ejecución diferida que la especificación admite.
- **"Indivisible" se define por el resultado observable** (FR-033): tras una interrupción, o
  la versión figura disponible con sus tres artefactos, o no figura. No se supone ninguna
  garantía transaccional del almacén subyacente.
- **La depuración de identificadores de dispositivo ocurre dentro de las funciones de aviso
  ya comprometidas**, como efecto de un fallo de emisión. No constituye una capacidad
  adicional ni requiere un disparador propio, lo que la haría un sondeo prohibido por
  FR-074.
- **El conflicto entre dos escrituras concurrentes se resuelve por última escritura, sin
  fusión ni aviso.** Es una decisión aceptada, no una omisión: la autoría y la fecha
  obligatorias permiten reconstruir qué ocurrió.

---

## Fuera de alcance

Queda **fuera de este repositorio**, y por lo tanto de esta especificación:

- **Toda funcionalidad del dispositivo, sin excepción.** Reconocimiento de señas, síntesis
  de voz, programación de alarmas, ejecución de rutinas, motor de reglas de glosa a frase,
  y cómo el cliente presenta cualquier información.
- El entrenamiento del modelo y el procesamiento del conjunto de datos.
- Cualquier inferencia del lado del servidor.
- Interfaz de usuario de cualquier tipo: no existe cliente web.

Las especificaciones del dispositivo viven en el repositorio de la aplicación y se
referencian por número de funcionalidad.

### Enunciados excluidos deliberadamente

Estos enunciados aparecían en versiones previas de esta especificación y se retiraron por
no ser verificables contra el entorno de emulación sin dispositivo. Se listan para que su
ausencia se lea como una decisión y no como un olvido:

| Enunciado retirado | Motivo | Dónde corresponde |
|---|---|---|
| El canal de emergencia del dispositivo opera sin conexión | Comportamiento del cliente | Especificación del dispositivo |
| Al acompañante se le indica que su cambio quedó pendiente | Presentación del cliente | Especificación del dispositivo |
| Un cambio remoto no altera una rutina en ejecución | Comportamiento del cliente | Especificación del dispositivo |
| El cliente verifica la integridad antes de reemplazar su modelo | Comportamiento del cliente | Especificación del dispositivo |
| Una instalación antigua no descarga un modelo incompatible | Decisión del cliente; el servidor solo **expone** la versión mínima compatible (FR-038) | Especificación del dispositivo |
| La persona usuaria puede desactivar la categoría de novedades | Configuración y presentación del cliente; el servidor solo emite al tema | Especificación del dispositivo |
| El modo invitado funciona localmente | Comportamiento del cliente. Del lado del servidor solo aplica que sin identidad autenticada toda ruta se deniega | Especificación del dispositivo |
