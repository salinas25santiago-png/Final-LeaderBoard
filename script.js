// =====================================================
//   GRUPOS DE PARTICIPANTES
// =====================================================
const GRUPOS = {
  1: [
    { nombre: "Yellow",     color: "#ffe14d", texto: "#001a4c", paso: 2 },
    { nombre: "Black",      color: "#15151d", texto: "#ffffff", paso: 2 },
    { nombre: "Light Blue", color: "#8fd0ff", texto: "#001a4c", paso: 2 },
    { nombre: "White",      color: "#ffffff", texto: "#001a4c", paso: 2 },
    { nombre: "Purple",     color: "#9d5cf5", texto: "#001a4c", paso: 2 },
    { nombre: "Ignorance",  color: "#b8c2d6", texto: "#001a4c", paso: 1 }
  ],
  2: [
    { nombre: "Orange",      color: "#ffa83d", texto: "#001a4c", paso: 2 },
    { nombre: "Brown",       color: "#b97d52", texto: "#001a4c", paso: 2 },
    { nombre: "Turquoise",   color: "#35e0d2", texto: "#001a4c", paso: 2 },
    { nombre: "Light Green", color: "#b5e86b", texto: "#001a4c", paso: 2 },
    { nombre: "Magenta",     color: "#f06ad2", texto: "#001a4c", paso: 2 },
    { nombre: "Red",         color: "#ff4d4d", texto: "#001a4c", paso: 2 },
    { nombre: "Ignorance",   color: "#b8c2d6", texto: "#001a4c", paso: 1 }
  ],
  3: [
    { nombre: "Ivory",     color: "#f4edd3", texto: "#001a4c", paso: 2 },
    { nombre: "Grey",      color: "#858a94", texto: "#001a4c", paso: 2 },
    { nombre: "Blue",      color: "#3d8bff", texto: "#001a4c", paso: 2 },
    { nombre: "Green",     color: "#2fbf5b", texto: "#001a4c", paso: 2 },
    { nombre: "Pink",      color: "#ff8ccb", texto: "#001a4c", paso: 2 },
    { nombre: "Aqua",      color: "#4de8e0", texto: "#001a4c", paso: 2 },
    { nombre: "Ignorance", color: "#b8c2d6", texto: "#001a4c", paso: 1 }
  ]
};

let grupoActual = 2;                     // grupo con el que arranca
let participantes = GRUPOS[grupoActual];

const MAX_BARRA = 40;    // km que llenan la barra al 100% (solo visual)
let contadorLlegada = 0; // nunca se reinicia: sirve para el desempate en todos los grupos

// Reinicia solo el grupo que se está viendo
function reiniciarDatos() {
  participantes.forEach(p => { p.km = 0; p.llegada = contadorLlegada++; });
}

// Estado inicial de los tres grupos
Object.values(GRUPOS).forEach(g =>
  g.forEach(p => { p.km = 0; p.llegada = contadorLlegada++; })
);

const leaderboardEl = document.getElementById("leaderboard");
const bancaEl = document.getElementById("banca");
const efectosEl = document.getElementById("efectos");

// Cada participante tiene UNA fila que se reutiliza (no se vuelve a crear)
const filas = new Map();

// =====================================================
//   CLASIFICACIÓN Y TABLERO
// =====================================================
function clasificacion() {
  return [...participantes].sort((a, b) =>
    b.km !== a.km ? b.km - a.km : a.llegada - b.llegada
  );
}

function avanzar(p, elemento) {
  p.km += p.paso;
  p.llegada = contadorLlegada++;
  efectoClic(p, elemento);
  render(p);
}

// Reinicia una animación CSS aunque ya estuviera puesta
function reanimar(el, clase) {
  el.classList.remove(clase);
  void el.offsetWidth;
  el.classList.add(clase);
}

function crearFila(p) {
  const fila = document.createElement("li");
  fila.className = "fila";
  fila.dataset.nombre = p.nombre;
  fila.style.setProperty("--color", p.color);
  fila.style.setProperty("--texto-color", p.texto);
  fila.innerHTML = `
    <span class="lugar"></span>
    <div class="info">
      <div class="nombre"><span class="punto"></span>${p.nombre}</div>
      <div class="barra"><i></i></div>
    </div>
    <span class="km"></span>
  `;
  fila.addEventListener("click", () => avanzar(p, fila));

  fila.addEventListener("animationend", e => {
    if (e.pseudoElement) return; // ignora la aurora
    if (e.animationName === "entrada") {
      fila.classList.remove("nueva");
      fila.style.animationDelay = "";
    }
    if (e.animationName === "destello-fila") fila.classList.remove("pulso");
    if (e.animationName === "numero") e.target.classList.remove("sube");
  });
  return fila;
}

