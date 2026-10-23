(() => {
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];

  $('#year') && ($('#year').textContent = new Date().getFullYear());

  // Split headlines without breaking words across lines.
  function splitReadableTitle(el) {
    if (!el || el.dataset.split) return;
    const text = el.textContent.trim();
    el.textContent = '';
    let i = 0;
    text.split(/\s+/).forEach((word, wordIndex, words) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';
      [...word].forEach(ch => {
        const span = document.createElement('span');
        span.className = 'char';
        span.style.setProperty('--i', i++);
        span.textContent = ch;
        wordSpan.appendChild(span);
      });
      el.appendChild(wordSpan);
      if (wordIndex < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.dataset.split = 'true';
  }
  $$('.split-title').forEach(splitReadableTitle);

  // Header, progress bar and scroll film.
  const header = $('#siteHeader');
  const film = $('.scroll-film');
  const filmImgs = $$('.film-frame img');
  function onScroll() {
    const y = window.scrollY;
    header && header.classList.toggle('scrolled', y > 20 || document.body.dataset.page !== 'home');
    if (film && filmImgs.length) {
      const rect = film.getBoundingClientRect();
      const total = film.offsetHeight - innerHeight;
      const p = Math.max(0, Math.min(1, -rect.top / total));
      const ease = p < .5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3)/2;
      const figures = $$('.film-frame.refined figure');
      if (figures.length) {
        figures[0].style.transform = `translateY(${40 - ease*80}px) scale(${.9 + ease*.08}) rotate(${-4 + ease*4}deg)`;
        figures[0].style.opacity = `${.72 + ease*.24}`;
        figures[1].style.transform = `translateY(${10 - ease*35}px) scale(${.94 + ease*.08})`;
        figures[1].style.opacity = `${.84 + ease*.16}`;
        figures[2].style.transform = `translateY(${70 - ease*110}px) scale(${.88 + ease*.09}) rotate(${4 - ease*4}deg)`;
        figures[2].style.opacity = `${.68 + ease*.28}`;
      } else {
        filmImgs[0].style.transform = `translate(-50%,-50%) scale(${.72 + ease*.48}) rotate(${(-4 + ease*4).toFixed(2)}deg)`;
        filmImgs[0].style.opacity = `${.25 + ease*.55}`;
        filmImgs[1].style.transform = `translate(${-10 - ease*22}%,-48%) scale(${.52 + ease*.23}) rotate(${8 - ease*12}deg)`;
        filmImgs[1].style.opacity = `${.2 + ease*.45}`;
        filmImgs[2].style.transform = `translate(${-85 + ease*18}%,-45%) scale(${.46 + ease*.25}) rotate(${-8 + ease*10}deg)`;
        filmImgs[2].style.opacity = `${.18 + ease*.45}`;
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu.
  const menuToggle = $('#menuToggle');
  const mobileMenu = $('#mobileMenu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const open = !mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open', open);
      menuToggle.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      mobileMenu.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('lock', open);
    });
    $$('a', mobileMenu).forEach(a => a.addEventListener('click', () => {
      mobileMenu.classList.remove('open'); menuToggle.classList.remove('open'); document.body.classList.remove('lock');
    }));
  }

  // Reveal animation.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: .14, rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('in'));
  }

  // Collection worlds tabs.
  $$('.world-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      $$('.world-tabs button').forEach(b => b.classList.toggle('active', b === btn));
      $$('.world').forEach(w => w.classList.toggle('active', w.dataset.world === target));
    });
  });

  // Subtle 3D tilt cards.
  $$('.tilt-card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `rotateX(${(-y*8).toFixed(2)}deg) rotateY(${(x*8).toFixed(2)}deg)`;
    });
    card.addEventListener('pointerleave', () => card.style.transform = 'rotateX(0) rotateY(0)');
  });

  // Magnetic buttons.
  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width/2)*.14}px, ${(e.clientY - r.top - r.height/2)*.22}px)`;
    });
    el.addEventListener('pointerleave', () => el.style.transform = 'translate(0,0)');
  });

  // Gallery filters.
  $$('.filter-bar button').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      $$('.filter-bar button').forEach(b => b.classList.toggle('active', b === btn));
      $$('.full-gallery .gallery-item').forEach(item => {
        const show = filter === 'all' || (item.dataset.cat || '').includes(filter);
        item.classList.toggle('hidden', !show);
      });
    });
  });

  // Lightbox with next and previous switching.
  const lb = $('#lightbox'), lbImg = $('#lightboxImg'), lbClose = $('#lightboxClose');
  const lbPrev = $('#lightboxPrev'), lbNext = $('#lightboxNext');
  const galleryTriggers = $$('[data-img]');
  let currentImageIndex = 0;
  function showImage(index) {
    if (!lb || !lbImg || !galleryTriggers.length) return;
    currentImageIndex = (index + galleryTriggers.length) % galleryTriggers.length;
    const item = galleryTriggers[currentImageIndex];
    lbImg.src = item.dataset.img;
  }
  galleryTriggers.forEach((item, idx) => item.addEventListener('click', () => {
    showImage(idx);
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.classList.add('lock');
  }));
  function closeLb(){ if(!lb) return; lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); document.body.classList.remove('lock'); }
  lbClose && lbClose.addEventListener('click', closeLb);
  lbPrev && lbPrev.addEventListener('click', e => { e.stopPropagation(); showImage(currentImageIndex - 1); });
  lbNext && lbNext.addEventListener('click', e => { e.stopPropagation(); showImage(currentImageIndex + 1); });
  lb && lb.addEventListener('click', e => { if(e.target === lb) closeLb(); });
  window.addEventListener('keydown', e => {
    if(e.key === 'Escape') closeLb();
    if(lb?.classList.contains('open') && e.key === 'ArrowLeft') showImage(currentImageIndex - 1);
    if(lb?.classList.contains('open') && e.key === 'ArrowRight') showImage(currentImageIndex + 1);
  });

  // Order form: mailto first, clear copy fallback, no fake automatic sending.
  const form = $('#orderForm');
  const formStatus = $('#formStatus');
  function setFormStatus(type, msg) {
    if (!formStatus) return;
    formStatus.className = `form-status show ${type}`;
    formStatus.textContent = msg;
  }
  function getOrderData() {
    if (!form) return {};
    const data = Object.fromEntries(new FormData(form).entries());
    return {
      name: (data.name || '').trim(),
      phone: (data.phone || '').trim(),
      email: (data.email || '').trim(),
      date: (data.date || '').trim(),
      type: (data.type || '').trim(),
      servings: (data.servings || '').trim(),
      flavour: (data.flavour || '').trim(),
      place: (data.place || '').trim(),
      message: (data.message || '').trim(),
      consent: Boolean(data.consent),
      website: (data.website || '').trim()
    };
  }
  function validateOrder(data) {
    if (data.website) return false;
    const required = ['name', 'phone', 'date', 'type', 'message'];
    let ok = true;
    required.forEach(name => {
      const field = form?.elements[name];
      const valid = Boolean(data[name]);
      if (field) field.setAttribute('aria-invalid', String(!valid));
      if (!valid) ok = false;
    });
    const consent = form?.elements.consent;
    if (consent) consent.setAttribute('aria-invalid', String(!data.consent));
    if (!data.consent) ok = false;
    return ok;
  }
  function orderSubject(data) {
    const parts = ['Poptávka dortu'];
    if (data.type) parts.push(data.type);
    if (data.date) parts.push(data.date);
    return parts.join(' | ');
  }
  function orderText(data = getOrderData()) {
    return [
      'Dobrý den,',
      '',
      'rád/a bych poptal/a dort nebo dezerty u DortyMisa.',
      '',
      'KONTAKT',
      `Jméno: ${data.name || ''}`,
      `Telefon: ${data.phone || ''}`,
      `E-mail: ${data.email || 'neuvedeno'}`,
      '',
      'AKCE',
      `Datum akce: ${data.date || ''}`,
      `Typ objednávky: ${data.type || ''}`,
      `Počet porcí: ${data.servings || 'neuvedeno'}`,
      `Vyzvednutí / místo akce: ${data.place || 'neuvedeno'}`,
      '',
      'DORT',
      `Preferovaná chuť: ${data.flavour || 'neuvedeno'}`,
      '',
      'PŘEDSTAVA',
      'Styl, motiv, barvy a další přání:',
      data.message || '',
      '',
      'OCHRANA ÚDAJŮ',
      'Souhlasím s použitím údajů pouze pro vyřízení této poptávky. Údaje nebudou zveřejněny ani předávány dál.',
      '',
      'Děkuji.'
    ].join('\n');
  }
  async function copyOrderText(data = getOrderData()) {
    const text = orderText(data);
    try {
      await navigator.clipboard.writeText(text);
      setFormStatus('success', 'Text objednávky je zkopírovaný. Pokud se e-mail neotevřel, vložte text do nové zprávy a pošlete ho na dortymisa@gmail.com. Případně zavolejte na 603 203 708.');
      return true;
    } catch {
      prompt('Zkopírujte text objednávky:', text);
      return false;
    }
  }
  if (form) {
    form.addEventListener('input', e => {
      if (e.target?.removeAttribute) e.target.removeAttribute('aria-invalid');
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = getOrderData();
      if (!form.reportValidity() || !validateOrder(data)) {
        setFormStatus('error', 'Prosím vyplňte všechna povinná pole a potvrďte souhlas s použitím údajů pro vyřízení poptávky.');
        return;
      }
      const subject = encodeURIComponent(orderSubject(data));
      const body = encodeURIComponent(orderText(data));
      const mailto = `mailto:dortymisa@gmail.com?subject=${subject}&body=${body}`;
      setFormStatus('warning', 'Otevírám váš e-mail s připravenou poptávkou. Zprávu prosím zkontrolujte a odešlete. Pokud se e-mail neotevře, použijte tlačítko Zkopírovat text objednávky nebo zavolejte na 603 203 708.');
      window.location.href = mailto;
    });
    $('#copyOrder')?.addEventListener('click', async () => {
      const data = getOrderData();
      if (!validateOrder(data)) {
        setFormStatus('error', 'Pro zkopírování kompletní objednávky prosím nejdřív vyplňte povinná pole.');
        return;
      }
      await copyOrderText(data);
    });
  }

  // Elegant flowing homepage: sticky image narrative. Uses nearest step to avoid visual jitter.
  const flowSteps = $$('.story-step');
  const storyImages = $$('.story-img');
  const storyCaption = $('#storyCaption');
  const storyNumber = $('#storyNumber');
  let activeFlowStep = -1;
  function setFlowStep(idx) {
    if (idx === activeFlowStep || !flowSteps[idx]) return;
    activeFlowStep = idx;
    const step = flowSteps[idx];
    flowSteps.forEach((s, i) => {
      s.classList.toggle('active', i === idx);
      s.classList.toggle('is-before', i < idx);
      s.classList.toggle('is-after', i > idx);
    });
    storyImages.forEach((img, i) => img.classList.toggle('active', i === idx));
    if (storyCaption) storyCaption.textContent = step.dataset.caption || '';
    if (storyNumber) storyNumber.textContent = String(idx + 1).padStart(2, '0');
  }
  function updateFlowStory() {
    if (!flowSteps.length || !storyImages.length) return;
    const center = innerHeight * 0.52;
    let best = 0, bestDist = Infinity;
    flowSteps.forEach((step, idx) => {
      const r = step.getBoundingClientRect();
      const stepCenter = r.top + r.height * 0.5;
      const dist = Math.abs(stepCenter - center);
      if (dist < bestDist) { bestDist = dist; best = idx; }
    });
    setFlowStep(best);
  }
  let flowTicking = false;
  window.addEventListener('scroll', () => {
    if (flowTicking) return;
    flowTicking = true;
    requestAnimationFrame(() => { updateFlowStory(); flowTicking = false; });
  }, { passive: true });
  updateFlowStory();

  const icingPath = $('#icingPath');
  if (icingPath) {
    const len = icingPath.getTotalLength();
    icingPath.style.strokeDasharray = `${len}`;
    icingPath.style.strokeDashoffset = `${len}`;
    const updateRibbon = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = Math.max(0, Math.min(1, scrollY / max));
      icingPath.style.strokeDashoffset = `${len * (1 - p)}`;
    };
    window.addEventListener('scroll', updateRibbon, { passive: true });
    updateRibbon();
  }



  // Active navigation state for desktop and mobile.
  const navTargets = ['pribeh', 'nabidka', 'galerie', 'kontakt'];
  const navLinks = $$('a[href^="#"]', document).filter(a => navTargets.includes((a.getAttribute('href') || '').slice(1)));
  function updateActiveNav() {
    let current = navTargets[0];
    const probe = innerHeight * 0.28;
    navTargets.forEach(id => {
      const section = document.getElementById(id);
      if (!section) return;
      const rect = section.getBoundingClientRect();
      if (rect.top <= probe && rect.bottom > probe) current = id;
    });
    navLinks.forEach(a => a.classList.toggle('active', (a.getAttribute('href') || '') === `#${current}`));
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });
  window.addEventListener('resize', updateActiveNav);
  updateActiveNav();

  // Gallery deep links: opening galerie.html#svatebni automatically activates the right category.
  function applyGalleryHashFilter() {
    const map = { '#svatebni': 'svatebni', '#narozeniny': 'narozeniny', '#dezerty': 'dezerty', '#luxury': 'luxury' };
    const filter = map[location.hash];
    if (!filter) return;
    const btn = $(`.filter-bar button[data-filter="${filter}"]`);
    if (btn) {
      btn.click();
      setTimeout(() => document.querySelector('.full-gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  }
  window.addEventListener('hashchange', applyGalleryHashFilter);
  applyGalleryHashFilter();



  // Hideable floating order CTA.
  const floatingOrder = $('#floatingOrder');
  const floatingOrderToggle = $('#floatingOrderToggle');
  if (floatingOrder && floatingOrderToggle) {
    floatingOrderToggle.addEventListener('click', () => {
      floatingOrder.classList.toggle('collapsed');
      floatingOrderToggle.setAttribute('aria-label', floatingOrder.classList.contains('collapsed') ? 'Zobrazit rychlou objednávku' : 'Skrýt rychlou objednávku');
    });
  }

  // Sugar dust canvas particles - light and elegant.
  const canvas = $('#sugarCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    function resize(){ canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    function init(){
      particles = Array.from({length: Math.min(64, Math.floor(innerWidth/18))}, () => ({
        x: Math.random()*innerWidth, y: Math.random()*innerHeight, r: Math.random()*2.2+.4, a: Math.random()*.55+.12, s: Math.random()*.35+.08, drift: Math.random()*.35-.175
      }));
    }
    function draw(){
      ctx.clearRect(0,0,innerWidth,innerHeight);
      particles.forEach(p => {
        p.y -= p.s; p.x += p.drift + Math.sin(Date.now()*0.0006+p.y)*0.08;
        if(p.y < -10){p.y = innerHeight+10; p.x = Math.random()*innerWidth;}
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = `rgba(244,223,181,${p.a})`; ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    resize(); init(); draw(); window.addEventListener('resize', () => { resize(); init(); });
  }
})();
