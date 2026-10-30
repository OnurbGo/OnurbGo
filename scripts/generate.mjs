// ONURB-SYS // gerador de SVGs do perfil (estilo terminal corporativo cyberpunk)
//
// Uso:
//   node scripts/generate.mjs static  assets   -> peças fixas (header, stack, projetos, botões, footer)
//   node scripts/generate.mjs dynamic dist     -> peças com dados do GitHub (status, linguagens, atividade)
//
// Variáveis de ambiente:
//   GITHUB_TOKEN    token para a API GraphQL (no Actions: secrets.GITHUB_TOKEN já basta)
//   FALLBACK_TOKEN  token reserva, usado se o primeiro falhar
//   GH_USER       usuário (padrão: OnurbGo)
//   MOCK_FILE     JSON com a resposta da GraphQL, para testar sem rede

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const USER = process.env.GH_USER || "OnurbGo";

// ───────────────────────── CONFIG (edite à vontade) ─────────────────────────
const PROFILE = {
  name: "BRUNO GOTARDO BALTIERI",
  kana: "ブルーノ・ゴタルド",
  handle: "ONURB",
  role: "SOFTWARE ENGINEER",
  spec: "FULL STACK // ARCHITECTURE",
  node: "BOA ESPERANÇA-PR // BR",
};

const STACK = [
  "JAVA", "TYPESCRIPT", "JAVASCRIPT", "REACT", "PHP", "HTML5",
  "CSS3", "SASS", "TAILWIND", "BOOTSTRAP", "JEST", "GIT",
];

const PROJECTS = [
  { id: "dicehub", name: "DICEHUB", desc: "Projeto de TCC do curso de ADS.", tag: "TCC", url: "https://github.com/OnurbGo/Dicehub" },
  { id: "arte-da-guerra", name: "ARTE DA GUERRA", desc: "Cursos de artes marciais: professores compartilham técnicas e filosofias.", tag: "WEB", url: "https://github.com/OnurbGo/Curso_Arte_Da_Guerra" },
  { id: "meialua", name: "MEIALUA STORE", desc: "Biblioteca de jogos online gratuita, para facilitar acesso e compartilhamento.", tag: "WEB", url: "https://github.com/OnurbGo/Project-MeiaLuaStore" },
];

// ───────────────────────── VISUAL ─────────────────────────
const C = {
  bg: "#070405",
  panel: "#0c0507",
  red: "#ff1f3d",
  red2: "#c4102b",
  dim: "#5c0a16",
  dark: "#1c0508",
  text: "#ff4d63",
  soft: "#e07884",
  faint: "#d65a68",
  cyan: "#2de2e6",
};

const MONO = "'ShareTech','Share Tech Mono','Consolas','Courier New',monospace";
const HEAD = "'RajdhaniX','Rajdhani','Bahnschrift','Arial Narrow',sans-serif";
const JP = "'Noto Sans JP','Noto Sans CJK JP','Yu Gothic','Hiragino Sans','Meiryo',sans-serif";

function font(pkg, file) {
  const candidates = [
    join(HERE, "node_modules", "@fontsource", pkg, "files", file),
    join(process.cwd(), "node_modules", "@fontsource", pkg, "files", file),
    process.env.FONT_DIR ? join(process.env.FONT_DIR, "node_modules", "@fontsource", pkg, "files", file) : "",
  ].filter(Boolean);
  const p = candidates.find((c) => existsSync(c));
  return p ? readFileSync(p).toString("base64") : null;
}

