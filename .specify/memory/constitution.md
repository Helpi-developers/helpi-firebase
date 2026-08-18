<!--
Sync Impact Report
==================
Cambio de versión: plantilla sin completar → 1.0.0
Motivo del salto: ratificación inicial. El archivo previo era el andamio
`constitution-template` con todos los marcadores sin resolver; no existía
gobernanza vigente que pudiera romperse.

Principios modificados: ninguno (no había principios previos).
Principios añadidos (16):
  I.    La especificación manda
  II.   Ejecución local primero
  III.  Las funciones son pegamento liviano
  IV.   Privacidad como restricción dura
  V.    La regla de tutor
  VI.   Ninguna regla sin prueba de permitido y denegado
  VII.  FCM solo con mensajes de datos
  VIII. Publicación atómica de modelo y catálogo
  IX.   Dos zonas de Cloud Storage que no se mezclan
  X.    Colecciones globales de solo lectura
  XI.   El control parental no alcanza la traducción
  XII.  Pruebas contra el Emulator Suite
  XIII. Manejo de errores explícito y observabilidad
  XIV.  Despliegue a producción solo desde integración continua
  XV.   Sin suposición de propagación instantánea
  XVI.  Las fases de especificación no producen código

Secciones añadidas:
  - Alcance del repositorio y stack obligatorio (SECTION_2)
  - Flujo de trabajo y puertas de calidad (SECTION_3)
  - Gobernanza

Secciones eliminadas: ninguna.

Notas de estructura: la plantilla base define cinco principios de ejemplo; la
entrada del proyecto define dieciséis y se respeta ese número. Los encabezados
conservan el nivel de la plantilla y se expresan en español, coherente con el
resto de la documentación del proyecto.

TODO pendientes: ninguno. Todos los marcadores fueron resueltos.
-->

# Constitución de helpi-firebase

Este repositorio es la capa de sincronización y servicios administrados de Helpi, una
aplicación Android de comunicación aumentativa y alternativa para personas sordas
usuarias de Lengua de Señas Argentina y para personas con TEA o síndrome de Down.

Dos hechos condicionan todas las reglas que siguen. El primero: el dispositivo Android
es autónomo; Firebase complementa, nunca reemplaza. El segundo: los datos que se manejan
son datos de salud y discapacidad, sensibles bajo la Ley N.º 25.326 de Argentina. Un
defecto acá no degrada una experiencia, deja a una persona sin poder comunicarse o expone
información que no debía salir del dispositivo.

## Principios fundamentales

### I. La especificación manda

No se escribe ninguna función, regla de seguridad ni índice que no esté trazado a una
historia de usuario o a un requisito de la especificación correspondiente. Las
especificaciones de funcionalidad viven en `helpi-android` y se referencian por enlace y
por número de funcionalidad; NO DEBEN duplicarse en este repositorio.

Si el código y la especificación difieren, gana la especificación: se reporta la
divergencia, no se resuelve por cuenta propia. Si la especificación está mal o
incompleta, se frena y se corrige la especificación primero.

**Fundamento:** duplicar la especificación produce dos fuentes de verdad que divergen en
silencio. Trazar cada artefacto a un requisito es lo único que permite revisar si el
servidor hace de más.

### II. Ejecución local primero (NO NEGOCIABLE)

Toda función nueva EXIGE justificación explícita, escrita en la especificación, de por
qué no puede resolverse en el dispositivo. La superficie de servidor comprometida es
deliberadamente mínima y se limita a: aviso a contactos de confianza, publicación de
novedades por temas y borrado en cascada al eliminar una cuenta.

Sumar puntos de acceso es una erosión del principio, no una mejora. Una función sin esa
justificación se rechaza en revisión.

**Fundamento:** reconocimiento, voz y rutinas DEBEN funcionar sin conexión. Cada
capacidad que migra al servidor es una capacidad que deja de funcionar cuando la persona
no tiene red, y una superficie más de exposición de datos sensibles.

### III. Las funciones son pegamento liviano

Las Cloud Functions NO DEBEN contener lógica de negocio compleja: esa lógica vive en los
módulos de dominio en Java puro del dispositivo. Toda función se dispara por evento. El
sondeo periódico está PROHIBIDO.

**Fundamento:** lógica duplicada entre dispositivo y servidor diverge y produce
comportamientos distintos según quién resolvió. El sondeo, además, gasta cuota y batería
para observar un estado que el evento ya comunica.