function render(activo = null, inicial = false) {
  const ordenados = clasificacion();
  const top6 = ordenados.slice(0, 6);
  const septimo = ordenados[6];
  const enTop = new Set(top6.map(p => p.nombre));

  // 1) Posición real de cada fila ANTES del cambio
  const antes = new Map();
  filas.forEach((fila, nombre) => {
    if (fila.parentNode === leaderboardEl) antes.set(nombre, fila.offsetTop);
  });

  // 2) Quitar la fila que sale del Top 6
  filas.forEach((fila, nombre) => {
    if (!enTop.has(nombre) && fila.parentNode === leaderboardEl) fila.remove();
  });

  // 3) Actualizar (o crear) cada fila. Quienes empatan comparten número de lugar
  let rango = 0;
  let kmAnterior = null;

  top6.forEach((p, i) => {
    if (p.km !== kmAnterior) { rango++; kmAnterior = p.km; }

    let fila = filas.get(p.nombre);
    if (!fila) { fila = crearFila(p); filas.set(p.nombre, fila); }
    const entra = fila.parentNode !== leaderboardEl;

    for (let k = 0; k <= 7; k++) fila.classList.remove("p" + k);
    // Con 0 km nadie va "ganando": sin aro ni aurora todavía
    fila.classList.add("p" + (p.km > 0 ? rango : 0));

    fila.querySelector(".lugar").textContent = `${rango}º`;
    fila.querySelector(".km").innerHTML = `${p.km}<small>km</small>`;
    fila.querySelector(".barra i").style.width =
      Math.min(100, (p.km / MAX_BARRA) * 100) + "%";

    if (entra) {
      fila.classList.add("nueva");
      fila.style.animationDelay = inicial ? `${i * 80}ms` : "";
    }
  });

  // 4) Ordenar en pantalla moviendo solo las filas necesarias
  top6.forEach((p, i) => {
    const fila = filas.get(p.nombre);
    if (leaderboardEl.children[i] !== fila) {
      leaderboardEl.insertBefore(fila, leaderboardEl.children[i] || null);
    }
  });

  // 5) Deslizar solo las filas que cambiaron de lugar
  top6.forEach(p => {
    if (!antes.has(p.nombre)) return;
    const fila = filas.get(p.nombre);
    const delta = antes.get(p.nombre) - fila.offsetTop;
    if (delta) {
      fila.animate(
        [{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }],
        { duration: 450, easing: "cubic-bezier(.2,.9,.3,1.2)" }
      );
    }
  });

  // 6) Destello y latido del número solo en quien sumó
  if (activo) {
    const fila = filas.get(activo.nombre);
    if (fila && fila.parentNode === leaderboardEl) {
      reanimar(fila, "pulso");
      reanimar(fila.querySelector(".km"), "sube");
    }
  }

  // 7) El 7º lugar (clicable). El grupo 1 solo tiene 6, así que no aparece
  bancaEl.innerHTML = "";
  if (septimo) {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.style.setProperty("--color", septimo.color);
    chip.innerHTML = `<span class="punto"></span>7º · ${septimo.nombre} · ${septimo.km} km`;
    chip.addEventListener("click", () => avanzar(septimo, chip));
    if (activo && septimo.nombre === activo.nombre) chip.classList.add("pulso");
    bancaEl.appendChild(chip);
  }
}

// "+2" flotante
function efectoClic(p, elemento) {
  const r = elemento.getBoundingClientRect();
  const texto = document.createElement("div");
  texto.className = "flotante";
  texto.textContent = `+${p.paso}`;
  texto.style.setProperty("--color", p.color);
  texto.style.left = r.left + r.width / 2 + "px";
  texto.style.top = r.top + r.height / 2 + "px";
  efectosEl.appendChild(texto);
  setTimeout(() => texto.remove(), 900);
}

// =====================================================
//   REINICIAR
// =====================================================
document.getElementById("reiniciar").addEventListener("click", () => {
  reiniciarDatos();
  render();
});

// En modo ampliado pide confirmar con un 2º toque
const btnReiniciarGrande = document.getElementById("reiniciar-grande");
let temporizadorConfirmar = null;

