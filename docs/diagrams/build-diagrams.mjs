// Builds the two Sales-facing flow diagrams for the Solaria Care prototype.
//
//   node docs/diagrams/build-diagrams.mjs        -> *.svg (editable, font embedded) + *.png (2x)
//
// Visual language: PureLogics design system. Token values are copied BY VALUE from
// quicktake-design-system/vendor/purelogics-ds/tokens/*.css, and the grammar (tabs that
// straddle cards, solid navy = main flow, green = output, nested-triangle corner motif)
// follows src/proposals/pl-structured in that repo. Sen (SIL OFL) is embedded so the
// SVG and PNG render identically offline.
//
// Content is derived from the Phase 1 prototype (Web Admin + Care Staff iPad). Future
// enhancements (e.g. PIN quick switch) and technical/security detail are deliberately
// left out: these are 20-second diagrams for a client audience.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const DIR = path.dirname(new URL(import.meta.url).pathname);

// ---- PureLogics tokens (vendor/purelogics-ds/tokens/colors.css, fonts.css) ----------------
const PL = {
  navy: '#002459', navyInk: '#01235A', blue: '#2843FF', blue2: '#3241EF',
  green: '#4ABA6A', mint: '#72F19E', mintSoft: '#AEF6D2',
  white: '#FFFFFF', gray500: '#939393', gray400: '#A0A8B5',
  surfaceMuted: '#F4F6FB', border: 'rgba(0,36,89,0.14)',
};
const FONT = "'Sen', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
const fontCss = `@font-face{font-family:'Sen';font-weight:400 800;font-style:normal;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(DIR, 'fonts/sen-400-800.woff2')).toString('base64')}) format('woff2');}`;

