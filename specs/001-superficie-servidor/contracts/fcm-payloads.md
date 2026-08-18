# Contrato de mensajes de envío

**Fase**: 1 | **Plan**: [../plan.md](../plan.md)

Tres funciones de este repositorio notifican. Las tres construyen **mensajes de datos**.

## Regla que gobierna las tres

> **La clave `notification` no aparece nunca.** Ni vacía, ni condicional, ni en una rama de
> error.

Un mensaje con carga de notificación lo muestra el sistema operativo **sin ejecutar código
del cliente**, lo que saltea las franjas de silencio, el modo de bajo estímulo y la
configuración por categoría. En una aplicación de accesibilidad eso no es una molestia: es
un estímulo no consentido para una persona con TEA.

Requisitos: FR-043, FR-052, FR-096 · Principio VII.

**Cómo se verifica sin dispositivo**: la construcción se aísla en
`functions/src/comun/envio.ts` y la prueba afirma la **ausencia** de la clave sobre la
estructura resultante. Ninguna prueba puede construir un mensaje con carga de notificación,
ni siquiera para comprobar que se rechaza.

---

## Forma común

```
{
  token | topic: <destino>,
  data: {
    tipo: <identificador de categoría>,
    ... campos propios de la categoría, todos cadenas
  },
  android: {
    priority: <"high" | "normal">
  }
}
```

Todos los valores de `data` son cadenas: el transporte no conserva tipos.

---

## 1 · Aviso de emergencia

**Función**: `aviso-emergencia` · **Destino**: `token_fcm` de cada dispositivo con
`tipo: TUTOR` registrado **bajo el propio perfil** · **Requisitos**: FR-042 a FR-049

```
data: {
  tipo: "emergencia",
  perfil_id: <uid de quien activó>,
  emitido_en: <instante ISO-8601>
}
android: { priority: "high" }
```

**Qué no lleva** (FR-044): nombre, ubicación, diagnóstico, contenido de conversación, ni
ningún dato del que se derive información de salud. `perfil_id` es un identificador opaco;
quien lo recibe ya está autorizado sobre ese perfil y puede resolverlo por su cuenta.

**Qué no se persiste** (FR-045): ni el hecho, ni su hora, ni sus destinatarios. El
`emitido_en` viaja en el mensaje y no queda en ningún almacén.

**Ante fallo de entrega**: se continúa con el resto de los destinos (FR-047), se depura el
destino inválido (FR-046) y se registra el fallo sin datos personales identificables
(FR-049).

---

## 2 · Novedad de contenido

**Función**: `novedades-tema` · **Destino**: tema · **Requisitos**: FR-050 a FR-053

```
data: {
  tipo: "novedad",
  categoria: <"modelo" | "pictogramas" | "vocabulario">,
  version: <identificador de la versión publicada>
}
android: { priority: "normal" }
```

**Anuncia disponibilidad y no transporta el contenido** (FR-051). El `version` alcanza para
que el cliente decida si le interesa; la descarga la resuelve él y no la fuerza este
mensaje.

Si la publicación no corresponde a ningún tema definido, la función **termina sin emitir y
sin error** (FR-053).

---

## 3 · Cierre de vínculo por eliminación de cuenta

**Función**: `borrado-cascada` · **Destino**: `token_fcm` de los dispositivos de los perfiles
en cuya lista figuraba la cuenta que se elimina · **Requisitos**: FR-094 a FR-096

```
data: {
  tipo: "vinculo_cerrado",
  perfil_id: <uid del perfil que recibe el aviso>
}
android: { priority: "normal" }
```

**Es informativo y no condiciona la eliminación** (FR-095): la ausencia de respuesta no
impide que el borrado se complete al vencer la ventana de gracia. No hay mensaje de
confirmación ni canal de respuesta.

**Qué no lleva** (FR-096): la identidad de la cuenta que se elimina no viaja en el mensaje.
El perfil que lo recibe ya la conoce por su propia lista de autorizados.

---

## Qué no notifica

| Operación | Por qué no |
|---|---|
| Alta de acompañante (función 4) | Ningún requisito lo pide. Agregar un aviso sería superficie no especificada |
| Propagación de pictograma (función 5) | Ídem. El cambio llega en la próxima sincronización |
| Cancelación de la eliminación (FR-057) | Ídem |

Agregar cualquiera de estos avisos exige un requisito nuevo en la especificación primero
(Principio I).
