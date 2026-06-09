/* ===== EVE DRESSES — scroll-driven frame sequence ===== */

// Auto-generated frame metadata (set by the extraction build step)
const FRAME_COUNT = window.EVE_FRAME_COUNT || 121;
const FRAME_PATH = (i) => `frames/frame_${String(i).padStart(4, "0")}.jpg`;

const canvas = document.getElementById("frameCanvas");
const ctx = canvas.getContext("2d", { alpha: false });
const loader = document.getElementById("loader");
const loaderFill = document.getElementById("loaderFill");
const loaderPct = document.getElementById("loaderPct");

const images = new Array(FRAME_COUNT);
let loadedCount = 0;
let imgW = 0, imgH = 0;
let currentFrame = -1;

/* ---------- Canvas sizing (contain-fit, retina-aware) ---------- */
function resizeCanvas() {
  const w = window.innerWidth, h = window.innerHeight;
  // Ignore degenerate sizes some browsers report mid-resize (would shrink the
  // backing store and leave the hero blank until the next scroll).
  if (w < 50 || h < 50) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  currentFrame = -1; // force redraw
  drawFrame(frameForScroll());
}

// "contain" fit: show the WHOLE video frame (full subject always visible),
// centered, with warm cream letterbox bars that blend into the page background.
const CANVAS_BG = "#ece3d6";

function drawImageContain(img) {
  if (!img || !img.complete) return;
  const cw = canvas.width, ch = canvas.height;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.min(cw / iw, ch / ih);
  const w = iw * scale, h = ih * scale;
  const x = (cw - w) / 2, y = (ch - h) / 2;
  ctx.fillStyle = CANVAS_BG;           // clear bars first (drawImage won't cover them)
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, x, y, w, h);
}

function drawFrame(index) {
  index = Math.max(0, Math.min(FRAME_COUNT - 1, index));
  if (index === currentFrame) return;
  const img = images[index];
  if (img && img.complete) {
    drawImageContain(img);
    currentFrame = index;
  }
}

/* ---------- Scroll → frame mapping ---------- */
function frameForScroll() {
  const section = document.getElementById("scrollVideo");
  const rect = section.getBoundingClientRect();
  const total = section.offsetHeight - window.innerHeight;
  const scrolled = Math.min(Math.max(-rect.top, 0), total);
  const progress = total > 0 ? scrolled / total : 0;
  return Math.round(progress * (FRAME_COUNT - 1));
}

let ticking = false;
function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(() => {
      drawFrame(frameForScroll());
      fadeHero();
      updateHeroCaptions();
      updateReveal();
      ticking = false;
    });
  }
}

/* ---------- Hero progress, title fade, and running offering captions ---------- */
const heroOverlay = document.querySelector(".hero-overlay");
const heroCaptions = [...document.querySelectorAll(".hero-caption")];
let activeCaption = -1;
const CAPTION_START = 0.16; // before this, the brand title shows; after, offerings run

function heroProgress() {
  const section = document.getElementById("scrollVideo");
  const total = section.offsetHeight - window.innerHeight;
  const scrolled = Math.min(Math.max(-section.getBoundingClientRect().top, 0), total);
  return total > 0 ? scrolled / total : 0;
}

function fadeHero() {
  // Brand title fades out just as the first offering caption is about to appear.
  heroOverlay.style.opacity = Math.max(0, 1 - heroProgress() / CAPTION_START);
}

function updateHeroCaptions() {
  if (heroCaptions.length === 0) return;
  const p = heroProgress();
  let idx = -1;
  if (p >= CAPTION_START && p < 1) {
    const span = 1 - CAPTION_START;
    idx = Math.floor(((p - CAPTION_START) / span) * heroCaptions.length);
    if (idx >= heroCaptions.length) idx = heroCaptions.length - 1;
  }
  if (idx !== activeCaption) {
    heroCaptions.forEach((c, i) => c.classList.toggle("active", i === idx));
    activeCaption = idx;
  }
}

/* ---------- Preload ---------- */
function preload() {
  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.onload = img.onerror = () => {
      loadedCount++;
      const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
      loaderFill.style.width = pct + "%";
      loaderPct.textContent = pct + "%";
      if (i === 0) { imgW = img.naturalWidth; imgH = img.naturalHeight; drawFrame(0); }
      if (loadedCount === FRAME_COUNT) onAllLoaded();
    };
    img.src = FRAME_PATH(i + 1);
    images[i] = img;
  }
}

function onAllLoaded() {
  loader.classList.add("hidden");
  resizeCanvas();
  drawFrame(frameForScroll());
}

