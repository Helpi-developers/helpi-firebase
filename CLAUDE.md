# CLAUDE.md

Contexto e instrucciones para agentes de código en el repositorio de Helpi.

---

## 1. Qué es Helpi

Aplicación Android de accesibilidad comunicacional. Dos ámbitos:

- **Traducción de LSA (núcleo).** Reconoce Lengua de Señas Argentina con visión
  por computadora y la traduce a texto y voz, para que una persona sorda se
  comunique con una persona oyente que no conoce la LSA.
- **Rutinas y pictogramas (Fase 2).** Acompaña a personas con TEA o síndrome de
  Down mediante secuencias de pictogramas narradas por voz, con checklist y
  recordatorios de baja intensidad. Incluye control parental: un acompañante
  crea y edita rutinas desde su propio dispositivo.

**Usuarios reales:** personas con discapacidad y sus familias o terapeutas. No es
un proyecto de demo. Un error acá deja a alguien sin poder comunicarse o sin sus
recordatorios, en silencio y sin aviso.

### Stack

| Ámbito | Tecnología |
|---|---|
| Interfaz y ciclo de vida | Kotlin, corrutinas, CameraX |
| Lógica de dominio | Java puro, sin dependencias de Android |
| Reconocimiento | MediaPipe Tasks (Holistic Landmarker) + LiteRT |
| Nube | SDK de Firebase: Firestore, Storage, Auth, FCM, App Check |
| Persistencia local | Room sobre SQLite |
| Programación de tareas | AlarmManager (hora exacta) y WorkManager (el resto) |
| Entrenamiento del modelo | Python, fuera de la aplicación, produce un `.tflite` |

Python **no corre en el dispositivo**. Produce un artefacto que se publica.

---

## 2. La especificación manda

El proyecto usa metodología SDD con Spec Kit. Los artefactos de especificación
—`constitution`, `specify`, `clarify`, `checklist`, `plan`, `tasks`, `analyze`—
son la fuente de verdad.

**Orden de autoridad, de mayor a menor:**

1. La especificación de la funcionalidad en curso (SDD).
2. Los documentos de alcance, arquitectura y modelo de datos.
3. Este archivo.
4. El código existente.

Reglas que se derivan de eso:

- Antes de implementar, leé la especificación de la funcionalidad. Si no existe,
  decilo y pará.
- Si el código y la especificación difieren, **gana la especificación**. Reportá
  la divergencia, no la resuelvas por tu cuenta.
- Si la especificación está mal o incompleta, **decilo y pará**. No la
  "arregles" desde el código: se corrige en la especificación primero.
- Toda tarea debe poder rastrearse a un ítem de `tasks.md`. Si no existe, decilo.

---

## 3. Reglas de trabajo

### 3.1 Pensar antes de codear

No asumas. No escondas la confusión. Explicitá los intercambios.

- Declará tus supuestos. Si tenés dudas, preguntá.
- Si hay varias interpretaciones posibles, presentalas. No elijas en silencio.
- Si existe un camino más simple, decilo. Discutí cuando corresponda.
- Si algo no está claro, frená. Nombrá qué te confunde. Preguntá.

### 3.2 Simplicidad primero

El mínimo código que resuelve el problema. Nada especulativo.

- Nada de funcionalidad más allá de lo pedido.
- Nada de abstracciones para código de un solo uso.
- Nada de "flexibilidad" o "configurabilidad" que no se pidió.
- Nada de manejo de errores para escenarios imposibles.
- Si escribís 200 líneas y podrían ser 50, reescribilo.

La prueba: ¿un ingeniero con experiencia diría que esto está sobrecomplicado?

### 3.3 Cambios quirúrgicos

Tocá solo lo que tenés que tocar. Limpiá solo tu propio desorden.

- No "mejores" código, comentarios ni formato adyacentes.
- No refactorices lo que no está roto.
- Respetá el estilo existente, aunque vos lo harías distinto.
- Si ves código muerto no relacionado, mencionalo. No lo borres.
- Sí eliminá los imports, variables y funciones que **tus** cambios dejaron sin uso.

