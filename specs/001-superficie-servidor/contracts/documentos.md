# Contrato de documentos — formas que leen y escriben las funciones

**Fase**: 1 | **Plan**: [../plan.md](../plan.md)

Solo las formas que **las funciones de este repositorio** tocan. El modelo completo es la
referencia compartida con `helpi-android`; lo que este repositorio agrega o restringe está
en [../data-model.md](../data-model.md).

Los campos marcados **(D-00N)** son divergencias pendientes de acuerdo con `helpi-android`.
No implementarlos sin ese acuerdo.

---

## `usuarios/{uid}`

Lo que las funciones necesitan de este documento.

```
uids_autorizados: string[]     # identidades con acceso — FR-002 a FR-008
```

- **Función 1** lo lee para saber a quién notificar.
- **Función 3** lo consulta por pertenencia para quitar la identidad eliminada de perfiles
  ajenos (FR-061, FR-094).
- **Función 4** lo escribe para agregar una identidad, sin duplicados (FR-081, FR-083).

Ninguna función escribe otro campo de este documento.

---

## `eliminaciones_pendientes/{uid}` — colección nueva **(D-003)**

Por qué es una colección separada y no un campo del perfil:
[../data-model.md](../data-model.md) § 2.

```
vence_en: timestamp        # instante absoluto — FR-108, FR-110
solicitada_en: timestamp
```

- La crea la **función 3** al aceptar una solicitud (FR-054), con `vence_en` a 30 días
  (FR-055).
- La borra la **función 3** al cancelar (FR-057).
- Su **existencia es la marca** que hace denegar todo el perfil (FR-056).
- Lectura: solo el propietario (FR-097). Contenido: nada más que estos dos campos (FR-098).

**Ninguna función calcula la duración al comprobar.** Se compara `vence_en` con la hora del
servidor (FR-109), que es lo que permite a una prueba sembrar el estado vencido.

---

## `usuarios/{uid}/rutinas/{id}`

```
actualizada_por: string              # validado contra la identidad autenticada — FR-016
fecha_actualizacion: timestamp       # (D-002) fecha del servidor — FR-015, FR-017
pictogramas_referenciados: string[]  # (D-001) lo mantiene el cliente — FR-071
deleted_at: timestamp | null         # (D-004, D-006) del modelo compartido
actividades: [ { pasos: [ { pictograma_id, etiqueta, ubicacion, ... } ] } ]
```

- **Función 5** lo localiza por `pictogramas_referenciados` y actualiza **solo** `etiqueta` y
  `ubicacion` dentro de los pasos que referencian el pictograma cambiado (FR-069).
- Ninguna función escribe `actualizada_por` ni `fecha_actualizacion`: son del cliente y las
  valida la regla.
- **`deleted_at` no está ligado a ningún requisito (D-004).** Falta decidir si la propagación
  alcanza a las rutinas borradas lógicamente; la respuesta además decide si hace falta un
  índice compuesto (R-003).

---

## `usuarios/{uid}/dispositivos/{id}`

```
tipo: "USUARIO" | "TUTOR"    # el token del acompañante cuelga del perfil de la persona usuaria
token_fcm: string            # destino de envío
estado: "ACTIVO" | "INACTIVO"
```

- **Función 1** lo lee **del propio perfil**, filtrando por `tipo: "TUTOR"`, para construir los destinos (FR-042). No hay lectura cruzada de perfiles.
- **Función 1 y función 3** lo **borran** cuando el proveedor reporta el destino como
  inválido durante una emisión (FR-046).

La depuración no tiene disparador propio: ocurre como reacción al fallo de una entrega
dentro de las funciones ya comprometidas. Un disparador propio la convertiría en el sondeo
que FR-074 prohíbe.

---

## `usuarios/{uid}/resumenes/{fecha}`

Cumplimiento de rutinas del día (FR-100). **No es el ámbito de traducción**, que queda fuera de alcance.

```
fecha: string                 # id del documento, YYYY-MM-DD
rutinas: [ { id_rutina, nombre, pasos_completados, pasos_totales } ]
fecha_actualizacion: timestamp
```

**Ninguna función lo lee ni lo escribe.** Aparece acá solo para fijar que la **función 3** lo
borra como parte del subárbol del perfil (FR-059), y que las reglas lo tratan distinto que
igual que al resto de las subcolecciones: propietaria lee y escribe, cuenta autorizada lee (FR-102, FR-103).

Ninguna glosa, texto ni transcripción: una escritura que los incluya se rechaza en la regla,
no en una función (FR-101).

---

## Formas de invocación de las funciones llamables

Tres funciones se invocan desde el cliente. Las otras dos se disparan por evento.

### Función 4 · Obtener código de vinculación

```
Entrada:  { }                              # el perfil es el del llamante
Salida:   { codigo: string, vence_en: string }
```

Permitido solo al propietario sobre su propio perfil (FR-077). El código **viaja firmado con
su instante de vencimiento adentro** y no se persiste en ningún almacén (FR-078, FR-079).

### Función 4 · Canjear código de vinculación

```
Entrada:  { codigo: string }
Salida:   { perfil_id: string }
```

- Rechazo indistinguible entre código vencido, ya canjeado, manipulado o inexistente
  (FR-081), y también cuando el rechazo es por límite de tasa (FR-106).
- Denegado sin autenticar (FR-082).
- Límite: 5 intentos fallidos por hora, contados por cuenta solicitante **y** por perfil
  emisor, el que se alcance primero (FR-084).

### Función 3 · Solicitar y cancelar eliminación

```
solicitar:  Entrada { }  →  Salida { vence_en: string }
cancelar:   Entrada { }  →  Salida { }
```

Ambas permitidas solo al propietario sobre su propia cuenta (FR-057, FR-065).

---

## Contrato de errores

Aplica a las cinco funciones. Principio XIII, FR-049.

- **Nunca un `catch` vacío.** Registrar con contexto y relanzar, o responder con el código
  apropiado en las llamables.
- **Sin datos personales identificables en los registros.** Identificadores opacos sí;
  nombres, contenido y ubicación no.
- Los rechazos que la especificación exige indistinguibles (FR-081, FR-099, FR-106) devuelven
  **el mismo código y el mismo cuerpo**. La distinción puede quedar en el registro del
  servidor, nunca en la respuesta.
- Observabilidad: Cloud Logging y Error Reporting. **Sin Sentry.**
