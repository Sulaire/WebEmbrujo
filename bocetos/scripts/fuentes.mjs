// Descarga las tipografías de los bocetos a bocetos/fuentes/ (solo el
// subconjunto latin, que cubre el castellano) y escribe fuentes.css con
// rutas locales. Se ejecuta una vez; la página nunca le pide nada a Google.
import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'fuentes');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

const FAMILIAS = [
  'Bungee', 'Figtree:wght@400;700',
  'Fraunces:ital,wght@0,600;1,600', 'Barlow+Condensed:wght@500;700',
  'Alfa+Slab+One', 'Courier+Prime:wght@400;700',
  'Caveat:wght@600', 'Oswald:wght@500;700',
  'Big+Shoulders+Display:wght@800', 'Barlow:wght@400;600',
  'Anton', 'Bitter:wght@400;700',
  'IM+Fell+English+SC', 'Spectral:ital,wght@0,400;1,400', 'Dancing+Script:wght@600',
  'Overpass:wght@400;800',
  'Rye', 'Nunito:wght@400;800',
  'Creepster', 'Archivo+Narrow:wght@400;700', 'VT323',
  'Cinzel+Decorative:wght@700', 'Cormorant+Garamond:ital,wght@0,500;1,500',
];

await mkdir(DESTINO, { recursive: true });
let css = '/* Generado por scripts/fuentes.mjs. No se toca a mano. */\n';
const hechas = new Map();
for (const f of FAMILIAS) {
  const r = await fetch(`https://fonts.googleapis.com/css2?family=${f}&display=swap`, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${f}: ${r.status}`);
  const texto = await r.text();
  // Cada bloque va precedido de su comentario de subconjunto; solo latin.
  for (const [, bloque] of texto.matchAll(/\/\* latin \*\/\s*(@font-face \{[^}]+\})/g)) {
    const url = bloque.match(/url\((https:[^)]+)\)/)[1];
    let nombre = hechas.get(url);
    if (!nombre) {
      const familia = bloque.match(/font-family: '([^']+)'/)[1].toLowerCase().replace(/\s+/g, '-');
      nombre = `${familia}-${createHash('sha1').update(url).digest('hex').slice(0, 6)}.woff2`;
      const bin = Buffer.from(await (await fetch(url)).arrayBuffer());
      await writeFile(join(DESTINO, nombre), bin);
      hechas.set(url, nombre);
    }
    css += bloque.replace(url, nombre).replace(/\s*unicode-range:[^;]+;/, '') + '\n';
  }
}
await writeFile(join(DESTINO, 'fuentes.css'), css);
console.log(`${hechas.size} ficheros, ${css.match(/@font-face/g).length} reglas`);