/* ---------- Sequential slide reveal ---------- */
const SEG = 0.85; // screens of scroll per slide
let revealSection, slides = [], dots = [], slideCount = 0, activeSlide = -1;

function setupReveal() {
  revealSection = document.getElementById("reveal");
  if (!revealSection) return;
  slides = [...revealSection.querySelectorAll(".slide")];
  slideCount = slides.length;
  // total scroll height = (N * SEG + 1) screens, so each slide gets ~SEG of a screen
  revealSection.style.height = (slideCount * SEG + 1) * 100 + "vh";

  // build progress dots
  const dotsWrap = document.getElementById("revealDots");
  if (dotsWrap) {
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.addEventListener("click", () => scrollToSlide(i));
      dotsWrap.appendChild(b);
      dots.push(b);
    });
  }
  updateReveal();
}

function updateReveal() {
  if (!revealSection || slideCount === 0) return;
  const rect = revealSection.getBoundingClientRect();
  const total = revealSection.offsetHeight - window.innerHeight;
  const scrolled = Math.min(Math.max(-rect.top, 0), total);
  const progress = total > 0 ? scrolled / total : 0;
  let idx = Math.floor(progress * slideCount);
  if (idx >= slideCount) idx = slideCount - 1;
  if (idx < 0) idx = 0;
  if (idx !== activeSlide) {
    slides.forEach((s, i) => s.classList.toggle("active", i === idx));
    dots.forEach((d, i) => d.classList.toggle("on", i === idx));
    activeSlide = idx;
  }
}

function scrollToSlide(i) {
  if (!revealSection) return;
  const total = revealSection.offsetHeight - window.innerHeight;
  const sectionTop = revealSection.getBoundingClientRect().top + window.scrollY;
  const top = sectionTop + ((i + 0.5) / slideCount) * total;
  window.scrollTo({ top, behavior: "smooth" });
}

function scrollToHeroServices() {
  // Scroll into the video section to where the offering captions are running.
  const section = document.getElementById("scrollVideo");
  if (!section) return;
  const total = section.offsetHeight - window.innerHeight;
  const sectionTop = section.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: sectionTop + (CAPTION_START + 0.04) * total, behavior: "smooth" });
}

function setupNav() {
  const map = {};
  slides.forEach((s, i) => { const k = s.dataset.slide; if (k) map[k] = i; });
  document.querySelectorAll(".nav-links a[data-target]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const t = a.dataset.target;
      if (t === "services") scrollToHeroServices();      // offerings run over the video
      else scrollToSlide(map[t] || 0);
    });
  });
}

/* ---------- i18n ---------- */
function applyLang(lang) {
  const dict = (window.EVE_I18N || {})[lang];
  if (!dict) return;
  document.documentElement.lang = lang;
  document.documentElement.dir = dict.dir || "ltr";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] == null) return;
    if (el.tagName === "META") el.setAttribute("content", dict[key]);
    else el.textContent = dict[key];
  });
  document.querySelectorAll("#langSwitch button").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === lang);
  });
  // Build the WhatsApp link with a localized pre-filled message.
  const waCta = document.getElementById("waCta");
  if (waCta && dict.wa_msg) {
    waCta.href = "https://wa.me/972535241345?text=" + encodeURIComponent(dict.wa_msg);
  }
  try { localStorage.setItem("eve_dresses_lang", lang); } catch (e) {}
}

function setupLang() {
  const supported = ["he", "ru", "en"];
  let saved = null;
  try { saved = localStorage.getItem("eve_dresses_lang"); } catch (e) {}
  const initial = supported.includes(saved) ? saved : "he";
  document.getElementById("langSwitch").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-lang]");
    if (btn) applyLang(btn.dataset.lang);
  });
  applyLang(initial);
}

/* ---------- Init ---------- */
window.addEventListener("scroll", onScroll, { passive: true });
let resizeRAF = 0;
window.addEventListener("resize", () => {
  // Run after layout settles so we read the final viewport size, not a
  // transient one — then force the canvas to redraw the current frame.
  cancelAnimationFrame(resizeRAF);
  resizeRAF = requestAnimationFrame(() => {
    if (revealSection) revealSection.style.height = (slideCount * SEG + 1) * 100 + "vh";
    activeSlide = -1; // force re-evaluation after layout change
    resizeCanvas();
    updateHeroCaptions();
    updateReveal();
  });
});
document.getElementById("year").textContent = new Date().getFullYear();
setupLang();
resizeCanvas();
setupReveal();
setupNav();
fadeHero();
updateHeroCaptions();
preload();
