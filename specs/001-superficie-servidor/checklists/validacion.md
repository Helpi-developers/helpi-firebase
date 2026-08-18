# Validación previa a la planificación: Superficie de servidor de Helpi

**Purpose**: Validar la calidad de la especificación antes de `/speckit-plan`, con el
criterio maestro de que todo requisito debe poder verificarse contra el entorno de
emulación, sin dispositivo y sin intervención humana
**Created**: 2026-08-18
**Feature**: [spec.md](../spec.md)

**Review Ownership**: Este checklist es un artefacto de revisión de calidad de requisitos y
pertenece a quien revisa. `[x]` significa que el criterio de calidad se considera
satisfecho; no significa que haya trabajo de implementación terminado.

**Nota sobre el estado de las casillas**: la evaluación inicial la hizo el agente **a
pedido explícito de quien revisa**, que solicitó ítems marcados según cumplimiento. El
estado final sigue siendo del revisor: cada `[x]` es una propuesta a confirmar, y cada `[ ]`
señala un hallazgo con su ubicación.

---

## Completitud de requisitos

- [x] CHK001 - ¿Cada historia de usuario tiene criterios de aceptación explícitos? [Completeness, Spec §Historias 1–10]
- [x] CHK002 - ¿Cada historia declara su prueba independiente sin depender de otras historias? [Completeness, Spec §Independent Test]
- [x] CHK003 - ¿Todo requisito funcional está cubierto por al menos una historia? [Traceability, Spec §FR-001–FR-096]
- [x] CHK004 - ¿Toda historia tiene al menos un requisito funcional asociado? [Traceability]
- [x] CHK005 - ¿Está la duración de la ventana de gracia fijada en un requisito y no solo en un supuesto? [Gap, Spec §FR-054, §FR-059] — **Resuelto en la 2.ª sesión de clarificación.** Sí: FR-055 fija los 30 días y FR-107 exige registrar el vencimiento como instante absoluto
- [ ] CHK006 - ¿Declara la función de novedades qué persiste y qué no persiste? [Gap, Spec §FR-050–FR-053] — la función de emergencia lo declara en FR-045; la de novedades no tiene equivalente
- [ ] CHK007 - ¿Existe un requisito que respalde el caso borde de la cuenta pendiente de eliminación que conserva acceso a perfiles ajenos? [Gap, Spec §Edge Cases] — el comportamiento está solo en la sección de casos borde; FR-056 se limita al perfil propio y ningún FR enuncia la conservación
- [ ] CHK008 - ¿Está especificado el límite del abanico de la propagación de pictograma? [Gap, Spec §FR-066–FR-073] — no hay cota de cantidad de perfiles alcanzados, ni paginación, ni comportamiento esperado cuando el abanico excede el tiempo de ejecución
- [x] CHK009 - ¿Declara cada función su disparador de forma identificable? [Completeness, Spec §Superficie comprometida, §FR-076]
- [x] CHK010 - ¿Están documentados los supuestos adoptados donde la descripción no fijaba un valor? [Assumption, Spec §Assumptions]

## Cobertura de las cuatro clases de solicitante

- [x] CHK011 - ¿Enuncia la especificación la obligación de evaluar cada regla contra las cuatro clases? [Completeness, Spec §FR-009]
- [x] CHK012 - ¿Tiene la regla de acceso al perfil sus cuatro casos explícitos? [Coverage, Spec §FR-002–FR-005]
- [x] CHK013 - ¿Tiene la zona por cuenta del almacén de archivos sus cuatro casos explícitos? [Coverage, Spec §FR-025–FR-027, §Historia 3]
- [ ] CHK014 - ¿Declara la especificación dónde la taxonomía de cuatro clases no aplica y por qué? [Gap, Spec §FR-018–FR-020] — las colecciones globales y la zona pública solo distinguen autenticado y no autenticado; falta decir explícitamente que las clases propietario y autorizado no aplican ahí, en lugar de dejarlo implícito
- [x] CHK015 - ¿Está declarado quién **puede** disparar el evento de emergencia? [Gap, Spec §FR-042, §FR-048] — **Resuelto en la 2.ª sesión de clarificación.** Sí: FR-042 declara el caso permitido (solo el propietario) y FR-048 los tres denegados
- [x] CHK016 - ¿Tiene la modificación de la lista de autorizados su caso permitido y su caso denegado? [Coverage, Spec §FR-007, §FR-085]
- [x] CHK017 - ¿Tiene el canje del código de vinculación sus casos permitido y denegado diferenciados? [Coverage, Spec §FR-080–FR-082]