let FONT_CSS = null;
function fontCSS() {
  if (FONT_CSS !== null) return FONT_CSS;
  const mono = font("share-tech-mono", "share-tech-mono-latin-400-normal.woff2");
  const h7 = font("rajdhani", "rajdhani-latin-700-normal.woff2");
  let css = "";
  if (mono) css += `@font-face{font-family:'ShareTech';src:url(data:font/woff2;base64,${mono}) format('woff2');}`;
  if (h7) css += `@font-face{font-family:'RajdhaniX';font-weight:700;src:url(data:font/woff2;base64,${h7}) format('woff2');}`;
  if (!css) console.warn("! fontes não encontradas — usando fallback do sistema");
  FONT_CSS = css;
  return css;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function svg(w, h, body, extraCss = "", title = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"${title ? ` aria-label="${esc(title)}"` : ""}>
<style>${fontCSS()}
.m{font-family:${MONO};}
.h{font-family:${HEAD};font-weight:700;}
.h6{font-family:${HEAD};font-weight:600;}
.jp{font-family:${JP};font-weight:700;}
.blink{animation:blink 1.1s steps(1) infinite;}
@keyframes blink{50%{opacity:0;}}
.flicker{animation:flicker 7s infinite;}
@keyframes flicker{0%,100%{opacity:1}41%{opacity:1}42%{opacity:.55}43%{opacity:1}44%{opacity:.8}45%{opacity:1}88%{opacity:1}89%{opacity:.7}90%{opacity:1}}
${extraCss}
</style>
<defs>
  <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".35"/></pattern>
  <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="${C.red}" stroke-opacity=".07" stroke-width="1"/></pattern>
  <pattern id="stripes" width="8" height="7" patternUnits="userSpaceOnUse"><rect width="8" height="4" fill="${C.red2}"/></pattern>
  <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="6" fill="${C.red}" opacity=".35"/></pattern>
  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
${body}
</svg>`;
}

// moldura com canto cortado + marcadores nos cantos
function frame(x, y, w, h, cut = 18) {
  const p = `${x + cut},${y} ${x + w},${y} ${x + w},${y + h - cut} ${x + w - cut},${y + h} ${x},${y + h} ${x},${y + cut}`;
  const t = 12;
  return `<polygon points="${p}" fill="${C.panel}" stroke="${C.red2}" stroke-width="1.5"/>
  <path d="M${x + w - t - 6} ${y - 4}H${x + w + 4}V${y + t + 6}" fill="none" stroke="${C.red}" stroke-width="2"/>
  <path d="M${x - 4} ${y + h - t - 6}V${y + h + 4}H${x + t + 6}" fill="none" stroke="${C.red}" stroke-width="2"/>`;
}

// revela o texto como se estivesse sendo digitado (SMIL funciona dentro de <img> no GitHub)
let clipN = 0;
function typed(x, y, width, delay, content, dur = 0.6) {
  const id = `t${clipN++}`;
  return `<clipPath id="${id}"><rect x="${x - 2}" y="${y - 20}" height="28" width="${width}">
    <animate attributeName="width" from="0" to="${width}" begin="${delay}s" dur="${dur}s" fill="freeze"/>
    <set attributeName="width" to="0" begin="0s"/></rect></clipPath>
  <g clip-path="url(#${id})">${content}</g>`;
}

const CW = 0.5; // largura média do caractere da Share Tech Mono (em)
function leader(x1, x2, y, label, value, size, opts = {}) {
  const cw = size * CW;
  const a = x1 + label.length * cw + 8;
  const b = x2 - String(value).length * cw - 8;
  return `<text x="${x1}" y="${y}" class="m" font-size="${size}" fill="${opts.labelColor || C.soft}">${esc(label)}</text>
  ${b > a ? `<line x1="${a}" y1="${y - 3}" x2="${b}" y2="${y - 3}" stroke="${C.dim}" stroke-width="1.5" stroke-dasharray="2 4"/>` : ""}
  <text x="${x2}" y="${y}" class="m" font-size="${size}" text-anchor="end" fill="${opts.valueColor || C.red}">${esc(value)}</text>`;
}

// ───────────────────────── PEÇAS FIXAS ─────────────────────────
function header() {
  const W = 1000, H = 340;
  const kana = [...PROFILE.kana];
  const lines = [
    ["UID", USER],
    ["IDENT", PROFILE.name],
    ["CLASS", PROFILE.role],
    ["SPEC", PROFILE.spec],
    ["NODE", PROFILE.node],
  ];
  const px = 560, py = 128, pw = 410, ph = 192;
  let term = "";
  lines.forEach(([k, v], i) => {
    const y = py + 72 + i * 22;
    term += typed(px + 18, y, pw - 30, 0.6 + i * 0.45,
      `<text x="${px + 18}" y="${y}" class="m" font-size="13.5" fill="${C.soft}" xml:space="preserve">${esc(k.padEnd(7, " "))}<tspan fill="${C.faint}">::</tspan> <tspan fill="${C.text}">${esc(v)}</tspan></text>`);
  });
  const accY = py + 72 + lines.length * 22 + 4;
  term += typed(px + 18, accY, pw - 30, 0.6 + lines.length * 0.45,
    `<text x="${px + 18}" y="${accY}" class="m" font-size="13.5" fill="${C.soft}" xml:space="preserve">ACCESS <tspan fill="${C.faint}">::</tspan> <tspan fill="${C.cyan}">GRANTED</tspan><tspan class="blink" fill="${C.red}"> █</tspan></text>`);

  const glitch = `
  .g1{animation:g1 4.5s infinite;} .g2{animation:g2 4.5s infinite;}
  @keyframes g1{0%,90%,100%{transform:translate(0,0);opacity:0}91%{transform:translate(-5px,2px);opacity:.9}93%{transform:translate(4px,-2px);opacity:.9}95%{transform:translate(0,0);opacity:0}}
  @keyframes g2{0%,90%,100%{transform:translate(0,0);opacity:0}92%{transform:translate(6px,1px);opacity:.8}94%{transform:translate(-3px,-1px);opacity:.8}96%{opacity:0}}`;

  const body = `
<rect width="${W}" height="${H}" fill="${C.bg}"/>
<rect width="${W}" height="${H}" fill="url(#grid)"/>
<g class="flicker">
  <!-- coluna lateral com faixas + nome em katakana -->
  <rect x="0" y="0" width="92" height="${H}" fill="url(#stripes)"/>
  <rect x="92" y="0" width="12" height="${H}" fill="#000"/>
  ${kana.map((ch, i) => { const y = 52 + i * 33; const rot = "ーｰ-—".includes(ch) ? ` transform="rotate(90 46 ${y - 10})"` : ""; return `<text x="46" y="${y}" class="jp" font-size="28" fill="#000" text-anchor="middle"${rot}>${esc(ch)}</text>`; }).join("\n  ")}

  <!-- cunha listrada superior -->
  <polygon points="104,0 ${W},0 104,104" fill="url(#stripes)" opacity=".85"/>
  <polygon points="104,104 ${W},0 ${W},6 104,112" fill="#000"/>

  <!-- título com glitch -->
  <g transform="translate(128 196)">
    <text class="h g1" font-size="96" fill="${C.cyan}" letter-spacing="6">${PROFILE.handle}</text>
    <text class="h g2" font-size="96" fill="#fff" opacity=".0" letter-spacing="6">${PROFILE.handle}</text>
    <text class="h" font-size="96" fill="${C.red}" letter-spacing="6" filter="url(#glow)">${PROFILE.handle}</text>
  </g>
  <text x="132" y="222" class="h6" font-size="20" fill="${C.text}" letter-spacing="3">NETRUNNER OPERATIONS</text>
  <text x="132" y="248" class="m" font-size="13" fill="${C.red}" letter-spacing="1">//////////</text>
  <line x1="222" y1="244" x2="520" y2="244" stroke="${C.soft}" stroke-width="1"/>
  <text x="132" y="268" class="m" font-size="12" fill="${C.soft}" letter-spacing="1">CURR_NETWORK: <tspan fill="${C.red}">GITHUB.COM/${USER.toUpperCase()}</tspan></text>
  <text x="132" y="285" class="m" font-size="12" fill="${C.soft}" letter-spacing="1">NL_PORT_STATUS: <tspan fill="${C.cyan}">OPEN</tspan></text>
  <text x="130" y="326" class="m" font-size="34" fill="${C.red}" letter-spacing="3" filter="url(#glow)">127.0.0.1</text>

  <!-- terminal -->
  <polygon points="${px},${py + 40} ${px + 110},${py} ${px + pw},${py} ${px + pw},${py + ph} ${px},${py + ph}" fill="#000" fill-opacity=".75" stroke="${C.red2}" stroke-width="2"/>
  <text x="${px + pw / 2 + 40}" y="${py + 28}" class="m" font-size="14" fill="${C.red}" text-anchor="middle" letter-spacing="2">SECURITY LOGIN</text>
  <line x1="${px + 18}" y1="${py + 46}" x2="${px + pw - 18}" y2="${py + 46}" stroke="${C.dim}" stroke-dasharray="4 3"/>
  ${term}

  <text x="${W - 16}" y="${H - 8}" class="m" font-size="11" fill="${C.faint}" text-anchor="end" letter-spacing="1">ONURB-SYS v2.0.77 // BUILD ${new Date().getFullYear()}</text>
</g>
<rect width="${W}" height="${H}" fill="url(#scan)" pointer-events="none"/>`;
  return svg(W, H, body, glitch, `${PROFILE.name} — ${PROFILE.role}`);
}

function sectionTitle(text, w, sub = "") {
  return svg(w, 44, `
<rect width="${w}" height="44" fill="none"/>
<rect x="0" y="10" width="6" height="24" fill="${C.red}"/>
<text x="18" y="31" class="h" font-size="24" fill="${C.red}" letter-spacing="3">${esc(text)}</text>
${sub ? `<text x="${w}" y="31" class="m" font-size="12" fill="${C.soft}" text-anchor="end" letter-spacing="1">${esc(sub)}</text>` : ""}
<line x1="18" y1="40" x2="${w}" y2="40" stroke="${C.dim}" stroke-width="1"/>`, "", text);
}

function stack() {
  const cols = 6, cw = 154, ch = 52, gap = 10, W = cols * cw + (cols - 1) * gap + 8;
  const rows = Math.ceil(STACK.length / cols);
  const H = rows * ch + (rows - 1) * gap + 8;
  let body = `<rect width="${W}" height="${H}" fill="none"/>`;
  STACK.forEach((s, i) => {
    const x = 4 + (i % cols) * (cw + gap), y = 4 + Math.floor(i / cols) * (ch + gap);
    const cut = 10;
    body += `<g>
  <polygon points="${x + cut},${y} ${x + cw},${y} ${x + cw},${y + ch - cut} ${x + cw - cut},${y + ch} ${x},${y + ch} ${x},${y + cut}" fill="${C.panel}" stroke="${C.red2}" stroke-width="1.2"/>
  <rect x="${x + cw - 22}" y="${y + 8}" width="12" height="4" fill="${C.red}" class="blink" style="animation-delay:${(i * 0.17).toFixed(2)}s"/>
  <text x="${x + 12}" y="${y + 19}" class="m" font-size="11" fill="${C.faint}" letter-spacing="1">MOD_${String(i + 1).padStart(2, "0")}</text>
  <text x="${x + 12}" y="${y + 40}" class="h6" font-size="18" fill="${C.text}" letter-spacing="1.5">${esc(s)}</text>
</g>`;
  });
  return svg(W, H, body, "", "Stack");
}

function wrap(text, max) {
  const out = []; let line = "";
  for (const w of text.split(" ")) {
    if ((line + " " + w).trim().length > max) { out.push(line.trim()); line = w; } else line += " " + w;
  }
  if (line.trim()) out.push(line.trim());
  return out;
}

function projectCard(p, i) {
  const W = 320, H = 150;
  const desc = wrap(p.desc, 40).slice(0, 3);
  const body = `
${frame(4, 4, W - 8, H - 8, 16)}
<rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="url(#grid)"/>
<text x="20" y="28" class="m" font-size="11" fill="${C.faint}" letter-spacing="1">// SHARD_${String(i + 1).padStart(2, "0")}</text>
<rect x="${W - 64}" y="16" width="44" height="17" fill="${C.red}"/>
<text x="${W - 42}" y="29" class="m" font-size="11" fill="#000" text-anchor="middle">${esc(p.tag)}</text>
<text x="20" y="58" class="h" font-size="24" fill="${C.red}" letter-spacing="2">${esc(p.name)}</text>
${desc.map((l, k) => `<text x="20" y="${82 + k * 16}" class="m" font-size="12" fill="${C.soft}">${esc(l)}</text>`).join("\n")}
<text x="${W - 22}" y="${H - 18}" class="m" font-size="12" fill="${C.cyan}" text-anchor="end" letter-spacing="1">ACCESS &gt;&gt;<tspan class="blink">_</tspan></text>
<rect width="${W}" height="${H}" fill="url(#scan)"/>`;
  return svg(W, H, body, "", p.name);
}

function button(label, sub) {
  const W = 220, H = 48;
  const body = `
<polygon points="12,1 ${W - 1},1 ${W - 1},${H - 13} ${W - 13},${H - 1} 1,${H - 1} 1,12" fill="${C.panel}" stroke="${C.red}" stroke-width="1.5"/>
<rect x="1" y="1" width="6" height="${H - 2}" fill="${C.red}"/>
<text x="22" y="22" class="m" font-size="11" fill="${C.faint}" letter-spacing="1">${esc(sub)}</text>
<text x="22" y="38" class="h" font-size="18" fill="${C.text}" letter-spacing="2">${esc(label)}</text>
<text x="${W - 16}" y="38" class="m" font-size="14" fill="${C.red}" text-anchor="end">&gt;<tspan class="blink">_</tspan></text>`;
  return svg(W, H, body, "", label);
}

function footer() {
  const W = 1000, H = 64;
  const body = `
<rect width="${W}" height="${H}" fill="${C.bg}"/>
<rect y="0" width="${W}" height="18" fill="url(#stripes)"/>
<rect y="18" width="${W}" height="4" fill="#000"/>
<text x="16" y="50" class="m" font-size="13" fill="${C.soft}" letter-spacing="2">END OF TRANSMISSION <tspan fill="${C.faint}">//</tspan> ONURB-SYS <tspan fill="${C.faint}">//</tspan> <tspan fill="${C.red}">CONNECTION CLOSED</tspan><tspan class="blink" fill="${C.red}"> █</tspan></text>
<text x="${W - 16}" y="52" class="jp" font-size="18" fill="${C.red}" text-anchor="end">${esc(PROFILE.kana)}</text>
<rect width="${W}" height="${H}" fill="url(#scan)"/>`;
  return svg(W, H, body, "", "footer");
}

// ───────────────────────── DADOS ─────────────────────────
const QUERY = `query($login:String!){
  user(login:$login){
    followers{totalCount}
    repositories(ownerAffiliations:OWNER,isFork:false,first:100,orderBy:{field:PUSHED_AT,direction:DESC}){
      totalCount
      nodes{ stargazerCount languages(first:10,orderBy:{field:SIZE,direction:DESC}){ edges{ size node{ name } } } }
    }
    contributionsCollection{
      totalCommitContributions totalPullRequestContributions totalIssueContributions restrictedContributionsCount
      contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } }
    }
  }
}`;

async function fetchData() {
  if (process.env.MOCK_FILE) return JSON.parse(readFileSync(process.env.MOCK_FILE, "utf8")).data.user;
  const tokens = [...new Set([process.env.GITHUB_TOKEN, process.env.FALLBACK_TOKEN].filter(Boolean))];
  if (!tokens.length) throw new Error("GITHUB_TOKEN não definido");
  for (let attempt = 1; attempt <= 4; attempt++) {
    const token = tokens[(attempt - 1) % tokens.length]; // se o PAT expirar, cai pro token padrão do Actions
    try {
      const r = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "onurb-sys" },
        body: JSON.stringify({ query: QUERY, variables: { login: USER } }),
      });
      const j = await r.json();
      if (!r.ok || j.errors) throw new Error(JSON.stringify(j.errors || j));
      return j.data.user;
    } catch (e) {
      console.warn(`tentativa ${attempt} falhou: ${e.message}`);
      if (attempt === 4) throw e;
      await new Promise((res) => setTimeout(res, attempt * 5000));
    }
  }
}

function crunch(u) {
  const cc = u.contributionsCollection;
  const days = cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays).sort((a, b) => a.date.localeCompare(b.date));
  let i = days.length - 1;
  if (i >= 0 && days[i].contributionCount === 0) i--; // o dia de hoje ainda pode estar zerado
  let current = 0;
  while (i >= 0 && days[i].contributionCount > 0) { current++; i--; }
  let longest = 0, run = 0;
  for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; longest = Math.max(longest, run); }

  const langs = {};
  let stars = 0;
  for (const r of u.repositories.nodes) {
    stars += r.stargazerCount;
    for (const e of r.languages.edges) langs[e.node.name] = (langs[e.node.name] || 0) + e.size;
  }
  const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
  const topLangs = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, size]) => ({ name, pct: (size / total) * 100 }));
  const last7 = days.slice(-7).reduce((a, d) => a + d.contributionCount, 0);

  return {
    days, current, longest, stars, topLangs, last7,
    repos: u.repositories.totalCount,
    followers: u.followers.totalCount,
    contrib: cc.contributionCalendar.totalContributions,
    commits: cc.totalCommitContributions + cc.restrictedContributionsCount,
    prs: cc.totalPullRequestContributions,
    issues: cc.totalIssueContributions,
  };
}

function syncStamp() {
  const d = new Date();
  const s = d.toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo", hour12: false }).slice(0, 16);
  return `LAST SYNC ${s} BRT`;
}

// ───────────────────────── PEÇAS DINÂMICAS ─────────────────────────
function status(s) {
  const W = 490, H = 340, x1 = 28, x2 = W - 28;
  const state = s.last7 > 0 ? ["OPTIMAL", C.cyan] : ["IDLE", C.red];
  const rows = [
    ["SERVICE STATUS", "RUNNING"],
    ["CONTRIBUTIONS [1Y]", s.contrib],
    ["COMMITS [1Y]", s.commits],
    ["PULL REQUESTS [1Y]", s.prs],
    ["PUBLIC REPOS", s.repos],
    ["STARS EARNED", s.stars],
    ["CURRENT STREAK", `${s.current} DAYS`],
    ["LONGEST STREAK", `${s.longest} DAYS`],
  ];
  let body = `
