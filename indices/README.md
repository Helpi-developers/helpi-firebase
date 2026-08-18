# Índices de Firestore

`firestore.indexes.json` declara el único índice que no provee automáticamente Firestore:
el alcance de grupo de colección para consultar `rutinas` por
`pictogramas_referenciados`.

Las consultas por `fecha_actualizacion` en el catálogo y por pertenencia a
`uids_autorizados` usan índices automáticos de campo único; no requieren una entrada
explícita. Una consulta futura que combine `deleted_at` con la propagación debe esperar la
decisión del modelo compartido antes de agregar un índice.