## Claridad y medibilidad

- [x] CHK018 - ¿Está libre el documento de términos no medibles como "rápido", "seguro", "eficiente" o "adecuado"? [Clarity] — barrido léxico sin resultados
- [x] CHK019 - ¿Tiene cada criterio de aceptación condición inicial, acción y resultado observable? [Measurability, Spec §Acceptance Scenarios]
- [x] CHK020 - ¿Indica cada criterio si el resultado esperado es permitido, denegado, aceptado o rechazado cuando aplica? [Measurability, Spec §Regla de redacción]
- [x] CHK021 - ¿Está cuantificado el límite de tasa de los intentos de canje fallidos? [Ambiguity, Spec §FR-084] — **Resuelto en la 2.ª sesión de clarificación.** Sí: FR-084 fija 5 intentos fallidos por hora en dos ejes, y FR-078 la vigencia de 10 minutos
- [x] CHK022 - ¿Está definido qué contiene el "ámbito de traducción" que FR-013 protege? [Ambiguity, Conflict, Spec §FR-012, §FR-013, §NFR-001] — **Resuelto en la 2.ª sesión de clarificación.** Sí: FR-100 define el agregado diario como único contenido admitido; FR-101 excluye glosas y transcripción
- [x] CHK023 - ¿Es objetivamente verificable el criterio de indivisibilidad de la publicación? [Measurability, Spec §FR-033]
- [x] CHK024 - ¿Están los criterios de éxito expresados con métricas contables? [Measurability, Spec §SC-001–SC-034]

## Consistencia interna

- [x] CHK025 - ¿Son compatibles la denegación total de acceso durante la gracia y la facultad de cancelar? [Conflict, Spec §FR-056, §FR-057] — **Resuelto en la 2.ª sesión de clarificación.** Sí: FR-056 declara las dos únicas excepciones, cancelación (FR-057) e indicador de estado (FR-097)
- [x] CHK026 - ¿Puede el propietario conocer que su perfil está pendiente de eliminación? [Gap, Spec §FR-056] — **Resuelto en la 2.ª sesión de clarificación.** Sí: FR-097 a FR-099 definen el indicador de estado legible solo por el propietario
- [x] CHK027 - ¿Son compatibles la prohibición de consultar perfiles ajenos y las consultas que el borrado y el aviso requieren? [Conflict, Spec §FR-008, §FR-061, §FR-094] — **Resuelto en la 2.ª sesión de clarificación.** Sí: FR-008 quedó acotado a los clientes y exceptúa explícitamente el proceso de administración
- [x] CHK028 - ¿Es coherente la retención de versiones con la operación de reversión? [Consistency, Spec §FR-039, §FR-086–FR-090, §SC-031]
- [x] CHK029 - ¿Es coherente la excepción de eliminación por retención con la prohibición de sobrescritura? [Consistency, Spec §FR-034, §FR-089]
- [ ] CHK030 - ¿Se usa un término único para la cuenta que acompaña a la persona usuaria? [Consistency] — conviven "cliente autorizado" (§Actores), "cuenta autorizada" (§Edge Cases), "acompañante" (§Historia 10) y "tutor" (§Clarifications) para el mismo concepto, sin glosario que los unifique
- [ ] CHK031 - ¿Está definido el "contacto de confianza" que da nombre a la función 1? [Gap, Consistency, Spec §Superficie comprometida, §Historia 4, §FR-042] — el término aparece solo como rótulo en tres lugares; la tabla de actores no lo define y FR-042 notifica a las cuentas autorizadas, que es otro concepto
- [x] CHK032 - ¿Están las decisiones de la sesión de clarificación reflejadas en el cuerpo y no solo en la lista de ambigüedades? [Traceability, Spec §Clarifications, §Historias 6, 7, 9, 10]
- [x] CHK033 - ¿Quedó alguna ambigüedad resuelta de forma implícita, sin decisión registrada? [Consistency, Spec §Clarifications] — las cinco resoluciones tienen entrada propia y tabla de aplicación

