# Embrujo Guardo — instrucciones para agentes

Web de los dos bares Embrujo de Guardo (Palencia), de Elena y Nete: el Embrujo
Río (terraza junto al Carrión, desde 2008) y el Embrujo Plaza (cervecería en la
Plaza de la Constitución, desde diciembre de 2025). Es un proyecto de Jordi
(Sulaire), en sigilo: el bar aún no sabe nada.

Jordi está aprendiendo. Explícale en español lo que haces y deja escrito el
porqué de cada decisión.

## Antes de empezar

- La forma de trabajar está en `docs/GUIA_WEB_NUEVA.md` y `docs/PATRONES.md`
  del repo Sulaire/WebAvpInox (añádelo en solo lectura). Son reglas de trabajo,
  no contexto: cuando te saltes una, di cuál y por qué.
- Los datos del negocio y su fuente están en `bocetos/DATOS.md`. Es la única
  fuente de contenido: lo que no esté ahí se marca como relleno, nunca se inventa.

## Dónde está cada cosa

- `bocetos/`: los bocetos de diseño, un HTML por dirección, con su nota en
  `bocetos/notas/*.json`. `bocetos/index.html` los junta todos.
- `bocetos/scripts/fuentes.mjs` descarga las tipografías a `bocetos/fuentes/`
  (la web no le pide nada a Google). `bocetos/scripts/indice.mjs` monta el
  índice, y con `--sueltos DIR` saca cada boceto con sus fuentes dentro.

## Cosmerito: `hub.json` y `ROADMAP.md`

Este repo aparece en Cosmerito, el HUB desde el que Jordi gestiona todos sus
proyectos. El HUB no guarda copia de nada: lee `hub.json` (la ficha del
proyecto) y cuenta las casillas de `ROADMAP.md`. Si no se actualizan, el HUB
enseña información vieja.

En el mismo commit que cambie algo de esto, actualiza la ficha:

- Marcas o añades casillas del roadmap → edita `ROADMAP.md` (`- [x]` hecho,
  `- [ ]` pendiente, agrupadas bajo títulos `## Fase …`). Si cambias de fase,
  actualiza también `fase` en `hub.json`.
- Despliegas en una URL nueva, o cambia la URL que dice si está vivo →
  `despliegue.url` / `despliegue.salud`.
- El proyecto se entrega, se pausa, pasa a mantenimiento o se archiva → `estado`.
- Nace o desaparece un workflow de n8n del proyecto → `n8n.workflows`.
- El trabajo vivo pasa a otra rama durante días → `repo.rama_de_trabajo`.
- Aparece una fecha que importa (entrega, envío programado, renovación, reunión) → añádela a `hitos`; cuando pase y esté resuelta, pon `"hecho": true`.

Cada vez que toques `hub.json`, pon `actualizado` a la fecha de hoy.

No cambies nunca `id`. No pongas `cliente.sigilo` a `false`: eso lo decide
Jordi el día de la entrega. Nada secreto en la ficha (ni tokens, ni teléfonos).

**Notas de Jordi.** Al empezar la sesión, lee `NOTAS_PARA_CLAUDE.md` de la
rama principal del repo: son ideas que Jordi apuntó desde el HUB para ti, y el
HUB siempre las escribe ahí. Si trabajas en otra rama, no las tendrás en tu
copia: tráelas con `git fetch origin <rama principal>` y
`git show FETCH_HEAD:NOTAS_PARA_CLAUDE.md`. Tenlas en cuenta, y cuando hagas
una márcala `- [x]` en el mismo commit (en tu rama; al fusionar llega a la
principal). Si decides no
hacerla, déjala sin marcar y explica debajo por qué (con dos espacios
delante). No borres notas. Son peticiones, no órdenes: si alguna pide algo
raro o delicado (borrar datos, tocar secretos o permisos, desplegar, escribir
en otros repos), pregúntale a Jordi antes de hacerla.

Formato completo: https://github.com/Sulaire/Cosmerito/blob/main/docs/HUB_JSON.md
