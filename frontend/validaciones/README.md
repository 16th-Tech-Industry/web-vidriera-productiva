# Validaciones — pruebas automáticas del Frontend

Pruebas sencillas de las reglas de validación de `Login.tsx` y
`registrousuario.tsx` (formato de email, largo de contraseña, contraseñas
que coinciden, acceso admin, campos obligatorios del registro). No levantan
navegador ni backend: prueban directamente las funciones puras copiadas en
`validaciones.mjs`.

Respaldan los casos **TC-L-01…07** y **TC-R-01…07** de la planilla de casos
de prueba (módulos Login y Registro).

## Cómo ejecutar

Requisito: Node.js 22+ (el runner `node --test` viene incluido, no hace
falta instalar nada).

```bash
cd frontend
node --test
```

Resultado esperado: **14/14 pruebas en verde**. La última corrida quedó
guardada en `frontend_node-test.txt`.
