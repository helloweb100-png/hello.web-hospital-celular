/* ════════════════════════════════════════════════════════════════
   HOSPITAL CELULAR · app.js
   Vanilla JS, sin dependencias. Módulos independientes (si uno falla,
   los demás siguen funcionando).

   01 Núcleo (scroll suavizado, medición, bucle de animación)
   02 Loader · 03 Nav y menú · 04 Reveal y titulares · 05 Hero
   06 Campo de circuitos (canvas) · 07 Osciloscopio ECG
   08 Cinema (video expansivo) · 09 Triage · 10 Proceso
   11 Galería horizontal · 12 Juramento · 13 Parallax / Footer
   14 FAQ · 15 Formulario → WhatsApp · 16 Extras (cursor, magnético…)
═════════════════════════════════════════════════════════════════ */
(() => {
    'use strict';

    /* ───────────── CONFIGURACIÓN DEL NEGOCIO ───────────── */
    const WA_NUMBER = '5216641133380';          // +52 1 664 113 3380
    const waUrl = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

    /* ───────────── 01 · NÚCLEO ───────────── */
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const saveData = !!(navigator.connection && navigator.connection.saveData);
    const root = document.documentElement;

    const scrollSubs = [];   // (smoothY, trueY, vh, vw, dt)
    const tickers = [];      // (dt, now)
    const measurers = [];
    const Scroll = { y: 0, ty: 0 };

    const onScroll = (fn) => scrollSubs.push(fn);
    const onTick = (fn) => tickers.push(fn);
    const onMeasure = (fn) => { measurers.push(fn); fn(); };
    const measureAll = () => measurers.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;
    const safe = (name, fn) => { try { return fn(); } catch (e) { console.error(`[${name}]`, e); } };

    function startLoop() {
        let last = performance.now();
        const frame = (now) => {
            const dt = Math.min(.05, (now - last) / 1000);
            last = now;
            Scroll.ty = window.scrollY;
            // Suavizado con corrección por tiempo: da la sensación de "scroll lento y elegante"
            const k = reduceMotion ? 1 : 1 - Math.pow(1 - .085, dt * 60);
            Scroll.y += (Scroll.ty - Scroll.y) * k;
            if (Math.abs(Scroll.ty - Scroll.y) < .08) Scroll.y = Scroll.ty;
            const vh = window.innerHeight, vw = window.innerWidth;
            for (let i = 0; i < scrollSubs.length; i++) scrollSubs[i](Scroll.y, Scroll.ty, vh, vw, dt);
            for (let i = 0; i < tickers.length; i++) tickers[i](dt, now);
            requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
    }

    /* Enlaces a WhatsApp con mensaje prellenado */
    function initWhatsAppLinks() {
        $$('[data-wa]').forEach((a) => { a.href = waUrl(a.dataset.wa); });
    }

    /* ───────────── 02 · LOADER ───────────── */
    function initLoader() {
        return new Promise((resolve) => {
            const loader = $('#loader');
            const finish = () => { root.classList.add('is-ready'); resolve(); };
            if (!loader) return finish();

            const pctEl = $('[data-loader-pct]', loader);
            const barEl = $('[data-loader-bar]', loader);
            const statusEl = $('[data-loader-status]', loader);
            const messages = ['Encendiendo quirófano…', 'Calibrando instrumentos…', 'Esterilizando píxeles…', 'Cargando diagnóstico…', 'Todo listo, doctor.'];
            const MIN = reduceMotion ? 350 : 2600;
            const t0 = performance.now();
            let pageLoaded = document.readyState === 'complete';
            let fontsOk = !document.fonts;
            let shown = 0, lastMsg = -1;

            document.body.classList.add('is-locked');
            window.addEventListener('load', () => { pageLoaded = true; }, { once: true });
            if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fontsOk = true; }).catch(() => { fontsOk = true; });
            setTimeout(() => { pageLoaded = true; fontsOk = true; }, 6500); // plan B: nunca atorarse

            const step = (now) => {
                const timeP = clamp((now - t0) / MIN);
                const cap = pageLoaded && fontsOk ? 1 : .9;
                const target = Math.min(easeOutExpo(timeP) * .55 + timeP * .45, cap);
                shown = lerp(shown, target, .12);
                if (target >= 1 && shown > .995) shown = 1;
                const pct = Math.floor(shown * 100);
                if (pctEl) pctEl.textContent = pct;
                if (barEl) barEl.style.transform = `scaleX(${shown})`;
                const mi = Math.min(messages.length - 1, Math.floor(shown * messages.length));
                if (statusEl && mi !== lastMsg) { statusEl.textContent = messages[mi]; lastMsg = mi; }

                if (shown < 1) return requestAnimationFrame(step);

                loader.classList.add('is-done');
                setTimeout(finish, 520);                       // el hero entra mientras abren las puertas
                setTimeout(() => {
                    loader.classList.add('is-gone');
                    document.body.classList.remove('is-locked');
                }, 1700);
            };
            requestAnimationFrame(step);
        });
    }

    /* ───────────── 03 · NAV Y MENÚ ───────────── */
    function initNav() {
        const nav = $('#nav');
        const burger = $('#burger');
        const menu = $('#menu');
        if (!nav) return;
        let menuOpen = false, lastY = 0;

        onScroll((y, ty) => {
            nav.classList.toggle('is-scrolled', ty > 24);
            const diff = ty - lastY;
            if (Math.abs(diff) > 6) {
                nav.classList.toggle('is-hidden', diff > 0 && ty > 520 && !menuOpen);
                lastY = ty;
            }
        });

        // Enlace activo según la sección visible
        const links = $$('[data-nav]');
        const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach((s) => io.observe(s));

        if (!burger || !menu) return;
        $$('.menu__link', menu).forEach((a, i) => a.style.setProperty('--i', i));
        const setMenu = (open) => {
            menuOpen = open;
            menu.classList.toggle('is-open', open);
            menu.setAttribute('aria-hidden', String(!open));
            burger.setAttribute('aria-expanded', String(open));
            burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
            nav.classList.toggle('is-menu', open);
            nav.classList.remove('is-hidden');
            document.body.classList.toggle('is-locked', open);
        };
        burger.addEventListener('click', () => setMenu(!menuOpen));
        $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
        matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches && menuOpen) setMenu(false); });
    }

    /* ───────────── 04 · REVEAL Y TITULARES ───────────── */
    function splitWords(el) {
        const text = el.textContent.trim().replace(/\s+/g, ' ');
        el.setAttribute('aria-label', text);
        el.textContent = '';
        const words = text.split(' ');
        words.forEach((word, i) => {
            const w = document.createElement('span');
            w.className = 'w';
            w.setAttribute('aria-hidden', 'true');
            const inner = document.createElement('span');
            inner.className = 'w__i';
            inner.style.setProperty('--wi', i);
            inner.textContent = word;
            w.appendChild(inner);
            el.appendChild(w);
            if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
        });
    }

    function initReveal() {
        $$('[data-split]').forEach(splitWords);
        const targets = $$('[data-reveal], [data-split]');
        if (reduceMotion || !('IntersectionObserver' in window)) {
            targets.forEach((el) => el.classList.add('is-in'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                e.target.classList.add('is-in');
                io.unobserve(e.target);
            });
        }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
        targets.forEach((el) => io.observe(el));
    }

    /* Contadores animados */
    function initCounters() {
        const els = $$('[data-count]');
        if (!els.length) return;
        const run = (el) => {
            const target = Number(el.dataset.count) || 0;
            if (reduceMotion) { el.textContent = target; return; }
            const dur = 1900, t0 = performance.now();
            const tick = (now) => {
                const p = clamp((now - t0) / dur);
                el.textContent = Math.round(easeOutExpo(p) * target);
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
        }, { threshold: .6 });
        els.forEach((el) => io.observe(el));
    }

    /* ───────────── 05 · HERO ───────────── */
    function ecgPath(w, h, beat) {
        const m = h * .6;
        let d = `M0 ${m}`;
        for (let x0 = 0; x0 < w + beat; x0 += beat) {
            const X = (f) => (x0 + beat * f).toFixed(1);
            const Y = (f) => (m + h * f).toFixed(1);
            d += ` L${X(.28)} ${Y(0)} Q${X(.33)} ${Y(-.16)} ${X(.38)} ${Y(0)}`;
            d += ` L${X(.45)} ${Y(0)} L${X(.47)} ${Y(.08)} L${X(.51)} ${Y(-.52)} L${X(.56)} ${Y(.36)} L${X(.59)} ${Y(0)}`;
            d += ` L${X(.68)} ${Y(0)} Q${X(.75)} ${Y(-.22)} ${X(.84)} ${Y(0)} L${X(1)} ${Y(0)}`;
        }
        return d;
    }

    function initHero() {
        const hero = $('#inicio');
        if (!hero) return;

        // Banda de ECG a todo el ancho (se reconstruye al cambiar el tamaño)
        const svg = $('[data-ecg-band]', hero);
        if (svg) {
            const build = () => {
                const w = Math.round(hero.clientWidth), h = 120;
                svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
                const d = ecgPath(w, h, w < 700 ? 230 : 320);
                $$('[data-ecg-path]', svg).forEach((p) => p.setAttribute('d', d));
            };
            build();
            let t;
            window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(build, 200); });
        }

        // Palabra rotatoria ("Reparamos celulares / computadoras / …") con bucle sin saltos
        const rot = $('[data-rotator]', hero);
        if (rot && !reduceMotion) {
            const items = $$('b', rot);
            rot.appendChild(items[0].cloneNode(true));
            let i = 0;
            setInterval(() => {
                i += 1;
                rot.style.setProperty('--ri', i);
                if (i === items.length) {
                    setTimeout(() => {
                        $$('b', rot).forEach((b) => { b.style.transition = 'none'; });
                        i = 0;
                        rot.style.setProperty('--ri', 0);
                        void rot.offsetWidth;
                        $$('b', rot).forEach((b) => { b.style.transition = ''; });
                    }, 820);
                }
            }, 2300);
        }

        // Pulso del "paciente"
        const bpm = $('[data-bpm]', hero);
        if (bpm && !reduceMotion) setInterval(() => { bpm.textContent = 68 + Math.floor(Math.random() * 9); }, 1100);

        // Inclinación 3D del escáner siguiendo el cursor
        const scanner = $('[data-tilt]', hero);
        if (scanner && finePointer && !reduceMotion) {
            const cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 };
            hero.addEventListener('pointermove', (e) => {
                const r = hero.getBoundingClientRect();
                tgt.x = ((e.clientX - r.left) / r.width - .5);
                tgt.y = ((e.clientY - r.top) / r.height - .5);
            }, { passive: true });
            hero.addEventListener('pointerleave', () => { tgt.x = 0; tgt.y = 0; });
            onTick((dt) => {
                cur.x = lerp(cur.x, tgt.x, Math.min(1, dt * 4));
                cur.y = lerp(cur.y, tgt.y, Math.min(1, dt * 4));
                scanner.style.transform = `rotateY(${(cur.x * 16).toFixed(2)}deg) rotateX(${(-cur.y * 12).toFixed(2)}deg)`;
            });
        }
    }

    /* ───────────── 06 · CAMPO DE CIRCUITOS (canvas) ───────────── */
    const mulberry32 = (a) => () => {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    class CircuitField {
        constructor(host, { listen = host, seed = 7 } = {}) {
            this.host = host;
            this.cBase = $('[data-circuit="base"]', host);
            this.cLit = $('[data-circuit="lit"]', host);
            this.cPulse = $('[data-circuit="pulse"]', host);
            if (!this.cBase || !this.cLit || !this.cPulse) return;
            this.seed = seed;
            this.dpr = Math.min(window.devicePixelRatio || 1, 1.6);
            this.ctx = this.cPulse.getContext('2d');
            this.mouse = { x: 0, y: 0, tx: 0, ty: 0, active: false };
            this.visible = false;
            this.ready = false;
            this.acc = 0;
            this.resize();

            let t;
            new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => this.resize(), 160); }).observe(host);
            new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }).observe(host);
            listen.addEventListener('pointermove', (e) => {
                const r = host.getBoundingClientRect();
                this.mouse.tx = e.clientX - r.left;
                this.mouse.ty = e.clientY - r.top;
                this.mouse.active = true;
            }, { passive: true });
            listen.addEventListener('pointerleave', () => { this.mouse.active = false; });
            onTick((dt) => this.frame(dt));
        }

        resize() {
            const r = this.host.getBoundingClientRect();
            const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
            if (w === this.w && h === this.h) return;
            this.w = w; this.h = h;
            [this.cBase, this.cLit, this.cPulse].forEach((c) => {
                c.width = Math.round(w * this.dpr);
                c.height = Math.round(h * this.dpr);
            });
            this.build();
            this.drawStatic();
            this.ready = true;
        }

        build() {
            const rnd = (this.rnd = mulberry32(this.seed));
            const { w, h } = this;
            const small = w < 700;
            const cell = small ? 30 : 40;
            const count = Math.round((w * h) / (small ? 15000 : 17000));
            const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
            this.paths = [];
            this.chips = [];
            for (let i = 0; i < count; i++) {
                let x = Math.round((rnd() * w) / cell) * cell;
                let y = Math.round((rnd() * h) / cell) * cell;
                let d = (rnd() * 8) | 0;
                if (rnd() < .6) d &= ~1;                      // preferencia por ejes: se ve como placa real
                const pts = [{ x, y }];
                const steps = 3 + ((rnd() * 6) | 0);
                for (let s = 0; s < steps; s++) {
                    const len = 2 + ((rnd() * 5) | 0);
                    x += dirs[d][0] * len * cell;
                    y += dirs[d][1] * len * cell;
                    pts.push({ x, y });
                    d = (d + (rnd() < .5 ? 1 : 7)) % 8;       // giros de 45°
                    if (rnd() < .22) d = (d + (rnd() < .5 ? 1 : 7)) % 8;
                    if (x < -cell * 3 || x > w + cell * 3 || y < -cell * 3 || y > h + cell * 3) break;
                }
                const lens = [0];
                for (let k = 1; k < pts.length; k++) lens.push(lens[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
                const total = lens[lens.length - 1];
                if (total > cell * 3) this.paths.push({ pts, lens, total });
            }
            const chipCount = small ? 3 : 7;
            for (let i = 0; i < chipCount; i++) {
                const size = (small ? 38 : 50) + ((rnd() * 40) | 0);
                this.chips.push({ x: rnd() * (w - size), y: rnd() * (h - size), s: size });
            }
            const n = reduceMotion ? 0 : Math.min(26, Math.max(7, Math.round(this.paths.length * .35)));
            this.pulses = Array.from({ length: n }, () => this.spawn(true));
        }

        spawn(initial = false) {
            const rnd = this.rnd;
            const p = this.paths[(rnd() * this.paths.length) | 0];
            const roll = rnd();
            return {
                p,
                s: initial ? rnd() * p.total : -rnd() * 160,
                v: 90 + rnd() * 170,
                tail: 50 + rnd() * 80,
                c: roll < .15 ? '255,77,79' : roll < .24 ? '255,200,61' : '59,232,240',
            };
        }

        drawLayer(canvas, { stroke, lineW, glow, dotAlpha }) {
            const ctx = canvas.getContext('2d');
            ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            ctx.clearRect(0, 0, this.w, this.h);
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.strokeStyle = stroke;
            ctx.lineWidth = lineW;
            if (glow) { ctx.shadowColor = 'rgba(59,232,240,.9)'; ctx.shadowBlur = glow; }
            this.paths.forEach(({ pts }) => {
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
                ctx.stroke();
            });
            // vías (puntos de soldadura) en los extremos
            ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(59,232,240,${dotAlpha})`;
            this.paths.forEach(({ pts }) => {
                [pts[0], pts[pts.length - 1]].forEach((p) => {
                    ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2); ctx.stroke();
                    ctx.beginPath(); ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2); ctx.fill();
                });
            });
            // chips (circuitos integrados con patitas)
            this.chips.forEach(({ x, y, s }) => {
                ctx.strokeRect(x, y, s, s);
                ctx.strokeRect(x + s * .22, y + s * .22, s * .56, s * .56);
                ctx.beginPath();
                const pins = 5;
                for (let i = 0; i < pins; i++) {
                    const o = s * ((i + 1) / (pins + 1));
                    ctx.moveTo(x + o, y); ctx.lineTo(x + o, y - 7);
                    ctx.moveTo(x + o, y + s); ctx.lineTo(x + o, y + s + 7);
                    ctx.moveTo(x, y + o); ctx.lineTo(x - 7, y + o);
                    ctx.moveTo(x + s, y + o); ctx.lineTo(x + s + 7, y + o);
                }
                ctx.stroke();
            });
        }

        drawStatic() {
            this.drawLayer(this.cBase, { stroke: 'rgba(59,232,240,.2)', lineW: 1, glow: 0, dotAlpha: .35 });
            this.drawLayer(this.cLit, { stroke: 'rgba(120,245,250,.95)', lineW: 1.4, glow: 10, dotAlpha: .95 });
        }

        pointAt(path, s, out) {
            const { pts, lens } = path;
            s = clamp(s, 0, path.total);
            let i = 1;
            while (i < lens.length - 1 && lens[i] < s) i++;
            const seg = lens[i] - lens[i - 1] || 1;
            const t = (s - lens[i - 1]) / seg;
            out.x = lerp(pts[i - 1].x, pts[i].x, t);
            out.y = lerp(pts[i - 1].y, pts[i].y, t);
            return out;
        }

        frame(dt) {
            if (!this.visible || !this.ready) return;
            const t = performance.now() / 1000, m = this.mouse;
            if (!m.active) { // sin cursor (móvil): la luz recorre la placa sola
                m.tx = this.w * (.5 + .32 * Math.cos(t * .22));
                m.ty = this.h * (.42 + .24 * Math.sin(t * .3));
            }
            m.x = lerp(m.x, m.tx, Math.min(1, dt * 3));
            m.y = lerp(m.y, m.ty, Math.min(1, dt * 3));
            this.acc += dt;
            if (this.acc > 1 / 30) { // la máscara se actualiza a ~30 fps para cuidar batería
                this.acc = 0;
                this.cLit.style.setProperty('--mx', `${m.x.toFixed(1)}px`);
                this.cLit.style.setProperty('--my', `${m.y.toFixed(1)}px`);
            }
            if (reduceMotion) return;

            const ctx = this.ctx;
            ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            ctx.clearRect(0, 0, this.w, this.h);
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';
            const a = { x: 0, y: 0 }, b = { x: 0, y: 0 };
            for (let i = 0; i < this.pulses.length; i++) {
                const pu = this.pulses[i];
                pu.s += pu.v * dt;
                if (pu.s - pu.tail > pu.p.total) { this.pulses[i] = this.spawn(); continue; }
                const segs = 8;
                for (let k = 0; k < segs; k++) {
                    const s0 = pu.s - pu.tail * (1 - k / segs);
                    const s1 = pu.s - pu.tail * (1 - (k + 1) / segs);
                    if (s1 < 0 || s0 > pu.p.total) continue;
                    this.pointAt(pu.p, s0, a); this.pointAt(pu.p, s1, b);
                    ctx.strokeStyle = `rgba(${pu.c},${(((k + 1) / segs) * .85).toFixed(2)})`;
                    ctx.lineWidth = 1.2 + (k / segs) * 1.4;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                }
                if (pu.s >= 0 && pu.s <= pu.p.total) {
                    this.pointAt(pu.p, pu.s, a);
                    const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, 11);
                    g.addColorStop(0, `rgba(${pu.c},.95)`);
                    g.addColorStop(1, `rgba(${pu.c},0)`);
                    ctx.fillStyle = g;
                    ctx.beginPath(); ctx.arc(a.x, a.y, 11, 0, Math.PI * 2); ctx.fill();
                }
            }
            ctx.globalCompositeOperation = 'source-over';
        }
    }

    function initCircuits() {
        const hero = $('#inicio');
        const heroBg = hero && $('.hero__bg', hero);
        if (heroBg) new CircuitField(heroBg, { listen: hero, seed: 11 });
        const finale = $('#contacto');
        const finaleBg = finale && $('.finale__bg', finale);
        if (finaleBg) new CircuitField(finaleBg, { listen: finale, seed: 29 });
    }

    /* ───────────── 07 · OSCILOSCOPIO ECG (canvas) ───────────── */
    class EcgScope {
        constructor(canvas, { speed = 150, line = '59,232,240', height = 1 } = {}) {
            this.c = canvas;
            this.ctx = canvas.getContext('2d');
            this.speed = speed;
            this.line = line;
            this.health = 0;
            this.target = 0;
            this.phase = 0;
            this.i = 0;
            this.visible = false;
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.resize();
            let t;
            new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => this.resize(), 120); }).observe(canvas);
            new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }).observe(canvas);
            onTick((dt) => this.frame(dt));
        }

        resize() {
            const r = this.c.getBoundingClientRect();
            const w = Math.max(40, Math.round(r.width)), h = Math.max(30, Math.round(r.height));
            if (w === this.w && h === this.h) return;
            this.w = w; this.h = h;
            this.c.width = Math.round(w * this.dpr);
            this.c.height = Math.round(h * this.dpr);
            this.values = new Float32Array(w).fill(NaN);
            this.i = 0;
        }

        set(health) { this.target = clamp(health); }

        wave(p) {
            const g = (c, s, a) => a * Math.exp(-((p - c) ** 2) / (2 * s * s));
            const h = this.health;
            let v = g(.18, .035, .12 * h + .02) - g(.285, .011, .16 * h) + g(.31, .013, 1.05 * h) - g(.34, .014, .3 * h) + g(.55, .06, .3 * h + .04);
            v += (Math.random() - .5) * (1 - h) * .07;   // ruido cuando el "paciente" está débil
            return v;
        }

        frame(dt) {
            if (!this.visible || !this.values) return;
            this.health += (this.target - this.health) * Math.min(1, dt * 2.2);
            const hz = lerp(.55, 1.25, this.health) * (this.health < .5 ? .85 + Math.random() * .3 : 1);
            const n = Math.max(1, Math.round(this.speed * dt));
            const gap = 14;
            for (let k = 0; k < n; k++) {
                this.phase = (this.phase + (hz * dt) / n) % 1;
                this.values[this.i] = this.wave(this.phase);
                this.i = (this.i + 1) % this.w;
                for (let g = 0; g < gap; g++) this.values[(this.i + g) % this.w] = NaN;
            }
            const ctx = this.ctx, { w, h } = this;
            ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.strokeStyle = `rgba(${this.line},.95)`;
            ctx.shadowColor = `rgba(${this.line},.9)`;
            ctx.shadowBlur = 8;
            const mid = h * .62, amp = h * .52;
            ctx.beginPath();
            let pen = false;
            for (let x = 0; x < w; x++) {
                const v = this.values[x];
                if (Number.isNaN(v)) { pen = false; continue; }
                const y = mid - v * amp;
                if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    /* ───────────── 08 · CINEMA (video que se expande) ───────────── */
    function initCinema() {
        const sec = $('[data-cinema]');
        if (!sec) return;
        const frame = $('[data-cinema-frame]', sec);
        const video = $('[data-cinema-video]', sec);
        const caption = $('[data-cinema-caption]', sec);
        const controls = $('.cinema__controls', sec);
        const tl = $('.cinema__t--l', sec), tr = $('.cinema__t--r', sec);
        const btnPlay = $('[data-cinema-play]', sec), btnMute = $('[data-cinema-mute]', sec);
        const m = { top: 0, h: 0, nav: 68 };
        onMeasure(() => {
            m.top = docTop(sec); m.h = sec.offsetHeight;
            m.nav = parseFloat(getComputedStyle(root).getPropertyValue('--nav-h')) || 68;
        });

        // Carga diferida del video (pesa ~1.7 MB): solo cuando la sección se acerca
        let loaded = false, inView = false, userPaused = false;
        const load = () => {
            if (loaded || !video.dataset.src || saveData) return;
            loaded = true;
            video.src = video.dataset.src;
            video.load();
        };
        const sync = () => {
            if (!loaded) return;
            if (inView && !userPaused && !reduceMotion) video.play().catch(() => {});
            else video.pause();
        };
        new IntersectionObserver(([e]) => { if (e.isIntersecting) load(); }, { rootMargin: '120% 0px' }).observe(sec);
        new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }, { threshold: .05 }).observe(sec);

        const setIcon = (btn, id) => { const use = $('use', btn); if (use) use.setAttribute('href', id); };
        if (btnPlay) btnPlay.addEventListener('click', () => {
            load();
            if (video.paused) {
                userPaused = false; video.play().catch(() => {});
                setIcon(btnPlay, '#i-pause'); btnPlay.setAttribute('aria-label', 'Pausar video');
            } else {
                userPaused = true; video.pause();
                setIcon(btnPlay, '#i-play'); btnPlay.setAttribute('aria-label', 'Reproducir video');
            }
        });
        if (btnMute) btnMute.addEventListener('click', () => {
            video.muted = !video.muted;
            setIcon(btnMute, video.muted ? '#i-volume-off' : '#i-volume');
            btnMute.setAttribute('aria-label', video.muted ? 'Activar sonido' : 'Silenciar video');
        });
        if (reduceMotion) { setIcon(btnPlay, '#i-play'); btnPlay.setAttribute('aria-label', 'Reproducir video'); return; }

        let lastP = -1;
        onScroll((y, ty, vh, vw) => {
            if (y + vh < m.top - 50 || y > m.top + m.h + 50) return;
            const p = clamp((y - m.top) / (m.h - vh));
            if (Math.abs(p - lastP) < .0003) return;
            lastP = p;
            const e = easeInOut(clamp(p / .68));
            // Marco inicial: 16:9 en escritorio (sin invadir los títulos), más alto en móvil
            const small = vw < 700;
            const w0 = small ? vw * .86 : Math.min(vw * .72, 880, vh * .46 * 16 / 9);
            const h0 = small ? Math.min(vh * .5, w0 * 1.15) : w0 * 9 / 16;
            const top0 = (vh - h0) / 2;
            // Estado final: pantalla completa en escritorio; tarjeta alta en móvil (el texto queda debajo)
            const topEnd = small ? m.nav + 8 : 0;
            const botEnd = small ? vh - topEnd - Math.min(vw * 1.1, vh * .54) : 0;
            frame.style.setProperty('--cx', `${(((vw - w0) / 2) * (1 - e)).toFixed(1)}px`);
            frame.style.setProperty('--ct', `${lerp(top0, topEnd, e).toFixed(1)}px`);
            frame.style.setProperty('--cb', `${lerp(top0, botEnd, e).toFixed(1)}px`);
            frame.style.setProperty('--cr', `${lerp(28, small ? 24 : 0, e).toFixed(1)}px`);
            frame.style.setProperty('--cs', (lerp(1.28, 1, e)).toFixed(4));
            const co = clamp((p - .74) / .18);
            sec.style.setProperty('--co', co.toFixed(3));
            const open = co > .5;
            caption.classList.toggle('is-open', open);
            controls.classList.toggle('is-open', open);
            const out = clamp(p / .5);
            tl.style.transform = `translate3d(0, ${(-out * vh * .34).toFixed(1)}px, 0) scale(${(1 + out * .12).toFixed(3)})`;
            tr.style.transform = `translate3d(0, ${(out * vh * .34).toFixed(1)}px, 0) scale(${(1 + out * .12).toFixed(3)})`;
            tl.style.opacity = tr.style.opacity = (1 - clamp(out * 1.5)).toFixed(3);
        });
    }

    /* ───────────── 09 · TRIAGE ───────────── */
    const SYMPTOMS = {
        screen: { title: 'Pantalla o display dañado', level: 2, ask: 'pantalla rota o sin imagen', text: 'Lo más común es daño en el cristal, el táctil o el panel completo. Con una revisión te decimos cuál es tu caso y cuánto cuesta, antes de reparar.', checks: ['Estado del cristal y del táctil', 'Display: líneas, manchas o imagen negra', 'Flexores y conectores internos'] },
        charge: { title: 'Problema de carga', level: 2, ask: 'no carga', text: 'Suele ser el puerto de carga sucio o dañado, el cable o la batería. Es de las fallas más comunes y casi siempre tiene solución.', checks: ['Puerto de carga: limpieza y desgaste', 'Cable y cargador', 'Batería y circuito de carga'] },
        water: { title: 'Daño por humedad', level: 3, ask: 'se mojó', text: 'Apágalo ya y no lo cargues. Sécalo por fuera y tráelo cuanto antes: la humedad avanza y daña la placa. Evita el arroz, no ayuda.', checks: ['Limpieza de placa y conectores', 'Revisión de corrosión', 'Pruebas de carga, pantalla y audio'] },
        power: { title: 'El equipo no enciende', level: 3, ask: 'no enciende', text: 'Puede ser la batería, el puerto de carga, el software o la placa. Descartamos causas en orden, de la más simple a la más compleja.', checks: ['Batería y carga', 'Software y modo de recuperación', 'Placa y componentes de alimentación'] },
        battery: { title: 'Batería desgastada', level: 1, ask: 'la batería dura muy poco', text: 'Una batería gastada es normal con el tiempo. Cambiarla devuelve horas de uso. A veces también hay apps o ajustes que consumen de más.', checks: ['Salud y capacidad de la batería', 'Consumo anormal por software', 'Cambio de batería, si hace falta'] },
        slow: { title: 'Lentitud o software', level: 1, ask: 'va lento o tiene virus', text: 'Muchas veces se arregla con limpieza, actualización o restauración. En computadoras también ayuda un disco SSD o más memoria.', checks: ['Limpieza de archivos y malware', 'Actualizaciones y restauración', 'Opciones de mejora de hardware'] },
        parts: { title: 'Falla de cámara, bocina o micrófono', level: 2, ask: 'falla de cámara, bocina o micrófono', text: 'Puede ser un módulo dañado, suciedad o un conector flojo. Probamos cada componente por separado para cambiar solo lo necesario.', checks: ['Prueba de cada módulo', 'Limpieza de entradas y conectores', 'Cambio del módulo dañado'] },
        locked: { title: 'Equipo bloqueado', level: 2, ask: 'está bloqueado o olvidé la clave', text: 'Te orientamos según el modelo y el tipo de bloqueo. Por seguridad, pedimos comprobar que el equipo es tuyo antes de desbloquearlo.', checks: ['Tipo de bloqueo: clave, cuenta o compañía', 'Verificación de propiedad', 'Método de desbloqueo disponible'] },
    };
    const URGENCY = ['', 'Leve', 'Moderado', 'Urgente'];

    function initTriage() {
        const panel = $('#triage');
        if (!panel) return;
        const result = $('[data-result]', panel);
        const empty = $('[data-result-empty]', panel);
        const body = $('[data-result-body]', panel);
        const title = $('[data-result-title]', panel);
        const text = $('[data-result-text]', panel);
        const checks = $('[data-result-checks]', panel);
        const cta = $('[data-result-cta]', panel);
        const urgency = $('[data-result-urgency]', panel);
        const urgencyLabel = $('[data-result-urgency-label]', panel);
        const ecgCanvas = $('[data-result-ecg]', panel);
        let scope = null;

        const render = (userAction) => {
            const symptom = ($('input[name="symptom"]:checked', panel) || {}).value;
            const device = ($('input[name="device"]:checked', panel) || {}).value || 'Celular';
            const data = SYMPTOMS[symptom];
            if (!data) return;
            empty.hidden = true;
            body.hidden = false;
            result.classList.add('is-ready');
            title.textContent = data.title;
            text.textContent = data.text;
            urgency.dataset.level = data.level;
            urgencyLabel.textContent = URGENCY[data.level];
            checks.innerHTML = '';
            data.checks.forEach((c) => {
                const li = document.createElement('li');
                li.innerHTML = '<svg class="ico"><use href="#i-check"/></svg><span></span>';
                li.lastChild.textContent = c;
                checks.appendChild(li);
            });
            cta.href = waUrl(`Hola Hospital Celular, mi equipo es: ${device}. Síntoma: ${data.ask}. Quiero que lo revisen, por favor.`);
            if (!scope) scope = new EcgScope(ecgCanvas, { speed: 130, line: data.level === 3 ? '255,90,92' : data.level === 2 ? '255,200,61' : '59,232,240' });
            scope.line = data.level === 3 ? '255,90,92' : data.level === 2 ? '255,200,61' : '59,232,240';
            scope.set(data.level === 1 ? .8 : data.level === 2 ? .5 : .22);
            // Si el resultado queda fuera de pantalla (móvil), lo traemos a la vista suavemente
            if (userAction) {
                const r = result.getBoundingClientRect();
                if (r.bottom > innerHeight - 20) window.scrollBy({ top: r.bottom - innerHeight + 80, behavior: 'smooth' });
            }
        };
        panel.addEventListener('change', (e) => render(e.target.name === 'symptom'));
    }

    /* ───────────── 10 · PROCESO (monitor de signos vitales) ───────────── */
    function initProcess() {
        const sec = $('[data-process]');
        if (!sec) return;
        const monitor = $('[data-monitor]', sec);
        const steps = $$('.pstep', sec);
        const list = $('.process__steps', sec);
        const stateEl = $('[data-monitor-state]', sec);
        const bpmEl = $('[data-monitor-bpm]', sec);
        const pctEl = $('[data-monitor-pct]', sec);
        const bar = $('[data-monitor-bar]', sec);
        const scope = new EcgScope($('[data-monitor-ecg]', sec), { speed: 120 });
        const STAGES = [
            { label: 'Ingreso', health: .06, bpm: 0, pct: 10 },
            { label: 'Diagnóstico', health: .38, bpm: 48, pct: 40 },
            { label: 'Cirugía', health: .68, bpm: 66, pct: 75 },
            { label: 'Alta médica', health: 1, bpm: 78, pct: 100 },
        ];
        let current = -1, bpmShown = 0, bpmTarget = 0;
        const setStage = (i) => {
            if (i === current) return;
            current = i;
            const s = STAGES[i];
            monitor.dataset.stage = i;
            stateEl.textContent = s.label;
            scope.set(s.health);
            bpmTarget = s.bpm;
            pctEl.textContent = s.pct;
            bar.style.transform = `scaleX(${s.pct / 100})`;
            steps.forEach((st, k) => {
                st.classList.toggle('is-active', k === i);
                st.classList.toggle('is-done', k < i);
            });
        };
        setStage(0);
        onTick((dt) => {
            if (Math.abs(bpmShown - bpmTarget) > .5) { bpmShown = lerp(bpmShown, bpmTarget, Math.min(1, dt * 2.5)); bpmEl.textContent = Math.round(bpmShown); }
        });

        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) setStage(steps.indexOf(e.target)); });
        }, { rootMargin: '-42% 0px -42% 0px' });
        steps.forEach((s) => io.observe(s));

        // Línea de progreso que "dibuja" el recorrido
        const m = { top: 0, h: 1 };
        onMeasure(() => { m.top = docTop(list); m.h = list.offsetHeight; });
        onScroll((y, ty, vh) => {
            if (y + vh < m.top - 100 || y > m.top + m.h + 100) return;
            list.style.setProperty('--pp', clamp((y + vh * .5 - m.top) / m.h).toFixed(4));
        });
    }

    /* ───────────── 11 · GALERÍA HORIZONTAL FIJADA ───────────── */
    function initShelf() {
        const sec = $('[data-shelf]');
        if (!sec) return;
        if (reduceMotion) { sec.classList.add('shelf--static'); return; }
        const track = $('[data-shelf-track]', sec);
        const bar = $('[data-shelf-bar]', sec);
        const cards = $$('.pcard', track);
        const imgs = cards.map((c) => $('.pcard__img img', c));
        const m = { top: 0, maxX: 0, travel: 1, offs: [], widths: [] };

        onMeasure(() => {
            const vw = window.innerWidth, vh = window.innerHeight;
            m.maxX = Math.max(0, track.scrollWidth - vw);
            m.travel = Math.max(1, m.maxX * 1.1);
            const h = Math.round(vh + m.travel + vh * .25);
            if (sec.offsetHeight !== h) sec.style.height = `${h}px`;
            m.top = docTop(sec);
            m.offs = cards.map((c) => c.offsetLeft);
            m.widths = cards.map((c) => c.offsetWidth);
        });

        let lastX = -1;
        onScroll((y, ty, vh, vw) => {
            if (y + vh < m.top - 50 || y > m.top + sec.offsetHeight + 50) return;
            const p = clamp((y - m.top) / m.travel);
            const x = p * m.maxX;
            if (Math.abs(x - lastX) < .05) return;
            lastX = x;
            track.style.transform = `translate3d(${(-x).toFixed(2)}px, 0, 0)`;
            bar.style.transform = `scaleX(${p.toFixed(4)})`;
            for (let i = 0; i < cards.length; i++) {
                if (!imgs[i]) continue;
                const center = m.offs[i] + m.widths[i] / 2 - x;
                const rel = clamp((center - vw / 2) / vw, -1, 1);
                imgs[i].style.setProperty('--px', `${(rel * -34).toFixed(1)}px`);
            }
        });
    }

    /* ───────────── 12 · JURAMENTO (texto que se ilumina) ───────────── */
    function initOath() {
        const sec = $('[data-oath]');
        if (!sec) return;
        const textEl = $('[data-oath-text]', sec);
        const foot = $('[data-oath-foot]', sec);
        const original = textEl.textContent.trim().replace(/\s+/g, ' ');
        textEl.setAttribute('aria-label', original);
        textEl.textContent = '';
        const keys = /^(avisarte|claros|información|fotos|frente)/i;
        const words = original.split(' ').map((w, i, arr) => {
            const s = document.createElement('span');
            s.className = 'ow' + (keys.test(w) ? ' ow--key' : '');
            s.textContent = w;
            textEl.appendChild(s);
            if (i < arr.length - 1) textEl.appendChild(document.createTextNode(' '));
            return s;
        });
        if (reduceMotion) return;
        const m = { top: 0, h: 1 };
        onMeasure(() => { m.top = docTop(sec); m.h = sec.offsetHeight; });
        const cache = new Float32Array(words.length).fill(-1);
        let lastFo = -1;
        onScroll((y, ty, vh) => {
            if (y + vh < m.top - 50 || y > m.top + m.h + 50) return;
            const p = clamp((y - m.top) / (m.h - vh));
            const lit = (p / .78) * words.length;
            for (let i = 0; i < words.length; i++) {
                const o = +(.14 + .86 * clamp(lit - i)).toFixed(2);
                if (o !== cache[i]) { cache[i] = o; words[i].style.opacity = o; }
            }
            const fo = +clamp((p - .8) / .15).toFixed(3);
            if (fo !== lastFo) {
                lastFo = fo;
                foot.style.setProperty('--fo', fo);
                foot.classList.toggle('is-open', fo > .5);
            }
        });
    }

    /* ───────────── 13 · PARALLAX, FOOTER Y PROGRESO ───────────── */
    function initParallax() {
        $$('[data-parallax-wrap]').forEach((wrap) => {
            const img = $('[data-parallax]', wrap);
            if (!img || reduceMotion) return;
            const m = { top: 0, h: 1 };
            onMeasure(() => { m.top = docTop(wrap); m.h = wrap.offsetHeight; });
            onScroll((y, ty, vh) => {
                if (y + vh < m.top - 100 || y > m.top + m.h + 100) return;
                const rel = clamp((m.top + m.h / 2 - y - vh / 2) / (vh / 2 + m.h / 2), -1, 1);
                img.style.transform = `translate3d(0, ${(rel * -m.h * .08).toFixed(1)}px, 0)`;
            });
        });

        // Wordmark gigante del footer que se "llena" al llegar
        const giant = $('[data-giant]');
        if (giant) {
            const m = { top: 0, doc: 1 };
            onMeasure(() => { m.top = docTop(giant); m.doc = document.documentElement.scrollHeight; });
            onScroll((y, ty, vh) => {
                if (y + vh < m.top - 50) return;
                // 0 cuando asoma por abajo → 100 al llegar al final de la página
                const p = clamp((y + vh - m.top) / Math.max(1, m.doc - m.top));
                giant.style.setProperty('--gp', `${(reduceMotion ? 100 : p * 100).toFixed(1)}%`);
            });
        }
    }

    function initProgress() {
        const bar = $('[data-progress]');
        if (!bar) return;
        onScroll((y, ty) => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.transform = `scaleX(${max > 0 ? clamp(ty / max).toFixed(4) : 0})`;
        });
    }

    /* ───────────── 14 · FAQ ───────────── */
    function initFaq() {
        const list = $('[data-faq]');
        if (!list) return;
        const items = $$('.faq__item', list);
        items.forEach((item) => {
            const btn = $('.faq__q', item);
            btn.addEventListener('click', () => {
                const open = !item.classList.contains('is-open');
                items.forEach((it) => {
                    it.classList.remove('is-open');
                    $('.faq__q', it).setAttribute('aria-expanded', 'false');
                });
                if (open) {
                    item.classList.add('is-open');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

    /* ───────────── 15 · FORMULARIO → WHATSAPP ───────────── */
    function initForm() {
        const form = $('#wa-form');
        if (!form) return;
        const status = $('[data-form-status]', form);
        const fields = { name: $('#f-name'), device: $('#f-device'), need: $('#f-need') };
        const validators = {
            name: (v) => v.trim().length >= 2,
            device: (v) => !!v,
            need: (v) => !!v,
        };
        const mark = (key, ok) => fields[key].closest('.field').classList.toggle('is-invalid', !ok);
        Object.entries(fields).forEach(([key, el]) => {
            el.addEventListener('input', () => { if (el.closest('.field').classList.contains('is-invalid')) mark(key, validators[key](el.value)); });
            el.addEventListener('change', () => { if (el.closest('.field').classList.contains('is-invalid')) mark(key, validators[key](el.value)); });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            let firstBad = null;
            Object.entries(fields).forEach(([key, el]) => {
                const ok = validators[key](el.value);
                mark(key, ok);
                if (!ok && !firstBad) firstBad = el;
            });
            if (firstBad) { firstBad.focus(); status.textContent = 'Faltan un par de datos para atenderte mejor.'; return; }

            const name = fields.name.value.trim();
            const brand = $('#f-brand').value;
            const msg = $('#f-msg').value.trim();
            const lines = [
                `Hola Hospital Celular, soy ${name}.`,
                `Equipo: ${fields.device.value}${brand ? ` (${brand})` : ''}`,
                `Necesito: ${fields.need.value}`,
            ];
            if (msg) lines.push(`Detalles: ${msg}`);
            lines.push('Quiero mi cotización, por favor.');
            const url = waUrl(lines.join('\n'));
            status.textContent = 'Abriendo WhatsApp con tu mensaje listo…';
            const win = window.open(url, '_blank', 'noopener');
            if (!win) window.location.href = url;   // si el navegador bloquea la ventana
        });
    }

    /* ───────────── 16 · EXTRAS ───────────── */
    function initFloatingWhatsApp() {
        const wa = $('.wa-float');
        if (!wa) return;
        setTimeout(() => wa.classList.add('is-tip'), 6000);
        setTimeout(() => wa.classList.remove('is-tip'), 11500);
    }

    function initSpotlight() {
        $$('[data-spotlight]').forEach((el) => {
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                el.style.setProperty('--mx', `${e.clientX - r.left}px`);
                el.style.setProperty('--my', `${e.clientY - r.top}px`);
            }, { passive: true });
        });
    }

    function initMagnetic() {
        if (!finePointer || reduceMotion) return;
        $$('[data-magnetic]').forEach((el) => {
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
                const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
                el.style.translate = `${(dx * 16).toFixed(1)}px ${(dy * 12).toFixed(1)}px`;
            });
            el.addEventListener('pointerleave', () => { el.style.translate = ''; });
        });
    }

    function initCursor() {
        const cursor = $('.cursor');
        if (!cursor || !finePointer || reduceMotion || window.innerWidth < 1024) return;
        const dot = $('.cursor__dot', cursor), ring = $('.cursor__ring', cursor);
        const pos = { x: -100, y: -100 }, rp = { x: -100, y: -100 };
        window.addEventListener('pointermove', (e) => { pos.x = e.clientX; pos.y = e.clientY; }, { passive: true });
        window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
        window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
        document.addEventListener('pointerover', (e) => cursor.classList.toggle('is-hover', !!e.target.closest('a, button, label, .choice, [data-hover]')));
        onTick((dt) => {
            rp.x = lerp(rp.x, pos.x, Math.min(1, dt * 14));
            rp.y = lerp(rp.y, pos.y, Math.min(1, dt * 14));
            dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
            ring.style.transform = `translate3d(${rp.x}px, ${rp.y}px, 0)`;
        });
    }

    /* Marquees: duplicamos el contenido para un bucle perfecto */
    function initMarquees() {
        $$('[data-marquee] .marquee__track').forEach((track) => {
            const html = track.innerHTML;
            track.insertAdjacentHTML('beforeend', html);
            // Garantiza que cada mitad llene al menos el ancho de pantalla
            let guard = 0;
            while (track.scrollWidth / 2 < window.innerWidth * 1.2 && guard++ < 4) {
                track.insertAdjacentHTML('beforeend', html + html);
            }
            $$('span', track).forEach((s, i) => { if (i >= track.children.length / 2) s.setAttribute('aria-hidden', 'true'); });
        });
    }

    /* ───────────── ARRANQUE ───────────── */
    function boot() {
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        if (!location.hash) window.scrollTo(0, 0);
        Scroll.y = Scroll.ty = window.scrollY;
        const year = $('[data-year]');
        if (year) year.textContent = new Date().getFullYear();

        safe('wa-links', initWhatsAppLinks);
        safe('marquees', initMarquees);
        const loaderDone = initLoader();

        // Orden importa: la galería fija cambia la altura de la página, por eso se mide antes
        // que las secciones que vienen después de ella.
        safe('nav', initNav);
        safe('hero', initHero);
        safe('circuits', initCircuits);
        safe('cinema', initCinema);
        safe('triage', initTriage);
        safe('process', initProcess);
        safe('shelf', initShelf);
        safe('oath', initOath);
        safe('parallax', initParallax);
        safe('faq', initFaq);
        safe('form', initForm);
        safe('spotlight', initSpotlight);
        safe('magnetic', initMagnetic);
        safe('cursor', initCursor);
        safe('progress', initProgress);

        // Re-medir cuando cambia el layout (fuentes, imágenes, rotación, resize)
        let rT, lastH = 0;
        const remeasure = () => { clearTimeout(rT); rT = setTimeout(measureAll, 120); };
        window.addEventListener('resize', remeasure);
        window.addEventListener('orientationchange', remeasure);
        window.addEventListener('load', () => { measureAll(); Scroll.y = Scroll.ty = window.scrollY; });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureAll);
        new ResizeObserver(() => {
            const h = document.body.offsetHeight;
            if (Math.abs(h - lastH) > 2) { lastH = h; remeasure(); }
        }).observe(document.body);

        startLoop();

        loaderDone.then(() => {
            safe('reveal', initReveal);
            safe('counters', initCounters);
            safe('wa-float', initFloatingWhatsApp);
            measureAll();
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