La prueba: cada línea modificada debe poder rastrearse al pedido.

### 3.4 Ejecución orientada a objetivos

Definí criterios de éxito. Iterá hasta verificarlos.

- "Agregar validación" → "escribir tests de entradas inválidas y hacerlos pasar".
- "Arreglar el bug" → "escribir un test que lo reproduzca y hacerlo pasar".
- "Refactorizar X" → "los tests pasan antes y después".

Para tareas de varios pasos, enunciá un plan breve:

```
1. [Paso] → verificar: [comprobación]
2. [Paso] → verificar: [comprobación]
3. [Paso] → verificar: [comprobación]
```

Un criterio fuerte te permite iterar solo. Uno débil ("que funcione") obliga a
pedir aclaraciones todo el tiempo.

### 3.5 No inventes

- No inventes APIs, métodos ni parámetros. Verificá contra la documentación o el
  código real.
- No agregues dependencias sin justificarlas y avisar.
- Si no sabés si una biblioteca soporta algo, decí que no sabés.

---

## 4. Principios de arquitectura

Cuando dos opciones compiten, gana la que respeta estos principios, aunque sea
la más costosa de implementar.

- **Ejecución local.** Reconocimiento, voz y rutinas funcionan sin conexión. La
  red sirve para sincronizar, nunca para funcionar.
- **Gama baja como objetivo.** El dispositivo de referencia no es un gama alta.
  Toda decisión que consuma memoria, batería o presupuesto térmico se evalúa
  contra ese piso.
- **Minimización de datos.** No se almacena video ni keypoints.
- **Previsibilidad.** La aplicación no debe sorprender. Un cambio remoto no se
  aplica en medio de una rutina en curso.
- **Degradación limpia.** Ninguna función crítica queda bloqueada por la
  ausencia de un servicio externo. Siempre hay un camino determinístico.

---

## 5. Restricciones duras

No se negocian. Si una tarea parece requerir violar una de estas, frená y decilo.

- **Nunca persistir video, keypoints ni la secuencia de glosas reconocidas.**
  Viven en memoria durante la sesión y se descartan. La secuencia de glosas es
  una transcripción de una conversación privada (Ley N.º 25.326).
- **Nunca guardar credenciales en Firestore.** Contraseñas, hashes y tokens de
  vinculación son responsabilidad de Firebase Auth.
- **Nunca escribir a Firestore en alta frecuencia.** Métricas, logs, conteos de
  uso y avance paso a paso van a la base local; solo sube el agregado diario.
- **FCM siempre con mensajes de datos**, nunca con carga de notificación: con
  carga de notificación el sistema muestra el aviso sin ejecutar código propio y
  se saltean las franjas de silencio y el modo de bajo estímulo.
- **Modelo y catálogo se versionan y publican juntos.** Un índice de clase solo
  tiene sentido contra el catálogo de la misma versión. Desacoplarlos produce
  traducciones incorrectas sin ningún error visible.
- **El programador es el único componente que registra alarmas.** Si otra parte
  del código agenda, la persona recibe avisos duplicados.
- **Toda alarma tiene su espejo en la base local.** El sistema operativo no
  permite consultarlas y las borra al reiniciar.

---

## 6. Convenciones de código

- **Kotlin** para interfaz, cámara, SDK de Firebase, WorkManager y ciclo de vida.
- **Java puro** para el motor de rutinas, las reglas de glosa a frase y el
  programador de notificaciones. Sin dependencias de Android: se prueban con
  JUnit sin emulador ni dispositivo.
- Nada de dominio llama a `Instant.now()` ni a `System.currentTimeMillis()`
  directamente: se inyecta un `Reloj`. Es lo único que permite probar husos
  horarios y franjas que cruzan la medianoche.
- Puertos e implementaciones: el dominio declara interfaces, el módulo Android
  provee los adaptadores.