<rect width="${W}" height="${H}" fill="${C.bg}"/>
${frame(6, 6, W - 12, H - 12, 22)}
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="url(#grid)"/>
<text x="${W / 2}" y="40" class="m" font-size="15" fill="${C.red}" text-anchor="middle" letter-spacing="3">SYSTEM STATUS</text>
<line x1="${x1}" y1="52" x2="${x2}" y2="52" stroke="${C.red2}" stroke-dasharray="6 3"/>`;
  rows.forEach(([k, v], i) => {
    const y = 82 + i * 25;
    body += typed(x1, y, x2 - x1 + 4, 0.2 + i * 0.18, leader(x1, x2, y, k, v, 14, i === 0 ? { valueColor: C.cyan } : {}), 0.35);
  });
  const yb = 82 + rows.length * 25 + 4;
  body += `
<line x1="${x1}" y1="${yb - 8}" x2="${x2}" y2="${yb - 8}" stroke="${C.dim}"/>
<text x="${x1}" y="${yb + 14}" class="m" font-size="14" fill="${C.text}" letter-spacing="1">OVERALL SYSTEM STATUS: <tspan fill="${state[1]}" class="blink">${state[0]}</tspan></text>
<text x="${x2}" y="${H - 20}" class="m" font-size="11" fill="${C.faint}" text-anchor="end" letter-spacing="1">${syncStamp()}</text>
<rect width="${W}" height="${H}" fill="url(#scan)"/>`;
  return svg(W, H, body, "", "System status");
}

function languages(s) {
  const W = 490, H = 340, x1 = 28, x2 = W - 28, blocks = 24;
  let body = `