function cancelarConfirmacion() {
  clearTimeout(temporizadorConfirmar);
  temporizadorConfirmar = null;
  btnReiniciarGrande.classList.remove("confirmando");
  btnReiniciarGrande.textContent = "↺ Reiniciar";
}

btnReiniciarGrande.addEventListener("click", () => {
  if (temporizadorConfirmar) {
    cancelarConfirmacion();
    reiniciarDatos();
    render();
    return;
  }
  btnReiniciarGrande.classList.add("confirmando");
  btnReiniciarGrande.textContent = "¿Seguro? Toca de nuevo";
  temporizadorConfirmar = setTimeout(cancelarConfirmacion, 3000);
});

// =====================================================
//   AMPLIAR / VOLVER
// =====================================================
const btnEnfocar = document.getElementById("enfocar");

function ponerModo(grande) {
  document.body.classList.toggle("grande", grande);
  btnEnfocar.textContent = grande ? "✕ Salir" : "⛶ Ampliar";
  if (!grande) cancelarConfirmacion();
}

btnEnfocar.addEventListener("click", async () => {
  const grande = !document.body.classList.contains("grande");
  ponerModo(grande);
  try {
    if (grande && !document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else if (!grande && document.fullscreenElement) {
      await document.exitFullscreen();
    }
  } catch (e) { /* si el navegador no permite pantalla completa, igual se agranda */ }
});

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) ponerModo(false);
});

// =====================================================
//   FINALIZAR: cuenta regresiva, podio y confeti
// =====================================================
const finalEl      = document.getElementById("final");
const contenidoEl  = document.getElementById("final-contenido");
const podioEl      = document.getElementById("podio");
const restoEl      = document.getElementById("resto");
const cuentaEl     = document.getElementById("cuenta");
const destelloEl   = document.getElementById("destello");
const btnFinalizar = document.getElementById("finalizar");

const CORONA = `
<svg class="corona" viewBox="-8 -12 136 104" aria-hidden="true">
  <defs>
    <linearGradient id="oro-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff4b8"/>
      <stop offset=".35" stop-color="#ffd24d"/>
      <stop offset=".75" stop-color="#e3a21a"/>
      <stop offset="1" stop-color="#b97a0c"/>
    </linearGradient>
    <linearGradient id="brillo-g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".5" stop-color="#fff" stop-opacity=".85"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="corona-clip">
      <path d="M12 74 L6 28 L32 52 L36 18 L50 46 L60 8 L70 46 L84 18 L88 52 L114 28 L108 74 Z"/>
      <rect x="10" y="66" width="100" height="14" rx="3"/>
    </clipPath>
  </defs>

  <path d="M12 74 L6 28 L32 52 L36 18 L50 46 L60 8 L70 46 L84 18 L88 52 L114 28 L108 74 Z"
        fill="url(#oro-g)" stroke="#8a5a0a" stroke-width="3" stroke-linejoin="round"/>

  <g clip-path="url(#corona-clip)">
    <g transform="skewX(-20)">
      <rect class="barrido" x="-40" y="-10" width="22" height="110" fill="url(#brillo-g)"/>
    </g>
  </g>

  <rect x="10" y="66" width="100" height="14" rx="3" fill="#e3a21a" stroke="#8a5a0a" stroke-width="3"/>
  <rect x="13" y="68" width="94" height="3" rx="1.5" fill="#fff4b8" opacity=".7"/>

  <g stroke="#6b3f05" stroke-width="1.2">
    <circle cx="24" cy="75" r="3.4" fill="#ff4d6d"/>
    <circle cx="42" cy="75" r="3.4" fill="#4dd2ff"/>
    <circle cx="60" cy="75" r="4.6" fill="#ff4d6d"/>
    <circle cx="78" cy="75" r="3.4" fill="#4dd2ff"/>
    <circle cx="96" cy="75" r="3.4" fill="#ff4d6d"/>
  </g>
  <circle cx="58.8" cy="73.4" r="1.3" fill="#fff" opacity=".9"/>

  <g fill="#fff4b8" stroke="#8a5a0a" stroke-width="2">
    <circle cx="6"   cy="28" r="4.8"/>
    <circle cx="36"  cy="18" r="4.8"/>
    <circle cx="60"  cy="8"  r="5.6"/>
    <circle cx="84"  cy="18" r="4.8"/>
    <circle cx="114" cy="28" r="4.8"/>
  </g>

  <g fill="#fff">
    <g transform="translate(-2 4)"><path class="chispa" d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z"/></g>
    <g transform="translate(122 8)"><path class="chispa" style="animation-delay:.6s" d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z"/></g>
    <g transform="translate(96 -4)"><path class="chispa" style="animation-delay:1.1s" d="M0 -6 L1.8 -1.8 L6 0 L1.8 1.8 L0 6 L-1.8 1.8 L-6 0 L-1.8 -1.8 Z"/></g>
    <g transform="translate(22 -2)"><path class="chispa" style="animation-delay:1.5s" d="M0 -6 L1.8 -1.8 L6 0 L1.8 1.8 L0 6 L-1.8 1.8 L-6 0 L-1.8 -1.8 Z"/></g>
  </g>
</svg>`;

