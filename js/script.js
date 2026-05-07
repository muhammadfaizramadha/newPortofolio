// ---- Scroll progress + sticky nav state ----
const nav = document.getElementById('nav');
const progress = document.getElementById('scrollProgress');
const links = document.querySelectorAll('#navLinks a');
const sectionIds = ['about', 'experience', 'work', 'stack'];

function onScroll() {
  const y = window.scrollY;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = Math.min(100, (y / h) * 100) + '%';
  nav.classList.toggle('is-scrolled', y > 30);

  let active = '';
  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 200) active = id;
  });
  links.forEach(a => {
    a.classList.toggle('is-active', a.getAttribute('href') === '#' + active);
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---- Reveal on scroll (bidirectional — replays when scrolling back) ----
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    e.target.classList.toggle('is-visible', e.isIntersecting);
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ---- Minimalist hero entrance — replays on re-entry ----
const mHero = document.querySelector('.m-hero');
if (mHero) {
  const mhIo = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      mHero.classList.toggle('is-shown', e.isIntersecting);
    });
  }, { threshold: 0 });
  mhIo.observe(mHero);
}

// ---- Marker highlight — one-shot, fires once and never reverses ----
const marker = document.querySelector('.mh-marker');
if (marker) {
  const markerIo = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        marker.classList.add('is-fired');
        obs.unobserve(marker);
      }
    });
  }, { threshold: 0 });
  markerIo.observe(marker);
}

// ---- Scroll-driven hero → about transition (matches motion/react useScroll behavior) ----
// Section1 (m-hero): scale 1 → 0.8, rotate 0 → -5deg
// Section2 (about):  scale 0.8 → 1, rotate +5 → 0deg
// Progress 0→1 over heroH of scroll (equivalent to ['start start', 'end end'] on a 200vh container)
const aboutEl = document.getElementById('about');
const stackEl = document.querySelector('.scroll-stack');
if (mHero && aboutEl && stackEl) {
  let stackTicking = false;
  function updateStackTransform() {
    stackTicking = false;
    const heroH = mHero.offsetHeight;
    const stackTop = stackEl.getBoundingClientRect().top;
    const p = Math.max(0, Math.min(1, -stackTop / heroH));
    mHero.style.transform = `scale(${1 - 0.2 * p}) rotate(${-5 * p}deg)`;
    aboutEl.style.transform = `scale(${0.8 + 0.2 * p}) rotate(${5 - 5 * p}deg)`;
  }
  function onStackScroll() {
    if (!stackTicking) {
      requestAnimationFrame(updateStackTransform);
      stackTicking = true;
    }
  }
  window.addEventListener('scroll', onStackScroll, { passive: true });
  window.addEventListener('resize', onStackScroll);
  updateStackTransform();
}

// ---- Experience accordion ----
document.querySelectorAll('.exp__row').forEach(row => {
  row.addEventListener('click', () => {
    const isOpen = row.classList.contains('is-open');
    document.querySelectorAll('.exp__row').forEach(r => r.classList.remove('is-open'));
    if (!isOpen) row.classList.add('is-open');
  });
});

// ---- Project filter ----
document.querySelectorAll('#projFilter .filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#projFilter .filter-chip').forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    const f = chip.dataset.filter;
    document.querySelectorAll('.proj-card').forEach(card => {
      const show = f === 'all' || card.dataset.cat === f;
      card.style.display = show ? '' : 'none';
    });
  });
});

// ---- Contact form validation ----
const form = document.getElementById('contactForm');
const submit = document.getElementById('formSubmit');
const success = document.getElementById('formSuccess');
const setErr = (k, msg) => {
  form.querySelector(`[data-err="${k}"]`).textContent = msg || '';
};
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  let ok = true;
  const data = new FormData(form);
  const name = (data.get('name') || '').toString().trim();
  const email = (data.get('email') || '').toString().trim();
  const subject = (data.get('subject') || '').toString().trim();
  const msg = (data.get('message') || '').toString().trim();

  setErr('name'); setErr('email'); setErr('subject'); setErr('message');

  if (name.length < 2) { setErr('name', 'Please enter your name.'); ok = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('email', 'A valid email, please.'); ok = false; }
  if (subject.length < 3) { setErr('subject', 'A short subject helps.'); ok = false; }
  if (msg.length < 10) { setErr('message', 'A few more words?'); ok = false; }

  if (!ok) return;

  submit.disabled = true;
  submit.innerHTML = 'Sending…';

  try {
    const res = await fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) throw new Error('Network response was not ok');

    success.classList.add('is-shown');
    submit.innerHTML = 'Sent ✓';
    form.reset();
    setTimeout(() => {
      submit.disabled = false;
      submit.innerHTML = 'Send Message <span class="arr">↗</span>';
      success.classList.remove('is-shown');
    }, 4500);
  } catch (err) {
    submit.disabled = false;
    submit.innerHTML = 'Failed — try again';
    setTimeout(() => {
      submit.innerHTML = 'Send Message <span class="arr">↗</span>';
    }, 3000);
  }
});