<rect width="${W}" height="${H}" fill="${C.bg}"/>
${frame(6, 6, W - 12, H - 12, 22)}
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="url(#grid)"/>
<text x="${W / 2}" y="40" class="m" font-size="15" fill="${C.red}" text-anchor="middle" letter-spacing="3">LANGUAGE MATRIX</text>
<line x1="${x1}" y1="52" x2="${x2}" y2="52" stroke="${C.red2}" stroke-dasharray="6 3"/>`;
  const list = s.topLangs.length ? s.topLangs : [{ name: "NO DATA", pct: 0 }];
  list.forEach((l, i) => {
    const y = 84 + i * 38;
    const filled = Math.max(l.pct > 0 ? 1 : 0, Math.round((l.pct / 100) * blocks));
    const bw = (x2 - x1 - (blocks - 1) * 3) / blocks;
    let bars = "";
    for (let b = 0; b < blocks; b++) {
      const on = b < filled;
      bars += `<rect x="${(x1 + b * (bw + 3)).toFixed(1)}" y="${y + 8}" width="${bw.toFixed(1)}" height="9" fill="${on ? C.red : C.dark}"${on ? "" : ` stroke="${C.dim}" stroke-width=".6"`}>${on ? `<set attributeName="opacity" to="0" begin="0s"/><animate attributeName="opacity" from="0" to="1" begin="${(0.3 + i * 0.15 + b * 0.025).toFixed(2)}s" dur=".15s" fill="freeze"/>` : ""}</rect>`;
    }
    body += `
