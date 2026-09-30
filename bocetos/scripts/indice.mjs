// Junta los bocetos en una página índice, cada uno con su nota al lado.
//
//   node scripts/indice.mjs            escribe bocetos/index.html, que enlaza
//                                      a los ficheros (para abrir desde la carpeta)
//   node scripts/indice.mjs --suelto R escribe R: un único HTML con todo dentro,
//                                      fuentes incluidas, para mandarlo o verlo
//                                      en el móvil sin la carpeta al lado
//
// Las notas salen de notas/*.json: la nota vive junto al boceto, no copiada aquí.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--suelto');
const SUELTO = i > -1 ? process.argv[i + 1] : null;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Cada regla @font-face de fuentes.css, con su familia, para incluir en cada
// boceto solo las que usa.
const css = await readFile(join(RAIZ, 'fuentes/fuentes.css'), 'utf8');
const reglas = [...css.matchAll(/@font-face \{[^}]+\}/g)].map(([r]) => ({
  familia: r.match(/font-family: '([^']+)'/)[1],
  fichero: r.match(/url\(([^)]+)\)/)[1],
  regla: r,
}));

async function fuentesEnLinea(html) {
  let bloque = '';
  for (const { familia, fichero, regla } of reglas) {
    if (!html.includes(familia)) continue;
    const b64 = (await readFile(join(RAIZ, 'fuentes', fichero))).toString('base64');
    bloque += regla.replace(`url(${fichero})`, `url(data:font/woff2;base64,${b64})`) + '\n';
  }
  return html.replace(/<link[^>]+href="fuentes\/fuentes\.css"[^>]*>/, `<style>${bloque}</style>`);
}

const notas = [];
for (const f of (await readdir(join(RAIZ, 'notas'))).filter((f) => f.endsWith('.json')).sort()) {
  notas.push(JSON.parse(await readFile(join(RAIZ, 'notas', f), 'utf8')));
}
notas.sort((a, b) => a.n - b.n);

async function marco(nota, ancho, alto, etiqueta) {
  const atributos = `title="${esc(nota.nombre)}, ${etiqueta}" loading="lazy" width="${ancho}" height="${alto}"`;
  if (!SUELTO) return `<iframe src="${esc(nota.fichero)}" ${atributos}></iframe>`;
  const html = await fuentesEnLinea(await readFile(join(RAIZ, nota.fichero), 'utf8'));
  return `<iframe srcdoc="${esc(html)}" ${atributos}></iframe>`;
}

let tarjetas = '';
for (const nota of notas) {
  const campos = [
    ['Tipografías', nota.tipografias], ['Paleta', nota.paleta], ['Por qué encaja', nota.porque],
    ['Qué se movería', nota.semoveria], ['El otro tema', nota.otroTema], ['Riesgo', nota.riesgo],
  ].map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
  tarjetas += `
<section class="boceto" id="b${nota.n}" aria-labelledby="t${nota.n}">
  <header>
    <span class="num">${String(nota.n).padStart(2, '0')}</span>
    <div><h2 id="t${nota.n}">${esc(nota.nombre)}${nota.arriesgado ? ' <span class="chip">el arriesgado</span>' : ''}</h2>
    <p class="idea">${esc(nota.idea)}</p></div>
    ${SUELTO ? '' : `<a class="abrir" href="${esc(nota.fichero)}">Abrir entero</a>`}
  </header>
  <div class="vistas">
    <figure class="movil">${await marco(nota, 390, 780, 'vista de móvil')}<figcaption>Móvil, 390 px</figcaption></figure>
    <figure class="escritorio"><div class="escala">${await marco(nota, 1280, 800, 'vista de escritorio')}</div><figcaption>Escritorio, 1280 px a escala</figcaption></figure>
  </div>
  <dl class="nota">${campos}</dl>
</section>`;
}

const indice = notas.map((n) => `<li><a href="#b${n.n}">${String(n.n).padStart(2, '0')} ${esc(n.nombre)}</a></li>`).join('');