const DIABLO = `
  <svg class="diablo" viewBox="0 0 100 112" aria-hidden="true">
    <defs>
      <radialGradient id="dg-diablo" cx="38%" cy="32%" r="75%">
        <stop offset="0" stop-color="#ff8a6b"/>
        <stop offset=".55" stop-color="#e5262c"/>
        <stop offset="1" stop-color="#9e0f18"/>
      </radialGradient>
    </defs>
    <path d="M24 38 C8 30 4 12 16 2 C18 16 28 24 42 28 Z" fill="#7c0b12" stroke="#3d0509" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M76 38 C92 30 96 12 84 2 C82 16 72 24 58 28 Z" fill="#7c0b12" stroke="#3d0509" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="50" cy="60" r="36" fill="url(#dg-diablo)" stroke="#5a0a10" stroke-width="3"/>
    <path d="M20 44 L46 54 L47 47 L24 34 Z" fill="#3d0509"/>
    <path d="M80 44 L54 54 L53 47 L76 34 Z" fill="#3d0509"/>
    <path d="M26 56 Q36 48 46 57 Q36 64 26 56 Z" fill="#ffe14d" stroke="#3d0509" stroke-width="2" stroke-linejoin="round"/>
    <path d="M74 56 Q64 48 54 57 Q64 64 74 56 Z" fill="#ffe14d" stroke="#3d0509" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="38" cy="57" rx="2.4" ry="5" fill="#1a0000"/>
    <ellipse cx="62" cy="57" rx="2.4" ry="5" fill="#1a0000"/>
    <circle cx="46" cy="68" r="1.6" fill="#7c0b12"/>
    <circle cx="54" cy="68" r="1.6" fill="#7c0b12"/>
    <g class="boca">
      <path d="M24 72 Q50 104 76 72 Q50 82 24 72 Z" fill="#2a0306" stroke="#3d0509" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M28 74 L33 79 L38 77 L44 85 L50 79 L56 85 L62 77 L67 79 L72 74 Q50 82 28 74 Z" fill="#fff"/>
    </g>
    <path d="M42 94 Q50 110 58 94 Q50 99 42 94 Z" fill="#3d0509"/>
  </svg>`;

// [izquierda, arriba, rotación, tamaño]
const POS_RISAS = [
  ["-30%", "-30%", "-10deg", 1.2],
  ["35%",  "-15%", "8deg",   1.35],
  ["-45%", "25%",  "-6deg",  1.1],
  ["42%",  "30%",  "10deg",  1.2],
  ["0%",   "70%",  "-3deg",  1]
];
const RISAS = `<div class="risas" aria-hidden="true">${POS_RISAS.map(([l, t, r, s], i) =>
  `<span class="risa" style="left:${l};top:${t};--r:${r};--s:${s};--d:${(i * 0.13).toFixed(2)}s">` +
  `<b style="--n:0">JA</b><b style="--n:1">JA</b><b style="--n:2">JA</b></span>`).join("")}</div>`;

// false = el diablito sale siempre que Ignorance esté en el podio
// true  = sale solo cuando Ignorance gana
const DIABLO_SOLO_SI_GANA = false;

let ganaIgnorance = false;

let tiempos = [];
function en(ms, fn) { tiempos.push(setTimeout(fn, ms)); }
function limpiarTiempos() { tiempos.forEach(clearTimeout); tiempos = []; }

// ---------- Confeti (canvas) ----------
const lienzo = document.getElementById("confeti");
const pincel = lienzo.getContext("2d");
let piezas = [];
let rafConfeti = null;
let lluviaId = null;