## Consistencia con la constitución del repositorio

- [ ] CHK034 - ¿Coincide la cantidad de funciones especificadas con la superficie comprometida por la constitución? [Conflict, Spec §Superficie comprometida, Constitución §Principio II] — la constitución v1.0.0 fija tres funciones y la especificación llegó a cinco. Las dos adiciones tienen justificación escrita, pero el documento de gobernanza no fue enmendado
- [x] CHK035 - ¿Declara cada función incorporada por qué no puede resolverse en el cliente? [Traceability, Spec §Superficie comprometida, §NFR-007]
- [ ] CHK036 - ¿Es compatible conservar el nombre visible de una cuenta eliminada con la prohibición de retener datos de quien ejerció la supresión? [Conflict, Spec §FR-093, Constitución §Principio IV] — la tensión está declarada en Assumptions como revisable, pero ningún requisito la resuelve
- [x] CHK037 - ¿Está la restricción de forma de entrega expresada sin nombrar el mecanismo? [Clarity, Spec §FR-043, §FR-052, §FR-096]
- [x] CHK038 - ¿Está la prohibición de sondeo periódico enunciada como requisito verificable? [Completeness, Spec §FR-058, §FR-074–FR-076]
- [x] CHK039 - ¿Está declarado que las pruebas del proceso de publicación no mezclan credenciales de administración con las de cliente? [Completeness, Spec §Assumptions, Constitución §Principio XII]

## Índices y consultas declaradas

- [x] CHK040 - ¿Tiene la consulta por diferencia del catálogo su índice declarado? [Completeness, Spec §FR-022, §FR-023]
- [x] CHK041 - ¿Tiene la consulta de rutinas que referencian un pictograma su índice declarado? [Completeness, Spec §FR-071, §FR-072]
- [x] CHK042 - ¿Tiene la consulta de perfiles que contienen una identidad en su lista de autorizados su índice declarado? [Gap, Spec §FR-061, §FR-094] — **Resuelto en la 2.ª sesión de clarificación.** Sí: FR-062 declara la consulta por pertenencia y su índice, y sirve también a FR-094
- [x] CHK043 - ¿Está cada índice derivado de una consulta enunciada en un requisito? [Traceability, Spec §FR-023, §FR-072]

## Cobertura de escenarios y casos borde

- [x] CHK044 - ¿Tiene cada caso borde listado un resultado esperado y no solo el enunciado del escenario? [Coverage, Spec §Edge Cases]
- [x] CHK045 - ¿Están cubiertos los escenarios de excepción de la publicación: interrupción, sobrescritura y activación inconsistente? [Coverage, Spec §Historia 6 escenarios 2, 3, 5]
- [x] CHK046 - ¿Están cubiertos los escenarios de recuperación: reintento del borrado y de la propagación? [Coverage, Spec §FR-064, §FR-073]
- [x] CHK047 - ¿Está cubierto el escenario de conflicto entre dos escrituras concurrentes con su resolución declarada? [Coverage, Spec §Edge Cases, §Assumptions]
- [x] CHK048 - ¿Está cubierto el escenario de solicitud sin identidad autenticada en ambos almacenes? [Coverage, Spec §Edge Cases, §FR-005]
- [ ] CHK049 - ¿Está definido qué ocurre si la tarea diferida del borrado se pierde o nunca se dispara? [Gap, Spec §FR-054, §FR-058] — se prohíbe el barrido periódico que detectaría el caso y no se define ninguna alternativa de detección, de modo que un perfil podría quedar suspendido de forma indefinida

## Testeabilidad contra el entorno de emulación

