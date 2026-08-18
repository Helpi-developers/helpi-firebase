# Specification Quality Checklist: Superficie de servidor de Helpi

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-18
**Last Updated**: 2026-08-18 (revalidación tras `/speckit-clarify`: 5 decisiones integradas)
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [ ] **No implementation details leak into specification** — ver nota abajo

## Verificabilidad contra el entorno de emulación

Regla de redacción declarada en la especificación: cada requisito debe poder verificarse
emitiendo una solicitud contra el entorno de emulación, sin dispositivo.

- [x] Los 94 requisitos funcionales se expresan como permitido / denegado / aceptado /
      rechazado / presente / ausente
- [x] Ningún requisito funcional describe comportamiento interno ni presentación del cliente
- [x] Los 8 requisitos no funcionales declaran su método de verificación
- [x] Los requisitos no funcionales no comprobables por emulación están identificados como
      tales (NFR-003, NFR-004, NFR-005, NFR-007: revisión de diseño)
- [x] Los enunciados retirados por no ser verificables están listados con su motivo y su
      destino (sección "Enunciados excluidos deliberadamente", 7 entradas)
- [ ] **El vencimiento de la ventana de gracia es comprobable sin esperar 30 días** — la
      spec no dice cómo se adelanta el reloj en el entorno de emulación. Afecta a los
      escenarios 6 a 10 y 16 de la Historia 7 y a SC-029 y SC-030.

## Superficie comprometida

- [x] Las cinco funciones comprometidas están cubiertas por una historia cada una
      (Historias 4, 8, 7, 10 y 9)
- [x] Cada función incorporada tras la constitución inicial declara su justificación frente
      al Principio II (funciones 4 y 5, sección "Superficie comprometida")
- [x] Ninguna capacidad adicional quedó incorporada sin decisión explícita
- [x] Ninguna función se dispara por sondeo ni permanece en ejecución (FR-072 a FR-074)
- [x] La ejecución diferida del borrado es de disparo único y no un barrido periódico
      (FR-057, escenario 12 de la Historia 7, SC-029)
- [ ] **La función 5 concentra el mayor riesgo del repositorio y no tiene checklist de
      revisión propio** — escribe en abanico sobre perfiles ajenos eludiendo por diseño la
      regla de separación. FR-064 a FR-071 acotan qué puede tocar, pero conviene un
      `/speckit-checklist` dedicado antes de implementarla.

## Constitution Alignment

Verificación contra `.specify/memory/constitution.md` v1.0.0.

- [x] Principio II — cada capacidad declara por qué no puede resolverse en el cliente
      (NFR-007, sección "Superficie comprometida")
- [x] Principio III — disparo por evento, sin sondeo ni ejecución permanente (FR-072 a FR-074)
- [x] Principio IV — la prohibición se expresa como ausencia de ruta, verificable
      (FR-012, FR-031, FR-045, SC-007, SC-008, SC-015)
- [x] Principio V — las cuatro clases de solicitante tienen resultado esperado en cada regla
      (FR-009, SC-002)
- [x] Principio VI — caso permitido y caso denegado en toda regla (NFR-006, SC-001)
- [x] Principio VII — la restricción de forma de entrega se expresa sin nombrar el mecanismo
      (FR-043, FR-052, FR-094, SC-016)
- [x] Principio VIII — publicación indivisible, sin sobrescritura, con validación de
      correspondencia (FR-032 a FR-041)
- [x] Principio IX — dos zonas sin solapamiento ni hueco (FR-030, Historia 3 escenario 8)
- [x] Principio X — colecciones globales de solo lectura para todo cliente (FR-020, SC-009)
- [x] Principio XI — el acceso autorizado no alcanza el ámbito de traducción (FR-012, FR-013)
- [x] Principio XII — el proceso de publicación se verifica con pruebas propias, sin mezclar
      credenciales de administración y de cliente en un mismo test (Assumptions)
- [x] Principio XIII — manejo de errores explícito (NFR-008, FR-049)
- [x] Principio XVI — no se produjo código, solo documentos de especificación
- [ ] **Principio IV frente a FR-091** — conservar el nombre visible de una cuenta eliminada
      es un dato personal de alguien que ejerció su derecho de supresión. La tensión está
      declarada en Assumptions y es revisable; requiere confirmación de un revisor.

## Notes

### Ítem abierto: detalles de implementación

Tres enunciados son lo más cerca de un detalle de implementación que hay en el documento.
**Se mantienen deliberadamente** y el ítem queda sin tildar para que un revisor los confirme
o los reformule:

1. **FR-023 y FR-066 (índices de consulta).** Los índices son uno de los artefactos que este
   repositorio contiene, y su ausencia es un fallo observable —la consulta se rechaza—, no
   una decisión interna.
2. **FR-054 y FR-057 (tarea diferida de disparo único).** Nombran un mecanismo, no solo un
   resultado. Fue necesario para distinguir la ejecución diferida admitida del barrido
   periódico que FR-072 prohíbe; sin esa distinción el requisito no sería verificable.

### Ambigüedades

Cinco de las siete quedaron resueltas en la sesión de clarificación del 2026-08-18. Sus
decisiones están en `## Clarifications` y su aplicación en la tabla de resueltas.

| # | Estado | Efecto sobre el alcance |
|---|---|---|
| AMB-001 | Resuelta | Suma la función 4 (alta de acompañante) |
| AMB-007 | Resuelta | Suma la función 5 (propagación de pictograma) |
| AMB-003 | Resuelta | Reescribe la Historia 7 en dos tiempos y suma ejecución diferida |
| AMB-002 | Resuelta | Acota la reversión a 3 versiones |
| AMB-004 | Resuelta | Suma FR-089 a FR-094 y un aviso nuevo |
| AMB-005 | Abierta, no bloqueante | Umbral de costo de la evaluación de autorización |
| AMB-006 | Abierta, no bloqueante | Expresión del consentimiento de un adulto responsable |

**Ninguna ambigüedad bloqueante queda abierta.** Las dos restantes no impiden planificar:
AMB-005 depende de cifras de uso que todavía no existen, y AMB-006 puede resolverse
declarando que no tiene expresión en el servidor.

### El alcance creció

La superficie pasó de tres funciones a cinco, y los requisitos funcionales de 65 a 94. El
crecimiento proviene de decisiones explícitas, no de deriva, pero conviene tenerlo presente
al planificar: la constitución vigente (Principio II) describe la superficie comprometida
como tres funciones y esa cifra quedó desactualizada.

**Acción sugerida**: enmendar `.specify/memory/constitution.md` para reflejar las cinco
funciones antes de `/speckit-plan`, o dejar constancia de por qué no se enmienda. Es un
cambio MINOR según la política de versionado de la propia constitución.

---

- Mark items `[x]` only after review confirms the requirement-quality criterion is satisfied
- Leave items unchecked when they still require clarification, correction, or reviewer evaluation
- `/speckit-implement` reads checklist checkbox state as a gate and must not modify markers
- `checklists/requirements.md` has a separate built-in lifecycle maintained by `/speckit-specify` and `/speckit-clarify`
