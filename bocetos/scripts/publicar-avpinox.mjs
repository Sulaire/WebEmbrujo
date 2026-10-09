// Genera la copia de los bocetos que se enseña en avpinox.es/estudio/embrujo/
// a partir de este repo, en vez de copiarla a mano. Existe porque la copia a
// mano ya se desincronizó una vez: tenía el cuervo nuevo pero no el arreglo
// de la O apagada.
//
//   node scripts/publicar-avpinox.mjs [--avpinox RUTA] [--comprobar] [ficheros...]
//
// RUTA es el clon de Sulaire/WebAvpInox (por defecto ../../webavpinox desde
// este repo). Sin ficheros, publica los que ya hay publicados allí.
// Con --comprobar no escribe nada: sale con error si lo publicado no es lo
// que se generaría hoy, y dice qué fichero se ha quedado atrás.
//
// Único cambio respecto al boceto: en avpinox van con "noindex, nofollow",
// porque es una URL pública que no debe indexarse ni repartir enlaces.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const i = args.indexOf('--avpinox');
const AVPINOX = i > -1 ? args.splice(i, 2)[1] : join(RAIZ, '../../webavpinox');
const comprobar = args.includes('--comprobar');
const pedidos = args.filter((a) => !a.startsWith('--'));
const DESTINO = join(AVPINOX, 'public/estudio/embrujo');
if (!existsSync(DESTINO)) { console.error(`No encuentro ${DESTINO}: pasa --avpinox con la ruta del clon de WebAvpInox`); process.exit(1); }

const ROBOTS = '<meta name="robots" content="noindex">';
function generar(html, f) {
  if (!html.includes(ROBOTS)) throw new Error(`${f} no tiene ${ROBOTS}: revisa antes de publicar`);
  return html.replace(ROBOTS, '<meta name="robots" content="noindex, nofollow">');
}

// Por defecto, los bocetos numerados que ya están publicados (index.html y las
// fuentes tienen su propia versión allí y no se tocan).
const ficheros = pedidos.length ? pedidos : readdirSync(DESTINO).filter((f) => /^\d\d-.*\.html$/.test(f));
let atrasados = 0;
for (const f of ficheros) {
  const origen = join(RAIZ, f);
  if (!existsSync(origen)) { console.log(`${f}: no existe en el repo, se deja como está`); continue; }
  const nuevo = generar(readFileSync(origen, 'utf8'), f);
  const ruta = join(DESTINO, f);
  const viejo = existsSync(ruta) ? readFileSync(ruta, 'utf8') : null;
  if (viejo === nuevo) { console.log(`${f}: al día`); continue; }
  if (comprobar) { atrasados++; console.log(`${f}: ATRASADO (lo publicado no es lo del repo)`); continue; }
  writeFileSync(ruta, nuevo);
  console.log(`${f}: ${viejo === null ? 'publicado por primera vez' : 'actualizado'}`);
}
if (comprobar && atrasados) { console.log(`\n${atrasados} fichero(s) atrasado(s)`); process.exit(1); }
