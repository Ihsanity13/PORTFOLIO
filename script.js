"use strict";
document.documentElement.classList.add("js");
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Year */
$("#year").textContent = new Date().getFullYear();
$(".y").textContent = new Date().getFullYear();

/* Scroll: progress bar + navbar style */
const nav = $("#nav"), bar = $("#progress");
function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    nav.classList.toggle("is-scrolled", scrollY > 30);
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* Mobile menu */
const toggle = $("#navToggle"), links = $("#navLinks");
function setMenu(open) {
    toggle.setAttribute("aria-expanded", open);
    links.classList.toggle("is-open", open);
}
toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
$$("a", links).forEach(a => a.addEventListener("click", () => setMenu(false)));
addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

/* Active nav link (featured counts as Projects) */
const navMap = { featured: "projects" };
const sections = $$("main section[id]");
const navObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
        if (!en.isIntersecting) return;
        const id = navMap[en.target.id] || en.target.id;
        $$("a", links).forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === "#" + id));
    });
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach(s => navObserver.observe(s));

/* Reveal on scroll */
const revealer = new IntersectionObserver((entries, o) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-in"); o.unobserve(en.target); } });
}, { threshold: .12 });
$$(".reveal").forEach(el => revealer.observe(el));

/* Hero spotlight (follows cursor, desktop only) */
const hero = $("#home");
if (!reduceMotion && matchMedia("(hover:hover)").matches) {
    hero.addEventListener("pointermove", e => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", e.clientX - r.left + "px");
        hero.style.setProperty("--my", e.clientY - r.top + "px");
    });
    /* Magnetic buttons */
    $$(".magnetic").forEach(b => {
        b.addEventListener("pointermove", e => {
            const r = b.getBoundingClientRect();
            b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .15}px,${(e.clientY - r.top - r.height / 2) * .25}px)`;
        });
        b.addEventListener("pointerleave", () => (b.style.transform = ""));
    });
}

/* Project expand/collapse */
$$(".project__head").forEach(btn => btn.addEventListener("click", () =>
    btn.setAttribute("aria-expanded", btn.getAttribute("aria-expanded") !== "true")));

/* Project filter */
const filterBtns = $$(".filters button"), items = $$(".project"), empty = $("#empty"), countEl = $("#filterCount");
const inCat = (p, f) => f === "all" || p.dataset.category.split(" ").includes(f);
filterBtns.forEach(b => b.insertAdjacentHTML("beforeend", `<sup>${items.filter(p => inCat(p, b.dataset.filter)).length}</sup>`));
function applyFilter(f) {
    let shown = 0;
    items.forEach(p => {
        const show = inCat(p, f);
        p.hidden = !show;
        if (!show) return;
        p.classList.add("is-in");               /* never leave a shown project invisible */
        p.style.transitionDelay = "0ms";
        $(".project__head", p).setAttribute("aria-expanded", "false");
        p.style.setProperty("--i", shown++);
        p.classList.remove("pop"); void p.offsetWidth; p.classList.add("pop");
    });
    countEl.textContent = `Showing ${shown} of ${items.length}`;
    empty.hidden = shown > 0;
}
filterBtns.forEach(btn => btn.addEventListener("click", () => {
    filterBtns.forEach(b => { b.classList.toggle("is-active", b === btn); b.setAttribute("aria-pressed", b === btn); });
    applyFilter(btn.dataset.filter);
    const top = $(".projects").getBoundingClientRect().top;       /* bring results into view */
    if (top > innerHeight * .7) scrollBy({ top: top - innerHeight * .45, behavior: reduceMotion ? "auto" : "smooth" });
}));
applyFilter("all");

/* Contact form: opens visitor's email app (static site, nothing is sent automatically).
   To use a form service later (e.g. Formspree), set the form's action and remove this handler. */
$("#contactForm").addEventListener("submit", e => {
    e.preventDefault();
    const f = e.target, d = new FormData(f);
    const body = `${d.get("message")}\n\n— ${d.get("name")} (${d.get("email")})`;
    location.href = `mailto:${f.dataset.email}?subject=${encodeURIComponent("Portfolio message from " + d.get("name"))}&body=${encodeURIComponent(body)}`;
});

/* Back to top */
$("#toTop").addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

/* ===== Liveliness ===== */
/* Hero name: letters rise in one by one */
if (!reduceMotion) {
    const h1 = $(".hero__name");
    h1.setAttribute("aria-label", h1.textContent.trim());
    let i = 0;
    (function wrap(node) {
        [...node.childNodes].forEach(n => {
            if (n.nodeType === 3 && n.textContent.trim()) {
                const f = document.createDocumentFragment();
                [...n.textContent].forEach(c => {
                    if (c === " ") return f.append(" ");
                    const sp = document.createElement("span");
                    sp.className = "ch"; sp.setAttribute("aria-hidden", "true");
                    sp.style.setProperty("--i", i++); sp.textContent = c; f.append(sp);
                });
                n.replaceWith(f);
            } else if (n.nodeType === 1 && n.tagName !== "BR") wrap(n);
        });
    })(h1);

    /* Rotating "currently building" word */
    const words = ["websites", "applications", "databases", "random projects"], rot = $("#rotator");
    let w = 0;
    setInterval(() => {
        rot.classList.add("is-out");
        setTimeout(() => { w = (w + 1) % words.length; rot.textContent = words[w]; rot.classList.remove("is-out"); }, 350);
    }, 2600);
}

/* Stagger siblings that reveal together */
const groups = new Map();
$$(".reveal").forEach(el => {
    const n = groups.get(el.parentElement) || 0;
    groups.set(el.parentElement, n + 1);
    el.style.transitionDelay = Math.min(n, 6) * 70 + "ms";
});

/* Count-up numbers (real counts read from the page) */
const targets = {
    "auto-projects": $$(".project").length,
    "auto-tech": $$(".skills .tags li").length
};
const statObserver = new IntersectionObserver((entries, o) => entries.forEach(en => {
    if (!en.isIntersecting) return;
    o.unobserve(en.target);
    $$("b", en.target).forEach(b => {
        const key = b.dataset.count, end = targets[key] ?? +key;
        if (reduceMotion) return (b.textContent = end);
        const t0 = performance.now();
        (function tick(t) {
            const p = Math.min((t - t0) / 900, 1);
            b.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
        })(t0);
    });
}), { threshold: .5 });
$$(".stats").forEach(el => statObserver.observe(el));

/* ===== Background: hero dot field (reacts to cursor) ===== */
(function () {
    const cv = document.createElement("canvas");
    cv.setAttribute("aria-hidden", "true");
    hero.prepend(cv);
    const ctx = cv.getContext("2d"), gap = 34;
    let w, h, mx = -999, my = -999, fade = 0, running = false, inside = false;
    function draw() {
        ctx.clearRect(0, 0, w, h);
        for (let x = gap / 2; x < w; x += gap) for (let y = gap / 2; y < h; y += gap) {
            const dx = x - mx, dy = y - my, d = Math.hypot(dx, dy) || 1, r = 170;
            const k = d < r ? (1 - d / r) * fade : 0;
            ctx.fillStyle = `rgba(244,244,242,${.1 + k * .8})`;
            ctx.beginPath();
            ctx.arc(x + dx / d * k * 10, y + dy / d * k * 10, 1 + k * 1.6, 0, 6.283);
            ctx.fill();
        }
    }
    function loop() {
        fade += ((inside ? 1 : 0) - fade) * .12;
        draw();
        if (inside || fade > .01) requestAnimationFrame(loop); else running = false;
    }
    function wake() { if (!reduceMotion && !running) { running = true; requestAnimationFrame(loop); } }
    hero.addEventListener("pointermove", e => {
        const r = hero.getBoundingClientRect();
        mx = e.clientX - r.left; my = e.clientY - r.top; inside = true; wake();
    });
    hero.addEventListener("pointerleave", () => { inside = false; wake(); });
    new ResizeObserver(() => {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        w = hero.clientWidth; h = hero.clientHeight;
        cv.width = w * dpr; cv.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
    }).observe(hero);
})();

/* ===== Background: skills band that moves with scroll ===== */
(function () {
    const track = $(".band__track");
    if (!track) return;
    track.append(...[...track.children].map(n => n.cloneNode(true)));
    track.append(...[...track.children].map(n => n.cloneNode(true)));
    if (reduceMotion) return;
    const move = () => { const half = track.scrollWidth / 4; track.style.transform = `translateX(${-((scrollY * .45) % half)}px)`; };
    addEventListener("scroll", move, { passive: true });
    move();
})();