### IV. Privacidad como restricción dura (NO NEGOCIABLE)

NO SE PERSISTE en Firestore ni en Cloud Storage, bajo ninguna ruta y por ningún medio:

- video;
- keypoints;
- secuencias de glosas reconocidas;
- contenido de conversaciones traducidas;
- material de autenticación: contraseñas, hashes o tokens de vinculación.

Si una regla, una función o un test intenta escribir alguno de estos datos, es un defecto
de seguridad y BLOQUEA la fusión. No hay excepción por conveniencia, por depuración ni
por métrica.

**Fundamento:** la secuencia de glosas es la transcripción de una conversación privada
entre una persona sorda y su interlocutor. Es un dato sensible bajo la Ley N.º 25.326.
Las credenciales son responsabilidad de Firebase Auth y de nadie más.

### V. La regla de tutor

La regla de tutor es el ÚNICO mecanismo de separación entre el perfil de una persona con
discapacidad y cualquier otro usuario autenticado. Un usuario puede leer o escribir
`usuarios/{uid}` si su UID es igual a `uid`, o si aparece en el array `uids_autorizados`
de ese documento.

Cualquier cambio sobre esta regla EXIGE como mínimo cuatro pruebas nuevas:

1. propietario: permitido;
2. tutor autorizado: permitido;
3. usuario autenticado no autorizado: denegado;
4. usuario no autenticado: denegado.

**Fundamento:** al ser el único mecanismo de separación, un error acá expone el perfil
completo de una persona con discapacidad a cualquier cuenta del proyecto. Las cuatro
pruebas cubren las cuatro clases de sujeto que existen frente a la regla.

### VI. Ninguna regla sin prueba de permitido y denegado (NO NEGOCIABLE)

Ninguna regla de seguridad se fusiona sin una prueba que verifique tanto el caso
permitido como el caso denegado. Probar solo el caso permitido no verifica nada: una
regla que autoriza a todos también lo pasa.

Este es el criterio de aceptación no negociable del repositorio.

**Fundamento:** es la única barrera técnica que protege datos sensibles bajo la
Ley N.º 25.326. No hay revisión manual que sustituya una prueba automatizada del caso
denegado.

### VII. FCM solo con mensajes de datos

Firebase Cloud Messaging se usa SIEMPRE con mensajes de datos y NUNCA con carga de
notificación (`notification` payload). Una función que construya una carga de
notificación es un defecto y bloquea la fusión.

**Fundamento:** la carga de notificación se muestra sin ejecutar el código del cliente.
Eso saltea las franjas de silencio, el modo de bajo estímulo y la configuración por
categoría, es decir, exactamente los mecanismos de accesibilidad del proyecto. Una
notificación fuera de franja no es una molestia: es un estímulo no consentido para una
persona con TEA.

### VIII. Publicación atómica de modelo y catálogo

Modelo y catálogo de señas se publican como una unidad atómica, mediante el script
versionado del repositorio y NUNCA por carga manual desde la consola. Reglas derivadas:

- los artefactos de modelo se publican siempre en rutas nuevas por versión y JAMÁS se
  sobrescriben;
- el hash del manifiesto se valida como parte de la publicación;
- revertir una versión defectuosa es cambiar el campo de versión activa en Firestore, no
  tocar Cloud Storage.

**Fundamento:** un índice de clase solo tiene sentido contra el catálogo de la misma
versión. Si modelo y catálogo se desincronizan, la aplicación traduce mal sin arrojar
ningún error visible: la persona sorda dice una cosa y la aplicación dice otra, y nadie
se entera. Sobrescribir una ruta convierte un despliegue en un cambio retroactivo sobre
dispositivos que ya descargaron esa versión.

### IX. Dos zonas de Cloud Storage que no se mezclan

Cloud Storage tiene dos zonas con reglas opuestas y NO DEBEN mezclarse:

| Zona | Lectura | Escritura | Contenido |
|---|---|---|---|
| Pública | Cualquier usuario autenticado | Solo SDK de administración | Modelos versionados, catálogo, manifiesto |
| Por cuenta | Propietario y tutores autorizados | Propietario y tutores autorizados | Pictogramas personalizados, audios grabados por el acompañante |

Ninguna ruta puede quedar cubierta por las reglas de ambas zonas.