function ajustarLienzo() {
  const d = window.devicePixelRatio || 1;
  lienzo.width = window.innerWidth * d;
  lienzo.height = window.innerHeight * d;
  pincel.setTransform(d, 0, 0, d, 0, 0);
}
window.addEventListener("resize", ajustarLienzo);

let COLORES_CONFETI = ["#ffd166", "#ffffff", "#6aa5ff", ...participantes.map(p => p.color)];

function crearPieza(x, y, vx, vy) {
  return {
    x, y, vx, vy,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    rot: Math.random() * 6.28,
    vr: (Math.random() - .5) * .35,
    fase: Math.random() * 6.28,
    color: COLORES_CONFETI[Math.floor(Math.random() * COLORES_CONFETI.length)]
  };
}

function explosion(x, y, cantidad, angulo, apertura, fuerza) {
  for (let i = 0; i < cantidad; i++) {
    const a = angulo + (Math.random() - .5) * apertura;
    const v = fuerza * (.45 + Math.random() * .55);
    piezas.push(crearPieza(x, y, Math.cos(a) * v, Math.sin(a) * v));
  }
  animarConfeti();
}

function iniciarLluvia(duracion) {
  clearInterval(lluviaId);
  const fin = performance.now() + duracion;
  lluviaId = setInterval(() => {
    if (performance.now() > fin) { clearInterval(lluviaId); lluviaId = null; return; }
    for (let i = 0; i < 3; i++) {
      piezas.push(crearPieza(Math.random() * window.innerWidth, -12,
        (Math.random() - .5) * 2, 2 + Math.random() * 3));
    }
    animarConfeti();
  }, 120);
}

function animarConfeti() {
  if (rafConfeti) return;
  const paso = () => {
    pincel.clearRect(0, 0, window.innerWidth, window.innerHeight);
    piezas.forEach(p => {
      p.vy += .22;
      p.vx *= .99;
      p.vy *= .992;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.fase += .12;
      pincel.save();
      pincel.translate(p.x, p.y);
      pincel.rotate(p.rot);
      pincel.scale(1, Math.cos(p.fase));
      pincel.fillStyle = p.color;
      pincel.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      pincel.restore();
    });
    piezas = piezas.filter(p => p.y < window.innerHeight + 30);
    if (piezas.length || lluviaId) rafConfeti = requestAnimationFrame(paso);
    else { rafConfeti = null; pincel.clearRect(0, 0, window.innerWidth, window.innerHeight); }
  };
  rafConfeti = requestAnimationFrame(paso);
}

// ---------- Lluvia triste (giro cuando gana Ignorance) ----------
let rafLluviaTriste = null;
let gotas = [];

function nuevaGota(inicial) {
  return {
    x: Math.random() * (window.innerWidth + 200),
    y: inicial ? Math.random() * window.innerHeight : -30,
    l: 14 + Math.random() * 18,
    v: 14 + Math.random() * 10
  };
}

function iniciarLluviaTriste() {
  detenerLluviaTriste();
  gotas = Array.from({ length: 170 }, () => nuevaGota(true));
  const paso = () => {
    pincel.clearRect(0, 0, window.innerWidth, window.innerHeight);
    pincel.strokeStyle = "rgba(170, 200, 255, .45)";
    pincel.lineWidth = 1.4;
    pincel.beginPath();
    gotas.forEach(g => {
      pincel.moveTo(g.x, g.y);
      pincel.lineTo(g.x - g.l * .18, g.y + g.l);
      g.y += g.v;
      g.x -= g.v * .18;
      if (g.y > window.innerHeight) Object.assign(g, nuevaGota(false));
    });
    pincel.stroke();
    rafLluviaTriste = requestAnimationFrame(paso);
  };
  rafLluviaTriste = requestAnimationFrame(paso);
}

function detenerLluviaTriste() {
  if (rafLluviaTriste) { cancelAnimationFrame(rafLluviaTriste); rafLluviaTriste = null; }
  gotas = [];
}

