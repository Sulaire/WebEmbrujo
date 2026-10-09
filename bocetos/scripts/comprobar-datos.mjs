// Comprueba que cada copia a mano de los datos de contacto en los bocetos
// dice lo mismo que datos.json. Existe porque la misma regla escrita en
// varios sitios acaba desincronizándose: un teléfono cambiado en tres de
// los cuatro sitios no da ningún error, solo llamadas a un número viejo.
//
//   node scripts/comprobar-datos.mjs [ficheros.html...]   (por defecto, 18 y 19)
//
// Sale con error si algo no cuadra, y dice qué y dónde.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const datos = JSON.parse(readFileSync(join(RAIZ, 'datos.json'), 'utf8'));
const locales = Object.entries(datos.locales);
const porTel = new Map(locales.map(([id, l]) => [l.telefono.tel, { id, ...l }]));
const porVer = new Map(locales.map(([id, l]) => [l.telefono.ver, { id, ...l }]));

const args = process.argv.slice(2);
const ficheros = (args.length ? args : ['18-el-embrujo.html', '19-el-embrujo.html'])
  .map((f) => (f.includes('/') ? f : join(RAIZ, f))).filter((f) => existsSync(f));

const sinEtiquetas = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;| /g, ' ').replace(/\s+/g, ' ');
let fallos = 0;
const mal = (f, m) => { fallos++; console.log(`FALLO ${basename(f)}: ${m}`); };

for (const f of ficheros) {
  const html = readFileSync(f, 'utf8');
  let enlaces = 0;
  // 1) cada enlace tel: es de un local conocido y, si enseña un número, es el suyo
  for (const [, tel, dentro] of html.matchAll(/<a\b[^>]*href="tel:([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    enlaces++;
    const local = porTel.get(tel);
    if (!local) { mal(f, `enlace a un teléfono que no está en datos.json: tel:${tel}`); continue; }
    const visto = sinEtiquetas(dentro).match(/\b6\d{2} \d{2} \d{2} \d{2}\b/);
    if (visto && visto[0] !== local.telefono.ver) mal(f, `tel:${tel} (${local.nombre}) enseña ${visto[0]}`);
  }
  // 2) todo número de teléfono escrito en la página es uno de los conocidos
  const texto = sinEtiquetas(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ''));
  for (const [n] of texto.matchAll(/\b6\d{2} \d{2} \d{2} \d{2}\b/g)) if (!porVer.has(n)) mal(f, `número desconocido en el texto: ${n}`);
  // 3) los dos locales tienen al menos un enlace para llamar, y los mapas externos son los de datos.json
  for (const [, l] of locales) {
    if (!html.includes(`href="tel:${l.telefono.tel}"`)) mal(f, `no hay ningún enlace para llamar a ${l.nombre}`);
    if (!html.includes(l.mapa.replace(/&/g, '&amp;')) && !html.includes(l.mapa)) mal(f, `falta el enlace a Google Maps de ${l.nombre} (o es distinto)`);
  }
  // 4) Instagram
  for (const [, cuenta] of html.matchAll(/instagram\.com\/([A-Za-z0-9_.]+)/g)) if (cuenta !== datos.instagram) mal(f, `Instagram distinto: ${cuenta}`);
  console.log(`${basename(f)}: ${enlaces} enlaces para llamar revisados`);
}
if (!ficheros.length) { console.log('No hay ficheros que comprobar'); process.exit(1); }
console.log(fallos ? `\n${fallos} FALLOS` : '\nTodo cuadra con datos.json');
process.exit(fallos ? 1 : 0);