**Fundamento:** son dos perfiles de riesgo inversos. Un artefacto de modelo mal ubicado
en la zona por cuenta deja de estar disponible para el resto; un audio personal mal
ubicado en la zona pública queda legible por todo el proyecto.

### X. Colecciones globales de solo lectura

Las colecciones globales —vocabularios, modelos, configuración de modelo activo y
pictogramas— son de solo lectura para usuarios autenticados y NO ADMITEN escritura desde
el cliente en ninguna circunstancia. Su escritura ocurre únicamente desde el SDK de
administración, a través del script de publicación o de una función.

**Fundamento:** son datos compartidos por toda la base de usuarios. Una escritura desde
un cliente afecta a todas las personas a la vez, incluida la selección de modelo activo,
que determina si la traducción funciona.

### XI. El control parental no alcanza la traducción

El tutor PUEDE leer y escribir las rutinas y la configuración de la persona vinculada.
El tutor NO PUEDE acceder al ámbito de traducción bajo ninguna forma: ni métricas de
conversación, ni historial, ni contenido de lo que la persona expresó. Tampoco accede al
ámbito de emergencias.

**Fundamento:** el control parental existe para sostener rutinas, no para vigilar
conversaciones. Una persona con discapacidad tiene el mismo derecho a la privacidad de
su comunicación que cualquier otra; confundir acompañamiento con vigilancia convierte
una herramienta de accesibilidad en una de control.

### XII. Pruebas contra el Emulator Suite, nunca contra producción

Todas las pruebas corren contra el Firebase Emulator Suite. NUNCA contra el proyecto
real. Además:

- está PROHIBIDO usar reglas permisivas del tipo `allow read, write: if true`, incluso en
  pruebas; se usan credenciales de test explícitas;
- NO SE MEZCLAN credenciales de administración con credenciales de usuario en el mismo
  test.

**Fundamento:** una prueba que corre con credenciales de administración pasa aunque la
regla esté rota, porque el SDK de administración no evalúa reglas. Una regla permisiva
declarada "solo para pruebas" es una regla que puede desplegarse por error.

### XIII. Manejo de errores explícito y observabilidad

Nunca un `catch` vacío. Toda función SIEMPRE registra y relanza, o responde con el código
HTTP apropiado. El repositorio NO incorpora Sentry: la observabilidad es Cloud Logging y
Error Reporting para las funciones, y Crashlytics en la aplicación.

**Fundamento:** un fallo silencioso en el aviso a contactos de confianza significa que
nadie recibió el aviso y nadie lo sabe. La degradación DEBE ser observable.

### XIV. Despliegue a producción solo desde integración continua

El despliegue a producción es una acción deliberada y ocurre ÚNICAMENTE desde integración
continua. NO se despliega al proyecto real desde una máquina local, ni reglas, ni
funciones, ni índices, ni artefactos de modelo.

**Fundamento:** un despliegue local no deja rastro, no pasa por las puertas de calidad y
puede publicar código que nunca fue revisado. En un repositorio cuya única barrera de
privacidad son las reglas de seguridad, eso es inaceptable.

### XV. Sin suposición de propagación instantánea

Las reglas y las funciones NO ASUMEN propagación instantánea. La caché offline de
Firestore está habilitada en el cliente: un cambio hecho por el acompañante sin conexión
no llega al dispositivo de la persona usuaria hasta que ambos tengan red.

Todo diseño que dependa de que dos dispositivos vean el mismo estado al mismo tiempo se
rechaza. Los casos borde de sincronización diferida se cubren explícitamente en la
especificación.

**Fundamento:** la aplicación no debe sorprender. Un cambio remoto que se aplica en medio
de una rutina en curso rompe la previsibilidad de la que depende una persona con TEA.

### XVI. Las fases de especificación no producen código

Durante las fases de especificación, aclaración, checklist, planificación y generación de
tareas NO se implementa código. En esas fases solo se crean o actualizan los documentos
correspondientes.

**Fundamento:** implementar durante la especificación invierte el orden de autoridad del
Principio I: el código pasa a definir la especificación en vez de derivarse de ella.

## Alcance del repositorio y stack obligatorio

### Dentro de este repositorio

- Cloud Functions (TypeScript sobre Node.js, 2da generación).
- Reglas de seguridad de Firestore y de Cloud Storage.
- Índices compuestos de Firestore.
- Configuración del Emulator Suite y flujos de integración continua.
- Script versionado de publicación de modelos.

