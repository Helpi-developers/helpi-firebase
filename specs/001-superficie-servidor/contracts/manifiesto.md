# Contrato de publicación — manifiesto y documento de versión

**Fase**: 1 | **Plan**: [../plan.md](../plan.md) | **Fundamento**: [../research.md](../research.md) § R-004

Requisitos: FR-032 a FR-041, FR-086 a FR-090 · Principio VIII.

---

## Rutas de una versión

Cada versión ocupa su ubicación propia y **nunca se sobrescribe** (FR-032, FR-034).

```
Cloud Storage
modelos/{version}/
├── modelo            # artefacto que produce helpi-ml
├── catalogo          # catálogo de señas de esa versión
└── manifiesto        # el documento de abajo

Firestore
modelos/{version}     # punto de compromiso de la publicación
config/modelo_activo  # versión vigente — último paso
```

`{version}` es un identificador estable que no se reutiliza, **ni siquiera después de una
publicación interrumpida** (R-004).

---

## Manifiesto

Se sube junto a los artefactos y permite a un cliente verificar la integridad de lo que
descargó **antes** de reemplazar su modelo activo (FR-035).

```
{
  version: <identificador de la versión>,
  vocabulario_version: <versión de vocabulario que este modelo requiere>,
  publicado_en: <instante ISO-8601>,
  artefactos: {
    modelo:   { hash: <digest>, bytes: <entero> },
    catalogo: { hash: <digest>, bytes: <entero> }
  }
}
```

**`vocabulario_version` es el campo que impide la falla silenciosa.** Un índice de clase
solo tiene sentido contra el catálogo de su misma versión; si se desincronizan, la
aplicación traduce mal sin arrojar ningún error visible. El script valida que
`vocabularios/{vocabulario_version}` exista y corresponda **antes** de anunciar la versión
como vigente (FR-037).

---

## Documento de versión

```
modelos/{version}
├── vocabulario_version: string
├── publicado_en: timestamp
├── version_minima_app: string      # FR-038
├── rutas: { modelo, catalogo, manifiesto }   # rutas de Storage, nunca binarios
└── hashes: { modelo, catalogo }
```

Su existencia **es** la disponibilidad de la versión. Mientras no exista, los artefactos
subidos son inertes porque nada los referencia: es lo que convierte una operación no
transaccional en indivisible desde el resultado observable (FR-033).

Solo lectura para todo cliente; escritura únicamente con credenciales de administración
(FR-020, FR-021).

---

## Indicador de versión vigente

```
config/modelo_activo
├── version: string                 # apunta a modelos/{version}
├── version_minima_app: string      # FR-038
└── actualizado_en: timestamp
```

- **Cambiarlo es la única operación necesaria para revertir** (FR-039). No se republica
  ningún artefacto.
- Se rechaza designar vigente una versión cuyo catálogo no exista o no corresponda (FR-037),
  o que haya sido eliminada por retención (FR-090).
- Existe una comprobación que detecta un indicador apuntando a una versión inexistente
  (FR-040).

---

## Secuencia de publicación

El orden importa. Cada paso solo se ejecuta si el anterior terminó bien.

| # | Paso | Si falla acá |
|---|---|---|
| 1 | Validar que `vocabularios/{vocabulario_version}` existe y corresponde (FR-036) | Nada se subió. Se aborta sin efectos |
| 2 | Validar que la versión no fue publicada antes | Ídem. **Se rechaza reutilizar el número** (FR-034) |
| 3 | Subir modelo, catálogo y manifiesto a las rutas de la versión | Quedan objetos huérfanos, inertes. El script los informa y quema el número de versión |
| 4 | Verificar los hashes de lo subido contra el manifiesto | Ídem |
| 5 | **Escribir `modelos/{version}`** ← punto de compromiso | La versión existe y es válida, pero no es la vigente. Estado legítimo |
| 6 | Aplicar retención: eliminar versiones fuera de las 3 más recientes, **nunca la vigente** (FR-086 a FR-088) | Sobran versiones antiguas. Reejecutable sin efectos |
| 7 | Actualizar `config/modelo_activo` ← siempre el último | — |

**Por qué el documento va antes que el indicador**: publicar el indicador primero abriría una
ventana en la que la versión vigente no tiene artefactos, que es exactamente la traducción
incorrecta sin error visible que el Principio VIII busca impedir.

**Modo de ejecución**: cuenta de servicio con SDK de administración, **únicamente desde
integración continua** (Principio XIV). Nunca desde una máquina local ni desde la consola
(FR-041). El script consume el artefacto que produce `helpi-ml`; no lo genera ni lo entrena.

---

## Retención

- Se conservan las **3 versiones más recientes** (FR-086).
- Al confirmar una nueva, las que quedan fuera se eliminan con sus tres artefactos (FR-087).
- **Nunca se elimina la versión vigente**, aunque quede fuera de la ventana (FR-088).
- Eliminar por retención es la **única mutación admitida** sobre una ubicación ya publicada;
  la sobrescritura sigue rechazada (FR-089).