- [x] CHK050 - ¿Se expresan los requisitos como resultado observable del servidor y no como comportamiento interno del cliente? [Measurability, Spec §Regla de redacción]
- [x] CHK051 - ¿Declara cada requisito no funcional su método de verificación? [Measurability, Spec §NFR-001–NFR-008]
- [x] CHK052 - ¿Están identificados los requisitos no funcionales que no se comprueban por emulación? [Clarity, Spec §NFR-003, §NFR-004, §NFR-005, §NFR-007]
- [x] CHK053 - ¿Está definido cómo se adelanta el reloj para comprobar el vencimiento de la ventana de gracia? [Gap, Spec §Historia 7 escenarios 6–16, §SC-029, §SC-030] — **Resuelto en la 2.ª sesión de clarificación.** Sí: FR-106 a FR-109 expresan todo vencimiento como instante absoluto sembrable en pruebas
- [ ] CHK054 - ¿Está definido cómo se simula que el proveedor de envío reporta un identificador como inválido? [Gap, Spec §FR-046, §SC-017] — el criterio depende de una respuesta externa y no se declara cómo se produce esa condición en el entorno de emulación
- [x] CHK055 - ¿Está libre el documento de criterios que exijan dispositivo físico, cámara u observación visual? [Measurability, Spec §Enunciados excluidos deliberadamente]

## Restricciones no negociables

- [x] CHK056 - ¿Está la prohibición de almacenar video, puntos clave, secuencias de señas, conversaciones y material de autenticación expresada como ausencia de ruta? [Completeness, Spec §NFR-001, §FR-012, §FR-031]
- [x] CHK057 - ¿Tiene esa prohibición criterios de éxito contables? [Measurability, Spec §SC-007, §SC-008, §SC-013]
- [x] CHK058 - ¿Está la no persistencia del evento de emergencia enunciada y medida? [Completeness, Spec §FR-045, §SC-015]
- [x] CHK059 - ¿Está la publicación especificada como indivisible y sobre ubicaciones nuevas por versión? [Completeness, Spec §FR-032–FR-034]
- [x] CHK060 - ¿Tiene el derecho de supresión un criterio de aceptación verificable en lugar de una declaración de intención? [Measurability, Spec §NFR-002, §SC-030]
- [x] CHK061 - ¿Está enunciada la prohibición de rutas de escritura de alta frecuencia? [Completeness, Spec §NFR-005]
- [ ] CHK062 - ¿Está evaluada la propagación de pictograma frente a la prohibición de escritura de alta frecuencia? [Gap, Spec §NFR-005, §FR-066–FR-073] — un cambio de etiqueta puede producir una escritura masiva sobre muchos perfiles y ningún requisito relaciona esa operación con NFR-005 ni acota su volumen

## Trazabilidad de ambigüedades

- [x] CHK063 - ¿Están las ambigüedades resueltas con su decisión y su lugar de aplicación registrados? [Traceability, Spec §Ambigüedades abiertas]
- [x] CHK064 - ¿Están las ambigüedades abiertas marcadas con su carácter bloqueante o no bloqueante? [Traceability, Spec §AMB-005, §AMB-006]
- [x] CHK065 - ¿Se declara que los identificadores de ambigüedad resueltos no se reutilizan? [Traceability, Spec §Ambigüedades abiertas]

---

## Hallazgos de alcance

Sección separada por ser el riesgo específico de este repositorio: la especificación no debe
describir la aplicación del dispositivo, el pipeline de entrenamiento, inferencia de
servidor ni interfaz de usuario.

- [x] CHK066 - ¿Está libre el documento de requisitos que describan captura, reconocimiento, síntesis de voz, programación de alarmas o ejecución de rutinas? [Scope, Spec §Fuera de alcance]
- [x] CHK067 - ¿Está libre el documento de requisitos sobre el pipeline de entrenamiento o el procesamiento del conjunto de datos? [Scope, Spec §Fuera de alcance]
- [x] CHK068 - ¿Está libre el documento de requisitos que supongan inferencia del lado del servidor? [Scope, Spec §Fuera de alcance]
- [x] CHK069 - ¿Está libre el documento de requisitos de interfaz de usuario o cliente web? [Scope, Spec §Fuera de alcance]
- [x] CHK070 - ¿Están listados con su motivo y su destino los enunciados retirados por describir el dispositivo? [Scope, Traceability, Spec §Enunciados excluidos deliberadamente] — 7 entradas
- [ ] CHK071 - ¿Se limita FR-035 a describir el artefacto en lugar de la capacidad del cliente? [Scope, Spec §FR-035] — "el manifiesto DEBE permitir a un cliente verificar la integridad de los artefactos descargados" enuncia lo que el cliente hace; la formulación observable sería qué contiene el manifiesto
- [ ] CHK072 - ¿Se limita FR-067 a describir la forma del dato en lugar del patrón de lectura del cliente? [Scope, Spec §FR-067] — "de modo que leer una rutina no requiera lecturas adicionales por paso" justifica la duplicación por el comportamiento del cliente, que está fuera de este repositorio
- [ ] CHK073 - ¿Están los conceptos del documento ligados a los nombres del modelo de datos del proyecto? [Gap, Spec §Key Entities, Constitución §Nomenclatura] — la especificación evita deliberadamente nombrar colecciones, campos y rutas para mantenerse neutral, pero no ofrece glosario que los vincule con la nomenclatura en snake_case que fija la constitución, de modo que la coincidencia de nombres no puede verificarse en esta fase