### Fuera de este repositorio

- La aplicación Android: `helpi-android`.
- El pipeline de aprendizaje automático en Python: `helpi-ml`.

### Stack obligatorio

- TypeScript sobre Node.js. NO se admite Python ni Java en este repositorio.
- Cloud Functions de 2da generación, con disparadores de evento y HTTP.
- Firestore Rules y Storage Rules, con pruebas unitarias de reglas mediante
  `@firebase/rules-unit-testing`.
- Firebase Emulator Suite corriendo en integración continua en cada solicitud de
  incorporación.

### Nomenclatura del modelo de datos

- Colecciones: `snake_case` plural.
- Campos: `snake_case`.
- Enumerados: `MAYÚSCULAS`.
- Fechas: ISO-8601 o timestamp nativo.
- Cloud Storage: los documentos guardan rutas, NUNCA binarios.
- IDs de documento: siempre string.

## Flujo de trabajo y puertas de calidad

### Ramas y commits

- Desarrollo basado en tronco. La rama `main` está protegida y siempre desplegable.
- Convención de nombres de rama:
  - `NNN-nombre-funcionalidad` para funcionalidades especificadas;
  - `fix/descripcion-breve` para correcciones;
  - `chore/descripcion` para documentación o infraestructura.
- Cuando una funcionalidad atraviesa repositorios, la rama lleva el mismo número en
  todos: `helpi-firebase/003-recordatorios-rutina` junto a
  `helpi-android/003-recordatorios-rutina`.
- Commits convencionales, con descripción en español y el número de funcionalidad en el
  cuerpo del mensaje.
- Sin líneas de coautoría, atribución ni firmas generadas por herramientas.

### Puertas de fusión (todas obligatorias, sin excepciones manuales)

1. Verificación de tipos de TypeScript en verde.
2. Pruebas de reglas en verde, con caso permitido y caso denegado por cada regla tocada
   (Principio VI).
3. Pruebas de funciones en verde, corriendo contra el Emulator Suite (Principio XII).
4. Revisión obligatoria por otra persona.
5. Trazabilidad declarada: cada artefacto nuevo enlaza su requisito de especificación
   (Principio I).
6. Fusión por aplastamiento (squash).

Un fallo en cualquiera de estas puertas bloquea la fusión. No se saltean con anulación
manual.

## Gobernanza

Esta constitución tiene autoridad sobre cualquier otra práctica del repositorio,
incluidos `CLAUDE.md`, las convenciones del código existente y la costumbre. Ante un
conflicto, gana esta constitución.

**Orden de autoridad, de mayor a menor:**

1. Esta constitución.
2. La especificación de la funcionalidad en curso, alojada en `helpi-android`.
3. Los documentos de alcance, arquitectura y modelo de datos.
4. `CLAUDE.md` y las guías de agentes.
5. El código existente.

**Enmiendas.** Toda enmienda se propone en una solicitud de incorporación dedicada, sobre
una rama `chore/`, que modifica únicamente este archivo. La propuesta DEBE declarar: el
principio afectado, el motivo, el impacto sobre reglas, funciones y pruebas existentes, y
el plan de migración si lo requiere. Requiere revisión y aprobación explícita antes de
fusionarse.

**Versionado.** Esta constitución usa versionado semántico:

- **MAJOR:** se elimina o redefine un principio de forma incompatible con lo anterior.
- **MINOR:** se agrega un principio o una sección, o se amplía materialmente una guía
  existente.
- **PATCH:** aclaraciones, redacción, correcciones de tipeo y refinamientos no semánticos.

Los principios marcados NO NEGOCIABLE (II, IV, VI) no admiten excepción por conveniencia.
Relajarlos es siempre un cambio MAJOR y exige una justificación escrita en la solicitud
de incorporación de enmienda.

**Revisión de cumplimiento.** Toda solicitud de incorporación se revisa contra esta
constitución. Quien revisa verifica explícitamente los Principios IV, V, VI y VII cuando
la solicitud toca reglas de seguridad, funciones de mensajería o rutas de persistencia.
Una divergencia detectada se reporta y se resuelve antes de fusionar; no se documenta
como deuda.

**Guía de desarrollo en tiempo de ejecución:** `CLAUDE.md` en la raíz del repositorio.

**Version**: 1.0.0 | **Ratified**: 2026-08-18 | **Last Amended**: 2026-08-18
