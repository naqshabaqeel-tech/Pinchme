// PINCHme POC — interactions shared by both landing pages

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Nav: border on scroll + mobile menu
const nav = document.querySelector(".nav");
if (nav) {
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  nav.querySelector(".menu-toggle")?.addEventListener("click", () => nav.classList.toggle("open"));
}

// Hero carousel (Klarna-style: autoplay, progress dots)
document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const track = carousel.querySelector(".slides");
  const slides = [...carousel.querySelectorAll(".slide")];
  const ui = carousel.nextElementSibling;
  const dotsWrap = ui.querySelector(".dots");
  const delay = 6000;
  let index = 0;
  let timer = null;
  const paused = reduceMotion;

  carousel.style.setProperty("--slide-ms", `${delay}ms`);
  ui.style.setProperty("--slide-ms", `${delay}ms`);

  const dots = slides.map((_, i) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", `Show slide ${i + 1}`);
    b.addEventListener("click", () => go(i, true));
    dotsWrap.appendChild(b);
    return b;
  });

  function go(i, user = false) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((s, n) => s.classList.toggle("is-active", n === index));
    dots.forEach((d, n) => {
      d.classList.remove("is-active");
      if (n === index) { void d.offsetWidth; d.classList.add("is-active"); }
    });
    if (user) restart();
  }
  function restart() {
    clearInterval(timer);
    if (!paused) timer = setInterval(() => go(index + 1), delay);
  }

  // Swipe on touch
  let startX = null;
  carousel.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
  carousel.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1), true);
    startX = null;
  });

  carousel.classList.toggle("paused", paused);
  go(0);
  restart();
});

// How it works (Klarna-style): section pins while scroll steps through the list
document.querySelectorAll("[data-how]").forEach((track) => {
  const items = [...track.querySelectorAll(".how-item")];
  const frames = [...track.querySelectorAll(".how-frame")];
  const dots = [...track.querySelectorAll(".how-dots i")];
  const count = items.length;
  let current = -1;

  const setActive = (i) => {
    if (i === current) return;
    current = i;
    [items, frames, dots].forEach((group) => group.forEach((el, n) => el.classList.toggle("is-active", n === i)));
  };

  // Scroll distance the track can travel while pinned
  const range = () => track.offsetHeight - track.querySelector(".how-sticky").offsetHeight;

  const update = () => {
    if (range() <= 0) return; // not pinned (mobile)
    const progress = Math.min(1, Math.max(0, -track.getBoundingClientRect().top / range()));
    setActive(Math.min(count - 1, Math.floor(progress * count)));
  };

  items.forEach((item, i) => {
    item.querySelector(".how-title").addEventListener("click", () => {
      if (range() <= 0) return;
      const top = track.getBoundingClientRect().top + window.scrollY + range() * ((i + 0.5) / count);
      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  setActive(0);
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
});

// Pill reveal (Square Kiosk-style): pill grows into a full card on scroll
const pills = document.querySelectorAll(".pill-reveal");
if (pills.length && !reduceMotion) {
  const update = () => {
    pills.forEach((el) => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.9)));
      el.style.setProperty("--p", p.toFixed(3));
    });
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

// Reels: a card with data-video gets a muted looping video; its photo stays as poster and fallback
document.querySelectorAll(".reel[data-video]").forEach((card) => {
  const img = card.querySelector("img");
  const video = document.createElement("video");
  Object.assign(video, { muted: true, loop: true, playsInline: true, preload: "metadata", poster: img.currentSrc || img.src, src: card.dataset.video });
  video.setAttribute("aria-hidden", "true");
  video.addEventListener("loadeddata", () => card.classList.add("has-video"), { once: true });
  video.addEventListener("error", () => video.remove(), { once: true });
  img.after(video);
});
// Only the reel nearest the middle of the screen plays; it changes as the strip scrolls past
document.querySelectorAll(".reel-marquee").forEach((marquee) => {
  const cards = [...marquee.querySelectorAll(".reel")].filter((card) => card.querySelector("video"));
  let timer = null;
  let current = null;

  const pick = () => {
    const mid = window.innerWidth / 2;
    let best = null;
    let bestDist = Infinity;
    cards.forEach((card) => {
      const r = card.getBoundingClientRect();
      const dist = Math.abs(r.left + r.width / 2 - mid);
      if (dist < bestDist) { bestDist = dist; best = card; }
    });
    if (best === current) return;
    current?.classList.remove("is-playing");
    current?.querySelector("video").pause();
    current = best;
    current.classList.add("is-playing");
    if (!reduceMotion) current.querySelector("video").play().catch(() => {});
  };

  const stop = () => {
    clearInterval(timer);
    timer = null;
    current?.classList.remove("is-playing");
    current?.querySelector("video").pause();
    current = null;
  };

  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !timer) { pick(); timer = setInterval(pick, 250); }
    else if (!entry.isIntersecting) stop();
  }, { threshold: 0.3 }).observe(marquee);
});

// Why it's free: each line turns from grey to ink once it rises past the lower third of the screen
const whyLines = document.querySelectorAll(".why-line");
if (reduceMotion) whyLines.forEach((line) => line.classList.add("is-lit"));
else {
  const whyIO = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle("is-lit", e.isIntersecting || e.boundingClientRect.top < 0)),
    { rootMargin: "0px 0px -35% 0px" }
  );
  whyLines.forEach((line) => whyIO.observe(line));
}

// Fade-up on enter
const revealIO = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), revealIO.unobserve(e.target))),
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => revealIO.observe(el));