const W = 1920, H = 1080, M = 90;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tw = (s, size, em = 0.55) => String(s).length * size * em;
const wrap = (s, size, maxW) => {
  const out = []; let cur = '';
  for (const w of String(s).split(' ')) { const n = cur ? `${cur} ${w}` : w; if (cur && tw(n, size) > maxW) { out.push(cur); cur = w; } else cur = n; }
  if (cur) out.push(cur); return out;
};
const text = (x, y, s, { size = 20, weight = 400, fill = PL.navyInk, anchor = 'start', ls = 0 } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${ls ? ` letter-spacing="${ls}"` : ''}>${esc(s)}</text>`;
const rect = (x, y, w, h, { fill = PL.white, stroke = 'none', sw = 0, r = 12 } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const pill = (x, y, label, { bg = PL.navy, fg = PL.white, size = 15, h = 34, knockout = null } = {}) => {
  const w = tw(label, size, 0.62) + 32;
  return (knockout ? rect(x - 6, y - 3, w + 12, h + 6, { fill: knockout, r: h }) : '') +
    rect(x, y, w, h, { fill: bg, r: h / 2 }) + text(x + w / 2, y + h / 2 + size * 0.36, label, { size, weight: 700, fill: fg, anchor: 'middle', ls: 1.2 });
};
const arrow = (x1, y1, x2, y2, colour = PL.navy) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2 - 4}" y2="${y2}" stroke="${colour}" stroke-width="3.5" marker-end="url(#arw)"/>`;
const triangles = (x, y, w = 150, h = 84) => {
  const sw = w * 0.63, sh = h * 0.63, off = w * 0.16;
  return `<polygon points="${x + w / 2},${y} ${x + w},${y + h} ${x},${y + h}" fill="${PL.green}"/>` +
    `<polygon points="${x + w - off - sw / 2},${y + h - sh} ${x + w - off},${y + h} ${x + w - off - sw},${y + h}" fill="${PL.mintSoft}"/>`;
};
const header = (kicker, title, sub) =>
  text(M, 104, kicker.toUpperCase(), { size: 22, weight: 700, fill: PL.blue, ls: 3 }) +
  text(M, 170, title, { size: 56, weight: 800, fill: PL.navy }) +
  text(M, 220, sub, { size: 26, fill: PL.gray500 }) +
  triangles(W - M - 150, 70);
const footer = (s) =>
  `<line x1="${M}" y1="${H - 78}" x2="${W - M}" y2="${H - 78}" stroke="${PL.border}" stroke-width="1.5"/>` +
  text(M, H - 40, s, { size: 19, weight: 500, fill: PL.gray500 }) +
  text(W - M, H - 40, 'PureLogics · Solaria Care Phase 1', { size: 19, weight: 700, fill: PL.navy, anchor: 'end' });
const frame = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">` +
  `<style>${fontCss}</style>` +
  `<defs><marker id="arw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${PL.navy}"/></marker>` +
  `<marker id="arw-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${PL.green}"/></marker></defs>` +
  rect(0, 0, W, H, { fill: PL.white, r: 0 }) + body + '</svg>';

/** A step card with a tab straddling its top edge (PL grammar rule 1). */
function card(x, y, w, h, tab, title, lines, role = 'step') {
  const R = {
    step: { fill: PL.white, stroke: PL.border, sw: 2, fg: PL.navy, sub: PL.navyInk, tab: PL.navy, tabFg: PL.white },
    core: { fill: PL.navy, stroke: 'none', sw: 0, fg: PL.white, sub: 'rgba(255,255,255,0.9)', tab: PL.mint, tabFg: PL.navy },
    output: { fill: PL.green, stroke: 'none', sw: 0, fg: PL.white, sub: PL.white, tab: PL.navy, tabFg: PL.white },
    muted: { fill: PL.surfaceMuted, stroke: 'none', sw: 0, fg: PL.navy, sub: PL.navyInk, tab: PL.blue2, tabFg: PL.white },
  }[role];
  let s = rect(x, y, w, h, { fill: R.fill, stroke: R.stroke, sw: R.sw, r: 18 });
  if (role === 'step') s = `<g filter="url(#none)">${s}</g>`;
  s += pill(x + 26, y - 17, tab, { bg: R.tab, fg: R.tabFg, knockout: PL.white });
  let ty = y + 74;
  for (const l of wrap(title, 32, w - 52)) { s += text(x + 26, ty, l, { size: 32, weight: 800, fill: R.fg }); ty += 40; }
  ty += 10;
  for (const line of lines) {
    const bullet = lines.length > 1;
    const parts = wrap(line, 21, w - 52 - (bullet ? 22 : 0));
    parts.forEach((p, i) => {
      if (bullet && i === 0) s += `<circle cx="${x + 32}" cy="${ty - 7}" r="4.5" fill="${role === 'step' || role === 'muted' ? PL.green : PL.mint}"/>`;
      s += text(x + 26 + (bullet ? 22 : 0), ty, p, { size: 21, fill: R.sub });
      ty += 30;
    });
    ty += 8;
  }
  return s;
}

// ------------------------------------------------------------------------------------------
// 1. Care Staff · iPad
// ------------------------------------------------------------------------------------------
function careDiagram() {
  const y = 340, h = 390, gap = 48, docW = 420;
  const small = (W - 2 * M - docW - 5 * gap) / 5; // five regular steps
  const steps = [
    { tab: 'STEP 1', title: 'Sign in', lines: ['With your own account'] },
    { tab: 'STEP 2', title: 'Clients', lines: ['See your care area and what is due'] },
    { tab: 'STEP 3', title: "Today's care", lines: ["Open a client: instructions and today's schedule"] },
    { tab: 'ALL DAY', title: 'Add documentation', core: true },
    { tab: 'END OF DAY', title: 'Review & complete', lines: ["Check the day's record and sign off"], role: 'output' },
    { tab: 'ANYTIME', title: 'Records', lines: ['Find and print past days'], role: 'muted' },
  ];
  let x = M, body = '', centres = [];
  steps.forEach((st, i) => {
    const w = st.core ? docW : small;
    if (st.core) {
      body += card(x, y, w, h, st.tab, st.title, [], 'core');
      const chips = ['Care activity', 'Vitals', 'Intake & output', 'Assessment', 'Medication', 'Tube / trach care'];
      const cw = (w - 52 - 14) / 2;
      chips.forEach((c, k) => {
        const cx = x + 26 + (k % 2) * (cw + 14), cy = y + 124 + Math.floor(k / 2) * 66;
        body += rect(cx, cy, cw, 52, { fill: 'rgba(255,255,255,0.12)', r: 26 }) +
          text(cx + cw / 2, cy + 33, c, { size: 20, weight: 700, fill: PL.white, anchor: 'middle' });
      });
      body += text(x + 26, y + h - 42, 'Each entry is saved with', { size: 20, fill: 'rgba(255,255,255,0.9)' }) +
        text(x + 26, y + h - 14 - 0, 'your name and the time', { size: 20, fill: 'rgba(255,255,255,0.9)' });
      // "repeat all day" loop above the core card
      const lx1 = x + 90, lx2 = x + w - 90, ly = y - 52;
      body += `<path d="M ${lx2} ${y - 22} C ${lx2} ${ly - 46}, ${lx1} ${ly - 46}, ${lx1} ${y - 26}" fill="none" stroke="${PL.green}" stroke-width="3.5" marker-end="url(#arw-green)"/>` +
        text(x + w / 2, ly - 44, 'Repeat through the day · every staff member adds their own', { size: 20, weight: 700, fill: PL.green, anchor: 'middle' });
    } else {
      body += card(x, y, w, h, st.tab, st.title, st.lines, st.role ?? 'step');
    }
    centres.push([x, x + w]);
    x += w + gap;
  });
  const ay = y + h / 2;
  for (let i = 0; i < 4; i++) body += arrow(centres[i][1] + 8, ay, centres[i + 1][0] - 8, ay);
  // Records is reached from navigation at any time, not after sign-off: no arrow into it.
  // Log out marker under step 5
  const lo = centres[4];
  body += pill(lo[0] + 26, y + h + 34, 'THEN LOG OUT', { bg: PL.surfaceMuted, fg: PL.navy });
  // shared record band
  const by = y + h + 110;
  body += rect(M, by, W - 2 * M, 96, { fill: PL.navy, r: 18 }) +
    text(M + 40, by + 60, "One shared daily record per client", { size: 30, weight: 800, fill: PL.white }) +
    text(M + 40 + tw('One shared daily record per client', 30, 0.56) + 40, by + 60, 'Everyone sees what has already been done today, and who did it.', { size: 24, fill: PL.mintSoft });
  return frame(
    header('Solaria Care · Care Staff · iPad', 'What Care Staff do each day', 'Day-to-day care documentation on a shared iPad') +
    body + footer('Matches the prototype: Clients → client → Add documentation → Review & complete · Records'));
}

// ------------------------------------------------------------------------------------------
// 2. Administrative User · Web Admin
// ------------------------------------------------------------------------------------------
function adminDiagram() {
  const y = 400, h = 330, gap = 58;
  const w = (W - 2 * M - 3 * gap) / 4;
  const mods = [
    { tab: 'SET UP 1', title: 'Clients', lines: ['Add or update a client', 'Name, date of birth, height, weight', 'Care area and authorization dates'] },
    { tab: 'SET UP 2', title: 'Care setup', lines: ['Care instructions and daily schedule', 'Medications: dose, route, times', 'Feeding-tube / trach details'] },
    { tab: 'SET UP 3', title: 'Staff & access', lines: ['Invite staff', 'Assign role and care areas', 'Deactivate when needed'] },
    { tab: 'ANYTIME', title: 'Audit trail', lines: ['See who did what, and when', 'Filter by person, client or type'], role: 'muted' },
  ];
  let body = '';
  mods.forEach((m, i) => {
    const x = M + i * (w + gap);
    body += card(x, y, w, h, m.tab, m.title, m.lines, m.role ?? 'step');
    if (i < 2) body += arrow(x + w + 8, y + h / 2, x + w + gap - 8, y + h / 2);
  });
  // outcome: set-up flows to the iPad
  const by = y + h + 70;
  const setupRight = M + 3 * w + 2 * gap;
  body += `<path d="M ${M + w / 2} ${y + h + 2} V ${by - 6}" stroke="${PL.green}" stroke-width="3.5" marker-end="url(#arw-green)"/>` +
    `<path d="M ${M + w + gap + w / 2} ${y + h + 2} V ${by - 6}" stroke="${PL.green}" stroke-width="3.5" marker-end="url(#arw-green)"/>` +
    `<path d="M ${M + 2 * (w + gap) + w / 2} ${y + h + 2} V ${by - 6}" stroke="${PL.green}" stroke-width="3.5" marker-end="url(#arw-green)"/>`;
  body += rect(M, by, setupRight - M, 110, { fill: PL.green, r: 18 }) +
    text(M + 40, by + 50, 'Ready on the Care Staff iPad', { size: 30, weight: 800, fill: PL.white }) +
    text(M + 40, by + 86, "The right clients for each person, today's care and medications", { size: 23, fill: PL.white });
  return frame(
    header('Solaria Care · Administrative User · Web Admin', 'What the administrator sets up', 'Configuration and oversight from a desktop browser') +
    body + footer('Matches the prototype: Clients · Care Instructions & Schedule · Staff · Audit Trail'));
}

// ------------------------------------------------------------------------------------------
const out = { 'care-staff-ipad-flow': careDiagram(), 'admin-web-flow': adminDiagram() };
for (const [name, svg] of Object.entries(out)) fs.writeFileSync(path.join(DIR, `${name}.svg`), svg);

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  ({ chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright'));
}
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
for (const name of Object.keys(out)) {
  await page.setContent(`<html><body style="margin:0">${fs.readFileSync(path.join(DIR, `${name}.svg`), 'utf8')}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(DIR, `${name}.png`), clip: { x: 0, y: 0, width: W, height: H } });
  console.log('wrote', `${name}.svg`, `${name}.png`);
}
await browser.close();