<text x="${x1}" y="${y}" class="m" font-size="14" fill="${C.text}" letter-spacing="1">${esc(l.name.toUpperCase())}</text>
<text x="${x2}" y="${y}" class="m" font-size="14" fill="${C.red}" text-anchor="end">${l.pct.toFixed(1)}%</text>
${bars}`;
  });
  body += `
<text x="${x2}" y="${H - 20}" class="m" font-size="11" fill="${C.faint}" text-anchor="end" letter-spacing="1">BY BYTES // PUBLIC REPOS</text>
<rect width="${W}" height="${H}" fill="url(#scan)"/>`;
  return svg(W, H, body, "", "Languages");
}

function activity(s) {
  const W = 1000, H = 300, N = 31;
  const days = s.days.slice(-N);
  const L = 64, R = W - 34, T = 74, B = H - 66;
  const max = Math.max(4, ...days.map((d) => d.contributionCount));
  const step = Math.ceil(max / 4);
  const top = step * 4;
  const X = (i) => L + (i * (R - L)) / Math.max(1, days.length - 1);
  const Y = (v) => B - (v / top) * (B - T);
  const pts = days.map((d, i) => [X(i), Y(d.contributionCount)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${X(days.length - 1).toFixed(1)} ${B} L${L} ${B} Z`;
  const total = days.reduce((a, d) => a + d.contributionCount, 0);
  const len = pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

  let grid = "";
  for (let k = 0; k <= 4; k++) {
    const v = k * step, y = Y(v);
    grid += `<line x1="${L}" y1="${y}" x2="${R}" y2="${y}" stroke="${C.dim}" stroke-opacity=".6" stroke-dasharray="${k ? "3 5" : "0"}"/>
<text x="${L - 12}" y="${y + 4}" class="m" font-size="11" fill="${C.soft}" text-anchor="end">${v}</text>`;
  }
  let xl = "";
  days.forEach((d, i) => {
    if (i % 5 === 0 || i === days.length - 1) {
      const [, mm, dd] = d.date.split("-");
      xl += `<text x="${X(i)}" y="${B + 21}" class="m" font-size="11" fill="${C.soft}" text-anchor="middle">${dd}/${mm}</text>
<line x1="${X(i)}" y1="${B}" x2="${X(i)}" y2="${B + 6}" stroke="${C.soft}"/>`;
    }
  });
  const dots = pts.map((p, i) => `<rect x="${(p[0] - 3).toFixed(1)}" y="${(p[1] - 3).toFixed(1)}" width="6" height="6" fill="${days[i].contributionCount ? C.red : C.bg}" stroke="${C.red}" stroke-width="1.2"><set attributeName="opacity" to="0" begin="0s"/><animate attributeName="opacity" from="0" to="1" begin="${(0.2 + (i / pts.length) * 1.8).toFixed(2)}s" dur=".2s" fill="freeze"/></rect>`).join("");

  const body = `
<rect width="${W}" height="${H}" fill="${C.bg}"/>
<defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.red}" stop-opacity=".45"/><stop offset="1" stop-color="${C.red}" stop-opacity="0"/></linearGradient></defs>
${frame(6, 6, W - 12, H - 12, 24)}
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="url(#grid)"/>
<text x="30" y="42" class="h" font-size="22" fill="${C.red}" letter-spacing="3">NEURAL ACTIVITY <tspan class="m" font-size="13" fill="${C.soft}" letter-spacing="1">// CONTRIBUTIONS, LAST ${days.length} DAYS</tspan></text>
<text x="${W - 30}" y="42" class="m" font-size="13" fill="${C.red}" text-anchor="end" letter-spacing="1">TOTAL ${total} // PEAK ${Math.max(0, ...days.map((d) => d.contributionCount))} // STREAK ${s.current}D</text>
${grid}
<path d="${area}" fill="url(#ag)"><set attributeName="opacity" to="0" begin="0s"/><animate attributeName="opacity" from="0" to="1" begin="1.2s" dur="1s" fill="freeze"/></path>
<path d="${line}" fill="none" stroke="${C.red}" stroke-width="2.4" stroke-linejoin="round" filter="url(#glow)" stroke-dasharray="${len.toFixed(0)}" stroke-dashoffset="0"><animate attributeName="stroke-dashoffset" from="${len.toFixed(0)}" to="0" dur="2s" fill="freeze"/></path>
${dots}
${xl}
<text x="30" y="${H - 18}" class="m" font-size="11" fill="${C.faint}" letter-spacing="1">${syncStamp()}</text>
<rect width="${W}" height="${H}" fill="url(#scan)"/>`;
  return svg(W, H, body, "", "Activity graph");
}

