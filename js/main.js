// FAP Contabilidade — interações
(() => {
  document.body.classList.remove('no-js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const now = new Date();
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = now.getFullYear());

  // Open now (São Paulo time, Mon–Fri 9–18)
  const openEl = document.querySelector('[data-open]');
  try {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(now).map(p => [p.type, p.value]));
    const h = parseInt(parts.hour, 10) % 24;
    const open = !['Sat', 'Sun'].includes(parts.weekday) && h >= 9 && h < 18;
    openEl.querySelector('span').textContent = open ? 'Aberto agora' : 'Fechado agora. Mande mensagem e respondemos no próximo dia útil.';
    openEl.classList.toggle('closed', !open);
    openEl.hidden = false;
  } catch (e) {}

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add('in'));

  // Count-up numbers
  const fmt = (v, d) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const counters = document.querySelectorAll('[data-count]');
  const runCount = el => {
    const target = parseFloat(el.dataset.count), d = parseInt(el.dataset.decimals || '0', 10);
    if (reduce) { el.textContent = fmt(target, d); return; }
    const t0 = performance.now(), dur = 1400;
    const tick = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(target * e, d); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  const co = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } }), { threshold: 0.6 });
  counters.forEach(el => co.observe(el));

  // Agenda check-off sequence
  const items = [...document.querySelectorAll('.agenda li')];
  if (reduce) items.forEach(li => li.classList.add('done'));
  else items.forEach((li, i) => setTimeout(() => li.classList.add('done'), 1100 + i * 350));

  // 3D tilt on agenda card
  const card = document.querySelector('.agenda');
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const visual = document.querySelector('.hero-visual');
    visual.addEventListener('pointermove', e => {
      const r = visual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`;
    });
    visual.addEventListener('pointerleave', () => card.style.transform = '');
  }

  // Scroll-linked: progress bar, parallax, steps line, header
  const header = document.querySelector('.site-header');
  const bar = document.querySelector('.progress');
  const parallax = [...document.querySelectorAll('[data-parallax]')];
  const stepsWrap = document.querySelector('.steps-wrap');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle('is-scrolled', y > 8);
    if (reduce) return;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    parallax.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const off = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(img.dataset.parallax);
      img.style.transform = `translateY(${off.toFixed(1)}px) scale(1.12)`;
    });
    const sr = stepsWrap.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - sr.top) / (sr.height + innerHeight * 0.3)));
    stepsWrap.style.setProperty('--p', p.toFixed(3));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // Active nav link
  const links = [...document.querySelectorAll('.nav a')];
  const so = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['servicos', 'como-funciona', 'avaliacoes', 'duvidas', 'contato'].forEach(id => so.observe(document.getElementById(id)));

  // Services: swap preview image on hover/focus
  const rows = [...document.querySelectorAll('.ledger-row')];
  const imgs = [...document.querySelectorAll('.preview-frame img')];
  const capT = document.querySelector('[data-cap-title]');
  const capX = document.querySelector('[data-cap-text]');
  const activate = row => {
    rows.forEach(r => r.classList.toggle('is-active', r === row));
    imgs.forEach((im, i) => im.classList.toggle('is-on', i === +row.dataset.img));
    capT.textContent = row.querySelector('h3').firstChild.textContent.trim();
    capX.textContent = row.querySelector('p').textContent.split('.')[0] + '.';
  };
  rows.forEach(r => { r.addEventListener('mouseenter', () => activate(r)); r.addEventListener('focus', () => activate(r)); });

  // Reviews carousel
  const slides = [...document.querySelectorAll('.slide')];
  const dots = [...document.querySelectorAll('.dots button')];
  const carousel = document.querySelector('.carousel');
  let idx = 0, timer = null;
  const show = i => {
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle('is-on', k === idx); s.setAttribute('aria-hidden', String(k !== idx)); });
    dots.forEach((d, k) => d.setAttribute('aria-current', String(k === idx)));
  };
  const start = () => { if (!reduce) { stop(); timer = setInterval(() => show(idx + 1), 6500); } };
  const stop = () => { clearInterval(timer); timer = null; };
  document.querySelector('[data-prev]').addEventListener('click', () => { show(idx - 1); start(); });
  document.querySelector('[data-next]').addEventListener('click', () => { show(idx + 1); start(); });
  dots.forEach((d, k) => d.addEventListener('click', () => { show(k); start(); }));
  carousel.addEventListener('mouseenter', stop); carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop); carousel.addEventListener('focusout', start);
  show(0); start();

  // Mobile sticky CTA
  const sticky = document.querySelector('.sticky-cta');
  let heroOut = false, contactIn = false;
  const syncSticky = () => {
    const on = heroOut && !contactIn;
    sticky.classList.toggle('is-visible', on);
    sticky.setAttribute('aria-hidden', String(!on));
    sticky.querySelector('a').tabIndex = on ? 0 : -1;
  };
  new IntersectionObserver(([e]) => { heroOut = !e.isIntersecting; syncSticky(); }, { threshold: 0.05 }).observe(document.querySelector('.hero'));
  new IntersectionObserver(([e]) => { contactIn = e.isIntersecting; syncSticky(); }).observe(document.getElementById('contato'));

  // Mobile menu
  const menuBtn = document.querySelector('.menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const setMenu = open => { mobileNav.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); };
  menuBtn.addEventListener('click', () => setMenu(mobileNav.hidden));
  mobileNav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileNav.hidden) { setMenu(false); menuBtn.focus(); } });

  // Form → WhatsApp
  const form = document.getElementById('lead-form');
  const nome = document.getElementById('nome');
  const nomeErro = document.getElementById('nome-erro');
  let touched = false;
  const showError = on => { nomeErro.hidden = !on; if (on) nome.setAttribute('aria-invalid', 'true'); else nome.removeAttribute('aria-invalid'); };
  nome.addEventListener('blur', () => { touched = true; showError(!nome.value.trim()); });
  nome.addEventListener('focus', () => showError(false));
  nome.addEventListener('input', () => { if (touched && nome.value.trim()) showError(false); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    touched = true;
    if (!nome.value.trim()) { showError(true); nome.focus(); nome.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); return; }
    const perfil = document.getElementById('perfil').value;
    const msg = document.getElementById('msg').value.trim();
    const text = `Olá, meu nome é ${nome.value.trim()}. ${perfil}.${msg ? ' ' + msg : ''} (Vim pelo site)`;
    window.open('https://wa.me/5511941421975?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });
})();
