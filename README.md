# helpi-firebase

Capa de sincronización y servicios administrados de [Helpi](https://github.com/Helpi-developers/helpi-android), una aplicación Android de comunicación aumentativa y alternativa para personas sordas usuarias de Lengua de Señas Argentina y para personas con TEA o síndrome de Down.

## Qué vive acá

- Cloud Functions (TypeScript, Node.js, 2da generación)
- Reglas de seguridad de Firestore y Cloud Storage
- Índices compuestos de Firestore
- Configuración del Firebase Emulator Suite e integración continua
- Script versionado de publicación de modelos

## Qué no vive acá

| Repositorio | Contenido |
|---|---|
| `helpi-android` | Aplicación Android y especificaciones de funcionalidad |
| `helpi-ml` | Pipeline de entrenamiento del modelo `.tflite` |

## Principios no negociables

**Ejecución local primero.** Firebase complementa, nunca reemplaza. El reconocimiento, la voz y las rutinas funcionan sin conexión.

**Privacidad como restricción dura.** No se persiste video, keypoints, secuencias de glosas ni contenido de conversaciones. Son datos sensibles bajo la Ley N.º 25.326.

**Ninguna regla sin prueba de permitido y denegado.** Toda regla de seguridad requiere ambos casos verificados. Es la única barrera técnica que protege los datos.

La constitución completa está en [`.specify/memory/constitution.md`](.specify/memory/constitution.md).

## Stack

- TypeScript sobre Node.js
- Firebase: Firestore, Storage, Auth, FCM, App Check
- `@firebase/rules-unit-testing` para pruebas de reglas
- Firebase Emulator Suite en CI

## Desarrollo

Las especificaciones de funcionalidad viven en `helpi-android`. Antes de implementar cualquier cosa en este repositorio, la especificación correspondiente debe existir y estar cerrada.

Todo despliegue a producción ocurre únicamente desde integración continua. No se despliega desde una máquina local.

### Verificación local

Requisitos: Node 22, Java y Firebase CLI. El repositorio no tiene un proyecto por defecto;
la verificación usa exclusivamente el Emulator Suite.

```bash
npm install
npm install --prefix functions
npm install --prefix tests/reglas
npm run verificar
```

Para levantar los emuladores de forma interactiva:

```bash
firebase emulators:start --only firestore,storage,auth,functions
```

La publicación de modelos requiere un manifiesto y artefactos producidos por `helpi-ml` y
debe ejecutarse desde CI. En local sólo se permite explícitamente contra el emulador:

```bash
npm run publicar -- --version v2 --artefactos ./artefactos/v2 --emulador
```

La guía operativa y los escenarios de aceptación están en
`specs/001-superficie-servidor/quickstart.md`.