const pagina = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Embrujo: bocetos de estética</title>
<style>
:root {
  --fondo: #f3f1ec; --carta: #ffffff; --tinta: #1d1c1a; --apagado: #5a5750;
  --filete: #dcd8cf; --acento: #1f4fd1; --chip: #fff0a8;
  --sistema: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root { --fondo: #151515; --carta: #1e1e1e; --tinta: #eeece6; --apagado: #a9a59c; --filete: #34332f; --acento: #7fa0ff; --chip: #5b4d00; }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--fondo); color: var(--tinta); font: 16px/1.55 var(--sistema); }
a { color: var(--acento); }
:focus-visible { outline: 3px solid var(--acento); outline-offset: 3px; }
.saltar { position: absolute; left: -999px; } .saltar:focus { left: 16px; top: 16px; background: var(--carta); padding: 8px 12px; z-index: 2; }
.cab { max-width: 1240px; margin: 0 auto; padding: clamp(24px, 5vw, 56px) 16px 8px; }
.cab h1 { font-size: clamp(28px, 5vw, 46px); line-height: 1.05; margin: 0 0 10px; letter-spacing: -0.02em; }
.cab p { color: var(--apagado); max-width: 70ch; margin: 0 0 12px; }
.cab ol { list-style: none; padding: 0; margin: 18px 0 0; display: flex; flex-wrap: wrap; gap: 8px; }
.cab ol a { display: inline-block; padding: 8px 14px; border: 1px solid var(--filete); border-radius: 999px; background: var(--carta); color: var(--tinta); text-decoration: none; min-height: 44px; line-height: 26px; }
main { max-width: 1240px; margin: 0 auto; padding: 16px; display: grid; gap: 28px; }
.boceto { background: var(--carta); border: 1px solid var(--filete); border-radius: 14px; padding: clamp(16px, 3vw, 28px); min-width: 0; scroll-margin-top: 12px; }
.boceto > header { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 14px; align-items: start; margin-bottom: 18px; }
.num { font: 700 28px/1 var(--sistema); color: var(--apagado); font-variant-numeric: tabular-nums; }
.boceto h2 { margin: 0 0 4px; font-size: clamp(21px, 3vw, 27px); }
.idea { margin: 0; color: var(--apagado); }
.chip { font-size: 13px; font-weight: 600; background: var(--chip); padding: 2px 8px; border-radius: 999px; vertical-align: middle; }
.abrir { white-space: nowrap; padding: 10px 16px; border-radius: 999px; background: var(--tinta); color: var(--fondo); text-decoration: none; font-weight: 600; }
.vistas { display: grid; grid-template-columns: 390px minmax(0, 1fr); gap: 20px; align-items: start; }
figure { margin: 0; min-width: 0; }
figcaption { font-size: 13px; color: var(--apagado); margin-top: 6px; }
iframe { display: block; border: 1px solid var(--filete); border-radius: 10px; background: #fff; }
.movil iframe { width: 390px; max-width: 100%; height: 780px; }
.escala { width: 100%; aspect-ratio: 1280 / 800; overflow: hidden; border-radius: 10px; position: relative; container-type: inline-size; }
.escala iframe { width: 1280px; height: 800px; transform-origin: 0 0; transform: scale(calc(100cqw / 1280px)); position: absolute; top: 0; left: 0; }
@supports not (width: 1cqw) { .escala iframe { transform: scale(0.6); } }
.nota { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 6px 16px; margin: 20px 0 0; padding-top: 16px; border-top: 1px solid var(--filete); }
.nota dt { font-weight: 600; } .nota dd { margin: 0; color: var(--apagado); overflow-wrap: anywhere; }
@media (max-width: 900px) {
  .vistas { grid-template-columns: minmax(0, 1fr); }
  .escritorio { display: none; }
  .movil iframe { width: 100%; }
  .boceto > header { grid-template-columns: auto minmax(0, 1fr); }
  .abrir { grid-column: 1 / -1; justify-self: start; }
  .nota { grid-template-columns: minmax(0, 1fr); } .nota dd { margin-bottom: 8px; }
}
</style>
</head>
<body>
<a class="saltar" href="#contenido">Saltar a los bocetos</a>
<header class="cab">
  <h1>Embrujo: ocho maneras de verlo</h1>
  <p>Bocetos de estética para la web de los dos Embrujos de Guardo, el del río y el de la plaza. No son la web: son para elegir mirando y no imaginando. Todos usan los datos reales que hay hasta hoy, y lo que está en amarillo está sin confirmar.</p>
  <p>Cada uno trae su nota: tipografías, paleta, por qué encaja y qué se movería. Los datos y sus fuentes están en <code>bocetos/DATOS.md</code>.</p>
  <ol aria-label="Bocetos">${indice}</ol>
</header>
<main id="contenido" tabindex="-1">${tarjetas}
</main>
</body>
</html>
`;

const destino = SUELTO ?? join(RAIZ, 'index.html');
await writeFile(destino, pagina);
console.log(`${notas.length} bocetos -> ${destino} (${Math.round(pagina.length / 1024)} KB)`);
