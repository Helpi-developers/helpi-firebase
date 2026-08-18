# Specification Quality Checklist: Superficie de servidor de Helpi

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-18
**Last Updated**: 2026-08-18 (revisión: perímetro acotado a comportamiento observable del servidor)
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
- [ ] **No implementation details leak into specification** — ver nota sobre FR-023

## Verificabilidad contra el entorno de emulación

Regla de redacción declarada en la especificación: cada requisito debe poder verificarse
emitiendo una solicitud contra el entorno de emulación, sin dispositivo.

- [x] Los 65 requisitos funcionales se expresan como permitido / denegado / aceptado /
      rechazado / presente / ausente
- [x] Ningún requisito funcional describe comportamiento interno ni presentación del cliente
- [x] Los 8 requisitos no funcionales declaran su método de verificación
- [x] Los requisitos no funcionales no comprobables por emulación están identificados como
      tales (NFR-003, NFR-004, NFR-005, NFR-007: revisión de diseño)
- [x] Los enunciados retirados por no ser verificables están listados con su motivo y su
      destino (sección "Enunciados excluidos deliberadamente", 7 entradas)

## Superficie comprometida

- [x] Las tres funciones comprometidas están cubiertas por una historia cada una
      (Historias 4, 8 y 7)
- [x] Toda capacidad adicional que los requisitos exigen está marcada como ambigüedad con
      su justificación, no incorporada (AMB-001, AMB-007)
- [x] Ninguna función se dispara por sondeo ni permanece en ejecución (FR-063 a FR-065)

## Constitution Alignment

Verificación contra `.specify/memory/constitution.md` v1.0.0.

- [x] Principio II — la superficie se declara acotada y toda adición queda marcada, no
      incorporada (NFR-007, AMB-001, AMB-007)
- [x] Principio III — disparo por evento, sin sondeo ni ejecución permanente (FR-063 a FR-065)
- [x] Principio IV — la prohibición se expresa como ausencia de ruta, verificable
      (FR-012, FR-031, FR-045, SC-007, SC-008, SC-015)
- [x] Principio V — las cuatro clases de solicitante tienen resultado esperado en cada regla
      (FR-009, SC-002)
- [x] Principio VI — caso permitido y caso denegado en toda regla (NFR-006, SC-001)
- [x] Principio VII — la restricción de forma de entrega se expresa sin nombrar el mecanismo
      (FR-043, FR-052, SC-016)
- [x] Principio VIII — publicación indivisible, sin sobrescritura, con validación de
      correspondencia (FR-032 a FR-041)
- [x] Principio IX — dos zonas sin solapamiento ni hueco (FR-030, Historia 3 escenario 8)
- [x] Principio X — colecciones globales de solo lectura para todo cliente (FR-020, SC-009)
- [x] Principio XI — el acceso autorizado no alcanza el ámbito de traducción (FR-012, FR-013)
- [x] Principio XII — el proceso de publicación se verifica con pruebas propias, sin mezclar
      credenciales de administración y de cliente en un mismo test (Assumptions)
- [x] Principio XIII — manejo de errores explícito (NFR-008, FR-049)
- [x] Principio XVI — no se produjo código, solo documentos de especificación

## Notes

### Ítem abierto: FR-023 (índice de consulta)

FR-023 exige que exista el índice que soporta la consulta por diferencia. Es lo más cerca
de un detalle de implementación que hay en el documento. **Se mantiene deliberadamente**
por dos razones: el usuario lo pidió de forma explícita ("Debe existir el índice que lo haga
posible"), y los índices son uno de los artefactos que este repositorio contiene, de modo
que su ausencia es un fallo observable —la consulta se rechaza— y no una decisión interna.
Queda marcado sin tildar para que un revisor lo confirme o lo reformule.

### Ambigüedades abiertas

Siete ambigüedades registradas en la sección "Ambigüedades abiertas" (AMB-001 a AMB-007).
No se usó el marcador `[NEEDS CLARIFICATION]` porque bloquea el flujo de `/speckit-specify`
y obligaría a resolverlas en esta fase, contra el pedido explícito de marcarlas y no
resolverlas. Se resuelven en `/speckit-clarify`.

**Cuatro son bloqueantes para `/speckit-plan`:**

- **AMB-001** y **AMB-007** son contradicciones entre los requisitos de esta especificación
  y la superficie comprometida de tres funciones. Ambas se detectaron al redactar, no
  estaban en la entrada como tales:
  - AMB-001 (validación del código de vinculación) sí venía señalada en la entrada.
  - **AMB-007 (propagación de referencias duplicadas a un pictograma) es nueva.** El
    requisito funcional 9 de la entrada exige una escritura sobre perfiles ajenos
    desencadenada por otra escritura: eso no lo puede hacer un cliente y no está entre las
    tres funciones. Se marcó en lugar de incorporarse, y la Historia 9 quedó explícitamente
    condicionada.
- **AMB-002** (retención de versiones anteriores) y **AMB-003** (inmediatez del borrado)
  afectan a requisitos ya escritos: FR-039/SC-014 y FR-057/SC-018 respectivamente.

**Consecuencia práctica**: mientras AMB-001 no se resuelva, la lista de autorizados —de la
que depende toda la Historia 1— solo puede poblarse por un medio no especificado. Es la
ambigüedad más urgente.

### Cambios respecto de la versión anterior de la especificación

- Se reescribió por completo en términos de comportamiento observable del servidor.
- Se retiraron 7 enunciados sobre el dispositivo, listados en la tabla "Enunciados
  excluidos deliberadamente" con su motivo y su destino.
- La historia de vinculación de acompañante desapareció como tal: lo verificable del lado
  del servidor —quién modifica la lista de autorizados y qué efecto tiene— quedó en las
  Historias 1 y 2; la validación del código pasó a ser AMB-001.
- Los requisitos no funcionales pasaron de 14 a 8 y cada uno declara su método de
  verificación, para no afirmar que se comprueba por emulación algo que se comprueba por
  revisión.
- El campo **Input** de la cabecera lleva una paráfrasis de la descripción del usuario en
  lugar de su texto literal, para no introducir nombres de tecnología en un documento cuya
  regla es no mencionarlos.

---

- Mark items `[x]` only after review confirms the requirement-quality criterion is satisfied
- Leave items unchecked when they still require clarification, correction, or reviewer evaluation
- `/speckit-implement` reads checklist checkbox state as a gate and must not modify markers
- `checklists/requirements.md` has a separate built-in lifecycle maintained by `/speckit-specify` and `/speckit-clarify`