// ───────────────────────── MAIN ─────────────────────────
const [mode = "dynamic", out = mode === "static" ? "assets" : "dist"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const write = (name, content) => { writeFileSync(join(out, name), content); console.log(`✓ ${join(out, name)} (${(content.length / 1024).toFixed(1)} KB)`); };

if (mode === "static" || mode === "all") {
  write("header.svg", header());
  write("stack.svg", stack());
  PROJECTS.forEach((p, i) => write(`project-${p.id}.svg`, projectCard(p, i)));
  write("btn-linkedin.svg", button("LINKEDIN", "UPLINK_01"));
  write("btn-mail.svg", button("GMAIL", "UPLINK_02"));
  write("footer.svg", footer());
  write("title-stack.svg", sectionTitle("INSTALLED CYBERWARE", 1000, "STACK // LOADOUT"));
  write("title-data.svg", sectionTitle("SYSTEM DIAGNOSTICS", 1000, "AUTO-SYNC // 2x DAY"));
  write("title-projects.svg", sectionTitle("DATA SHARDS", 1000, "PROJECTS // CLICK TO ACCESS"));
  write("title-contact.svg", sectionTitle("OPEN UPLINK", 1000, "CONTACT"));
}
if (mode === "dynamic" || mode === "all") {
  const s = crunch(await fetchData());
  write("status.svg", status(s));
  write("languages.svg", languages(s));
  write("activity.svg", activity(s));
}
