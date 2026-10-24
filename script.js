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
//   AMPLIAR: agranda el tablero (no toca la pantalla completa del navegador)
// =====================================================
const btnEnfocar = document.getElementById("enfocar");

function ponerModo(grande) {
  document.body.classList.toggle("grande", grande);
  btnEnfocar.textContent = grande ? "✕ Salir" : "⛶ Ampliar";
  if (!grande) cancelarConfirmacion();
}

btnEnfocar.addEventListener("click", () =>
  ponerModo(!document.body.classList.contains("grande"))
);

// =====================================================
//   FINALIZAR: cuenta regresiva, podio y confeti
// =====================================================
const finalEl      = document.getElementById("final");
const contenidoEl  = document.getElementById("final-contenido");
const podioEl      = document.getElementById("podio");
const restoEl      = document.getElementById("resto");
const cuentaEl     = document.getElementById("cuenta");
const destelloEl   = document.getElementById("destello");
const corazonEl    = document.getElementById("corazon");
const btnFinalizar = document.getElementById("finalizar");

// ----- Corona del 1er lugar -----
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

// ----- Teus triste (aparece en el giro cuando gana Ignorance) -----
const teusEl = document.createElement("div");
teusEl.className = "teus";
teusEl.setAttribute("aria-hidden", "true");
finalEl.appendChild(teusEl);

// Carga una sola imagen del Teus: la primera que exista (evita que se encimen varias)
(function cargarTeus() {
  const extensiones = ["png", "webp", "gif", "jpg", "jpeg"];
  const probar = i => {
    if (i >= extensiones.length) return;
    const img = new Image();
    img.onload = () => {
      teusEl.style.backgroundImage = `url("teustriste.${extensiones[i]}")`;
    };
    img.onerror = () => probar(i + 1);
    img.src = `teustriste.${extensiones[i]}`;
  };
  probar(0);
})();

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

// ---------- Construir podio y resto ----------
function construirFinal(grupos) {
  const delPodio = grupos.filter(g => g.rango <= 3);
  const ordenVisual = [2, 1, 3]
    .map(r => delPodio.find(g => g.rango === r))
    .filter(Boolean);

  podioEl.innerHTML = ordenVisual.map(g => {
    const ignGana = g.rango === 1 && g.miembros.some(p => p.nombre === "Ignorance");

    return `
    <div class="puesto r${g.rango}${ignGana ? " ign-gana" : ""}">
      ${g.rango === 1 ? CORONA : ""}
      <div class="ganadores">
        ${g.miembros.map(p => `
          <div class="ganador${p.nombre === "Ignorance" ? " es-ign" : ""}" style="--color:${p.color}">
            <span class="g-nombre"><i class="g-punto"></i>${p.nombre}</span>
            <span class="g-km"><b data-km="${p.km}">0</b><small>km</small></span>
          </div>`).join("")}
      </div>
      <div class="pedestal"><span>${g.rango}º</span></div>
    </div>`;
  }).join("");

  restoEl.innerHTML = grupos
    .filter(g => g.rango > 3)
    .flatMap(g => g.miembros.map(p => `
      <span class="resto-item" style="--color:${p.color}">
        <b>${g.rango}º</b><i class="g-punto"></i>${p.nombre} · ${p.km} km
      </span>`))
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

// ---------- Piso: onda de choque y polvo del impacto ----------
const sueloEl = document.createElement("div");
sueloEl.className = "c-suelo";
sueloEl.setAttribute("aria-hidden", "true");
sueloEl.innerHTML = `<i class="c-choque"></i>` + Array.from({ length: 9 }, (_, i) => {
  const lado = i % 2 ? 1 : -1;
  const dx = (lado * (6 + Math.random() * 20)).toFixed(1);
  const dy = (3 + Math.random() * 8).toFixed(1);
  const t  = (3 + Math.random() * 4).toFixed(1);
  const d  = (Math.random() * .12).toFixed(2);
  return `<i class="c-polvo" style="--dx:${dx}vmin;--dy:${dy}vmin;--t:${t}vmin;--d:${d}s"></i>`;
}).join("");
finalEl.appendChild(sueloEl);

// ---------- Corazón que se parte ----------
function romperCorazon() {
  corazonEl.classList.remove("rompe");
  void corazonEl.offsetWidth;

  // Distancia que deben caer las mitades para salir por completo de la pantalla
  const r = corazonEl.getBoundingClientRect();
  const escala = r.width / 200;   // px de pantalla por unidad del dibujo
  corazonEl.style.setProperty("--caida", (((window.innerHeight - r.top) / escala) + 40).toFixed(0));

  corazonEl.classList.add("rompe");
}

// El podio no se puede desplazar (ni con rueda ni con el dedo)
["wheel", "touchmove"].forEach(ev =>
  finalEl.addEventListener(ev, e => e.preventDefault(), { passive: false })
);

// ---------- Estado triste (cuando gana Ignorance) ----------
function ponerTriste() {
  finalEl.classList.remove("ganador");   // se apagan los rayos de luz
  finalEl.classList.add("apagon");       // gris, viñeta, corona fuera y entra el Teus
  iniciarLluviaTriste();
}

// Giro sorpresa: la fiesta se corta de golpe
function giroTriste() {
  limpiarConfeti();                      // el confeti se detiene en seco
  reanimar(destelloEl, "rayo");          // relámpago
  en(900, () => reanimar(destelloEl, "rayo"));
  sacudir();
  ponerTriste();
  en(600, romperCorazon);                // el corazón aparece y se parte
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
    en(t + 6600, () => finalEl.classList.add("resto-visible"));
    en(t + 7600, () => finalEl.classList.add("listo"));
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
  corazonEl.classList.remove("rompe");
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
//   PANTALLA COMPLETA DEL NAVEGADOR (oculta pestañas y barras)
// =====================================================
const btnPantalla = document.getElementById("btn-pantalla");
const raiz = document.documentElement;

const pedirPantalla = raiz.requestFullscreen || raiz.webkitRequestFullscreen;
const salirPantalla = document.exitFullscreen || document.webkitExitFullscreen;

function enPantallaCompleta() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}
function actualizarBotonPantalla() {
  btnPantalla.classList.toggle("activo", enPantallaCompleta());
}

// En iPhone el navegador no permite pantalla completa: ahí se oculta el botón
if (!pedirPantalla) btnPantalla.hidden = true;

btnPantalla.addEventListener("click", async () => {
  try {
    if (enPantallaCompleta()) await salirPantalla.call(document);
    else await pedirPantalla.call(raiz);
  } catch (e) { /* el navegador no lo permitió */ }
});
document.addEventListener("fullscreenchange", actualizarBotonPantalla);
document.addEventListener("webkitfullscreenchange", actualizarBotonPantalla);

// =====================================================
//   INICIO
// =====================================================
render(null, true);