function limpiarConfeti() {
  piezas = [];
  clearInterval(lluviaId);
  lluviaId = null;
  if (rafConfeti) { cancelAnimationFrame(rafConfeti); rafConfeti = null; }
  detenerLluviaTriste();
  pincel.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

// ---------- Números que suben contando ----------
function contar(el, hasta, duracion = 900) {
  const inicio = performance.now();
  const paso = ahora => {
    const t = Math.min(1, (ahora - inicio) / duracion);
    el.textContent = Math.round(hasta * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

// ---------- Grupos por lugar (los empates comparten lugar) ----------
function gruposFinales() {
  const grupos = [];
  let ultimo = null;
  clasificacion().forEach(p => {
    if (p.km !== ultimo) {
      grupos.push({ rango: grupos.length + 1, km: p.km, miembros: [] });
      ultimo = p.km;
    }
    grupos[grupos.length - 1].miembros.push(p);
  });
  return grupos;
}

// ----- Orejas de burro (para todos cuando gana Ignorance) -----
const OREJAS = `
  <svg class="orejas" viewBox="0 0 120 64" aria-hidden="true">
    <path d="M34 62 C10 48 2 20 12 4 C30 8 44 32 46 62 Z"/>
    <path class="int" d="M32 56 C16 44 10 24 15 12 C26 18 36 34 38 56 Z"/>
    <path d="M86 62 C110 48 118 20 108 4 C90 8 76 32 74 62 Z"/>
    <path class="int" d="M88 56 C104 44 110 24 105 12 C94 18 84 34 82 56 Z"/>
  </svg>`;

// ----- Teus triste (aparece en el giro cuando gana Ignorance) -----
const teusEl = document.createElement("div");
teusEl.className = "teus";
teusEl.setAttribute("aria-hidden", "true");
finalEl.appendChild(teusEl);

// ---------- JAJAJA por toda la pantalla (giro triste) ----------
const risasPantallaEl = document.createElement("div");
risasPantallaEl.className = "risas-pantalla";
risasPantallaEl.setAttribute("aria-hidden", "true");
finalEl.appendChild(risasPantallaEl);

function llenarRisasPantalla() {
  const horizontal = window.innerWidth > window.innerHeight;
  const columnas = horizontal ? 6 : 4;
  const filas    = horizontal ? 5 : 8;
  let html = "";

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const izq = c * (100 / columnas) + Math.random() * (100 / columnas) * .55 - 3;
      const arr = f * (100 / filas)    + Math.random() * (100 / filas) * .6  - 2;
      const unidades = 2 + Math.floor(Math.random() * 4);          // JA x2 hasta x5
      const tam = (2.4 + Math.random() * 3.6).toFixed(1);          // tamaño (vmin)
      const rot = Math.round(-22 + Math.random() * 44);            // inclinación
      const op  = (.3 + Math.random() * .55).toFixed(2);           // unos más tenues
      const ret = (.2 + Math.random() * 1.6).toFixed(2);           // aparecen escalonados
      const d   = (Math.random() * .5).toFixed(2);
      const letras = Array.from({ length: unidades }, (_, i) => `<b style="--n:${i}">JA</b>`).join("");

      html += `<span class="risa risa-p" style="left:${izq.toFixed(1)}%;top:${arr.toFixed(1)}%;` +
              `--r:${rot}deg;--s:1;--fs:${tam};--op:${op};--ret:${ret}s;--d:${d}s">${letras}</span>`;
    }
  }
  risasPantallaEl.innerHTML = html;
}

// ---------- Construir podio y resto ----------
function construirFinal(grupos) {
  const delPodio = grupos.filter(g => g.rango <= 3);
  const ordenVisual = [2, 1, 3]
    .map(r => delPodio.find(g => g.rango === r))
    .filter(Boolean);

  // Orejas escalonadas: salen una tras otra
  let n = 0;
  const orejasPara = nombre => {
    if (!ganaIgnorance || nombre === "Ignorance") return "";
    return OREJAS.replace("<svg ", `<svg style="--o:${(n++ * 0.12).toFixed(2)}s" `);
  };

  podioEl.innerHTML = ordenVisual.map(g => {
    const ignGana = g.rango === 1 && g.miembros.some(p => p.nombre === "Ignorance");

    return `
    <div class="puesto r${g.rango}${ignGana ? " ign-gana" : ""}">
      ${g.rango === 1 ? CORONA : ""}
      <div class="ganadores">
        ${g.miembros.map(p => {
          const o = orejasPara(p.nombre);
          return `
          <div class="ganador${p.nombre === "Ignorance" ? " es-ign" : ""}${o ? " con-orejas" : ""}" style="--color:${p.color}">
            ${o}
            <span class="g-nombre"><i class="g-punto"></i>${p.nombre}</span>
            <span class="g-km"><b data-km="${p.km}">0</b><small>km</small></span>
          </div>`;
        }).join("")}
      </div>
      <div class="pedestal"><span>${g.rango}º</span></div>
    </div>`;
  }).join("");

  restoEl.innerHTML = grupos
    .filter(g => g.rango > 3)
    .flatMap(g => g.miembros.map(p => {
      const o = orejasPara(p.nombre);
      return `
      <span class="resto-item${o ? " con-orejas" : ""}" style="--color:${p.color}">
        ${o}<b>${g.rango}º</b><i class="g-punto"></i>${p.nombre} · ${p.km} km
      </span>`;
    }))
    .join("");
}

// ---------- Efectos de la secuencia ----------
function mostrarCuenta(n) { cuentaEl.innerHTML = `<span>${n}</span>`; }
function destello() { reanimar(destelloEl, "on"); }
function sacudir() { reanimar(contenidoEl, "tiembla"); }

function revelarPuesto(puesto) {
  const esPrimero = puesto.classList.contains("r1");
  puesto.classList.add("visible");

  en(650, () => puesto.querySelectorAll("[data-km]")
    .forEach(b => contar(b, +b.dataset.km)));

  const r = puesto.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height * .35;

  if (esPrimero) {
    finalEl.classList.add("ganador");
    sacudir();
    destello();
    en(500, () => {
      explosion(window.innerWidth * .08, window.innerHeight, 90, -Math.PI / 2 + .55, .9, 22);
      explosion(window.innerWidth * .92, window.innerHeight, 90, -Math.PI / 2 - .55, .9, 22);
      explosion(x, y, 80, -Math.PI / 2, 2.6, 14);
    });
    iniciarLluvia(6000);
  } else {
    en(650, () => explosion(x, y, 28, -Math.PI / 2, 1.6, 11));
  }
}

// ---------- Estado triste (cuando gana Ignorance) ----------
function ponerTriste() {
  llenarRisasPantalla();
  finalEl.classList.remove("ganador");   // se apagan los rayos de luz
  finalEl.classList.add("apagon");       // gris, viñeta, corona fuera y entra el diablito
  document.getElementById("final-sub").textContent = "Ganó la ignorancia… · Grupo " + grupoActual;
  iniciarLluviaTriste();
}

// Giro sorpresa: la fiesta se corta de golpe
function giroTriste() {
  limpiarConfeti();                      // el confeti se detiene en seco
  reanimar(destelloEl, "rayo");          // relámpago
  en(900, () => reanimar(destelloEl, "rayo"));
  sacudir();
  ponerTriste();
}

// ---------- Secuencia completa ----------
function iniciarSecuencia() {
  limpiarTiempos();
  const orden = [3, 2, 1]
    .map(r => podioEl.querySelector(`.puesto.r${r}`))
    .filter(Boolean);

  en(0,    () => mostrarCuenta(3));
  en(800,  () => mostrarCuenta(2));
  en(1600, () => mostrarCuenta(1));
  en(2400, () => {
    cuentaEl.innerHTML = "";
    destello();
    finalEl.classList.add("titulo-visible");
  });

  let t = 3000;
  orden.forEach((puesto, i) => {
    en(t, () => revelarPuesto(puesto));
    const siguiente = orden[i + 1];
    if (siguiente) t += siguiente.classList.contains("r1") ? 2300 : 1600;
  });

  if (ganaIgnorance) {
    // Primero se celebra normal y casi al final llega el giro triste
    en(t + 2800, giroTriste);
    en(t + 4600, () => finalEl.classList.add("resto-visible"));
    en(t + 5600, () => finalEl.classList.add("listo"));
  } else {
    en(t + 2200, () => finalEl.classList.add("resto-visible"));
    en(t + 3200, () => finalEl.classList.add("listo"));
  }
}

function saltarAnimacion() {
  limpiarTiempos();
  limpiarConfeti();
  cuentaEl.innerHTML = "";
  finalEl.classList.add("rapido", "titulo-visible", "resto-visible", "listo");
  podioEl.querySelectorAll(".puesto").forEach(p => p.classList.add("visible"));
  podioEl.querySelectorAll("[data-km]").forEach(b => { b.textContent = b.dataset.km; });

  if (ganaIgnorance) {
    ponerTriste();
  } else {
    finalEl.classList.add("ganador");
    explosion(window.innerWidth * .08, window.innerHeight, 70, -Math.PI / 2 + .55, .9, 22);
    explosion(window.innerWidth * .92, window.innerHeight, 70, -Math.PI / 2 - .55, .9, 22);
    iniciarLluvia(3000);
  }
}

// ---------- Abrir y cerrar ----------
function finalizar() {
  const grupos = gruposFinales();

  // Si nadie ha sumado puntos, no hay podio que mostrar
  if (!grupos.length || grupos[0].km === 0) {
    const textoOriginal = btnFinalizar.textContent;
    btnFinalizar.textContent = "Aún no hay puntos";
    btnFinalizar.classList.add("aviso");
    setTimeout(() => {
      btnFinalizar.textContent = textoOriginal;
      btnFinalizar.classList.remove("aviso");
    }, 1600);
    return;
  }

  // ¿Ganó Ignorance? (incluye empate en el 1er lugar)
  ganaIgnorance = grupos[0].miembros.some(p => p.nombre === "Ignorance");

  construirFinal(grupos);
  document.getElementById("final-sub").textContent = "Resultados finales · Grupo " + grupoActual;
  ajustarLienzo();
  finalEl.classList.add("abierto");
  finalEl.setAttribute("aria-hidden", "false");
  document.body.classList.add("con-final");
  finalEl.scrollTop = 0;
  iniciarSecuencia();
}

function cerrarFinal() {
  limpiarTiempos();
  limpiarConfeti();
  finalEl.classList.remove("abierto", "titulo-visible", "ganador", "resto-visible",
                           "listo", "rapido", "apagon");
  destelloEl.classList.remove("on", "rayo");
  finalEl.setAttribute("aria-hidden", "true");
  cuentaEl.innerHTML = "";
  document.body.classList.remove("con-final");
  ganaIgnorance = false;
}

btnFinalizar.addEventListener("click", finalizar);
document.getElementById("saltar").addEventListener("click", saltarAnimacion);
document.getElementById("volver").addEventListener("click", cerrarFinal);
document.getElementById("nueva").addEventListener("click", () => {
  cerrarFinal();
  reiniciarDatos();
  render();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && finalEl.classList.contains("abierto")) cerrarFinal();
});
// =====================================================
//   SELECTOR DE GRUPO (1, 2, 3)
// =====================================================
const selectorEl  = document.getElementById("selector");
const btnGrupo    = document.getElementById("btn-grupo");
const menuGrupoEl = document.getElementById("menu-grupo");
const numGrupoEl  = document.getElementById("num-grupo");
const transEl     = document.getElementById("transicion");
const transNumEl  = document.getElementById("t-numero");
let cambiando = false;

function abrirMenu(abrir) {
  selectorEl.classList.toggle("abierto", abrir);
  btnGrupo.setAttribute("aria-expanded", abrir);
}

function marcarGrupo() {
  numGrupoEl.textContent = grupoActual;
  menuGrupoEl.querySelectorAll("button").forEach(b =>
    b.classList.toggle("activo", +b.dataset.grupo === grupoActual)
  );
}

function cambiarGrupo(n) {
  abrirMenu(false);
  if (cambiando || n === grupoActual) return;
  cambiando = true;

  // Arranca la animación de cortinas
  transNumEl.textContent = n;
  transEl.classList.remove("activa");
  void transEl.offsetWidth;
  transEl.classList.add("activa");

  // Con las cortinas cerradas, se cambia de grupo detrás
  setTimeout(() => {
    grupoActual = n;
    participantes = GRUPOS[n];
    COLORES_CONFETI = ["#ffd166", "#ffffff", "#6aa5ff", ...participantes.map(p => p.color)];
    filas.clear();
    leaderboardEl.innerHTML = "";
    bancaEl.innerHTML = "";
    marcarGrupo();
    render(null, true);   // las filas entran en cascada al abrirse las cortinas
  }, 900);

  setTimeout(() => {
    transEl.classList.remove("activa");
    cambiando = false;
  }, 1700);
}

btnGrupo.addEventListener("click", e => {
  e.stopPropagation();
  abrirMenu(!selectorEl.classList.contains("abierto"));
});
menuGrupoEl.querySelectorAll("button").forEach(b =>
  b.addEventListener("click", () => cambiarGrupo(+b.dataset.grupo))
);
document.addEventListener("click", e => {
  if (!selectorEl.contains(e.target)) abrirMenu(false);
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") abrirMenu(false);
});

marcarGrupo();

// =====================================================
//   INICIO
// =====================================================
render(null, true);