- Nombres de dominio en español, coherentes con la especificación y el modelo de
  datos (`glosa`, `rutina`, `paso`, `franja_silencio`).
- Firestore y modelo de datos: colecciones y campos en `snake_case`, enumerados
  en `MAYÚSCULAS`, IDs de documento siempre string.

### Tests

- Lo que se puede probar sin dispositivo, se prueba sin dispositivo.
- Tests instrumentados solo para lo que los requiere de verdad: AlarmManager,
  receptor de arranque, permisos.
- Casos borde que siempre hay que cubrir: franja de silencio que cruza la
  medianoche, cambio de huso horario, rutina editada durante su ejecución,
  reinicio del dispositivo, índice de clase inexistente en la versión activa.

---

## 7. Commits

Conventional Commits con **descripción en español**.

```
<tipo>(<alcance>): <descripción en imperativo, minúscula, sin punto final>

<cuerpo opcional: por qué, no qué>

Refs: #<número de issue>
```

**Tipos** (se mantienen en inglés, son el estándar): `feat`, `fix`, `docs`,
`refactor`, `test`, `perf`, `build`, `ci`, `chore`.

**Alcances** habituales: `traduccion`, `rutinas`, `pictogramas`, `notificaciones`,
`emergencias`, `modelo`, `sync`, `ui`, `datos`.

Ejemplos:

```
feat(notificaciones): agregar espejo de alarmas en base local

Sin la tabla espejo, un reinicio del dispositivo deja a la persona sin
recordatorios y no hay forma de detectarlo.

Refs: #42
```

```
fix(traduccion): validar version de vocabulario antes de resolver la glosa
```

```
test(rutinas): cubrir edicion de rutina durante la ejecucion
```

### Sin coautoría

**Nunca** agregues líneas de coautoría, atribución ni firmas generadas:

- Nada de `Co-Authored-By:`.
- Nada de `Generated with...`.
- Nada de emojis ni referencias a herramientas de IA en el mensaje.

El commit lleva únicamente el autor humano.

### Otras reglas de commits

- Un commit por cambio lógico. No mezcles refactor con funcionalidad.
- No commitees archivos generados, credenciales, `google-services.json` con
  claves reales, ni artefactos de modelo.
- No hagas `push` ni abras un PR salvo que te lo pidan explícitamente.

---

## 8. Ramas

| Tipo | Formato | Ejemplo |
|---|---|---|
| Funcionalidad | `NNN-nombre-funcionalidad` | `003-recordatorios-rutina` |
| Corrección | `fix/descripcion-breve` | `fix/alarma-duplicada-reinicio` |
| Documentación o infraestructura | `chore/descripcion` | `chore/emulador-en-ci` |

El número de la rama es el mismo que el de la especificación y el de las
incidencias asociadas. No trabajes sobre `main`.

---

## 9. Documentos de referencia

| Documento | Qué define |
|---|---|
| Documento de Alcance | Qué hace la aplicación y qué queda afuera |
| Documento de Arquitectura | Cómo se construye, con la fundamentación de cada decisión y las alternativas descartadas |
| Modelo de datos (Firestore) | Colecciones, campos, qué se embebe y qué no va a la nube |
| Diagrama de clases | Módulos de dominio en Java y sus puertos |
| Especificación de la funcionalidad | La tarea concreta en curso |

Si tu cambio contradice cualquiera de estos, la contradicción se resuelve
**antes** de escribir código.

---

## 10. Antes de dar una tarea por terminada

- [ ] Cada línea modificada se rastrea al pedido.
- [ ] La especificación se cumplió, o la divergencia está reportada.
- [ ] Los tests pasan; los casos borde relevantes están cubiertos.
- [ ] No se persiste nada que las restricciones duras prohíban.
- [ ] No quedaron imports ni símbolos huérfanos por tus cambios.
- [ ] El mensaje de commit sigue la convención y no tiene coautoría.