---

## Veredicto

**Actualizado tras la 2.ª sesión de clarificación del 2026-08-18.**

**Apta para planificar.** Los nueve hallazgos bloqueantes quedaron resueltos: 59 de 73 ítems
satisfechos, y ninguno de los 14 abiertos impide escribir una regla ni una prueba.

### Resueltos en la 2.ª sesión de clarificación

| # | Hallazgo | Resolución |
|---|---|---|
| CHK025 | Denegación total durante la gracia vs. facultad de cancelar | FR-056 declara las dos únicas excepciones |
| CHK026 | El propietario no podía leer que su perfil está pendiente | FR-097 a FR-099: indicador de estado acotado |
| CHK027 | Prohibición de consultar perfiles ajenos vs. lo que el borrado requiere | FR-008 acotado a los clientes |
| CHK022 | "Ámbito de traducción" sin definir frente a NFR-001 | FR-100 a FR-104: solo agregado diario, sin contenido |
| CHK015 | Disparo de emergencia sin caso permitido | FR-042 declara el permitido, FR-048 los denegados |
| CHK005 | Ventana de gracia no fijada en ningún requisito | FR-055: 30 días |
| CHK021 | Límite de tasa sin umbral | FR-084: 5 fallidos por hora en dos ejes; FR-078: vigencia 10 minutos |
| CHK053 | Sin mecanismo para adelantar el reloj | FR-106 a FR-109: vencimientos como instante absoluto |
| CHK042 | Consulta por pertenencia sin índice | FR-062 declara consulta e índice |

### Abiertos, ninguno bloqueante

**Calidad de requisitos**: CHK006 (qué persiste la función de novedades), CHK007 (caso borde
sin requisito que lo respalde), CHK014 (dónde no aplican las cuatro clases), CHK049 (tarea
diferida perdida), CHK054 (simulación del proveedor de envío).

**Volumen y riesgo**: CHK008 y CHK062 (el abanico de la propagación no tiene cota ni
comportamiento definido al exceder el tiempo de ejecución). Es el hallazgo abierto de mayor
impacto y conviene cerrarlo durante `/speckit-plan`, cuando se conozcan los límites reales
de ejecución.

**Terminología y gobernanza**: CHK030 (cuatro nombres para la cuenta acompañante), CHK031
("contacto de confianza" da nombre a la función 1 y no está definido), CHK034 (la
constitución sigue diciendo tres funciones), CHK036 (FR-093 frente al Principio IV).

**Alcance**: CHK071 a CHK073 (dos formulaciones que describen al cliente en lugar del
artefacto, y ausencia de glosario que ligue los conceptos con la nomenclatura del modelo de
datos).

### Recomendación

Se puede avanzar a `/speckit-plan`. Dos cosas convienen antes o durante:

1. **Enmendar la constitución a cinco funciones** (CHK034). Es un cambio MINOR y hoy el
   documento de gobernanza contradice a la especificación.
2. **Acotar el abanico de la propagación** (CHK008, CHK062), que es donde queda el riesgo
   real sin especificar.

---

## Notes

- Marcá `[x]` solo cuando la revisión confirme que el criterio de calidad de requisitos está satisfecho
- Dejá sin marcar los ítems que todavía requieren aclaración, corrección o evaluación del revisor
- `/speckit-implement` lee el estado de las casillas como puerta y no debe modificar los marcadores
- `checklists/requirements.md` tiene su propio ciclo de vida, mantenido por `/speckit-specify` y `/speckit-clarify`
- Este checklist no modificó la especificación: solo registra hallazgos
