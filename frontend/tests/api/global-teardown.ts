import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Al terminar, borra de la base los usuarios creados por los tests de registro.
export default function globalTeardown() {
  const backend = path.resolve(__dirname, '../../../backend');
  const salida = execFileSync(
    path.join(backend, '.venv/bin/python'),
    [path.resolve(__dirname, 'limpiar_registro_pw.py')],
    { cwd: backend, encoding: 'utf-8' },
  );
  console.log(salida.trim());
}
