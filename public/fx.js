// Efeitos visuais: pétalas do cenário, animação de movimento das peças e faixas de anúncio.
const reduced = () => document.body.classList.contains('reduced')
  || Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

export function initScene() {
  const host = document.querySelector('#petals');
  if (!host || host.childElementCount) return;
  for (let i = 0; i < 18; i++) {
    const petal = document.createElement('i');
    const size = 7 + Math.random() * 9;
    petal.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size * .72}px;`
      + `animation-duration:${11 + Math.random() * 12}s,${2.5 + Math.random() * 3}s;`
      + `animation-delay:${-Math.random() * 20}s,${-Math.random() * 3}s;opacity:${.45 + Math.random() * .5}`;
    host.append(petal);
  }
}

// Tela inicial: folhas de bordo caindo, brasas subindo e paralaxe que acompanha o mouse.
export function initMenuFx() {
  const host = document.querySelector('#hero-particles');
  const stage = document.querySelector('#hero-stage');
  if (!host || host.childElementCount) return;
  for (let i = 0; i < 14; i++) {
    const leaf = document.createElement('i');
    const size = 12 + Math.random() * 14;
    leaf.className = 'leaf';
    leaf.style.cssText = `left:${10 + Math.random() * 100}%;width:${size}px;height:${size}px;`
      + `animation-duration:${10 + Math.random() * 10}s,${2 + Math.random() * 2.5}s;`
      + `animation-delay:${-Math.random() * 18}s,${-Math.random() * 3}s;opacity:${.6 + Math.random() * .4}`;
    host.append(leaf);
  }
  for (let i = 0; i < 26; i++) {
    const ember = document.createElement('i');
    const size = 2 + Math.random() * 3.5;
    ember.className = 'ember';
    ember.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;--dx:${(Math.random() - .5) * 160}px;`
      + `animation-duration:${6 + Math.random() * 7}s;animation-delay:${-Math.random() * 12}s`;
    host.append(ember);
  }
  if (!stage) return;
  let frame = null;
  window.addEventListener('pointermove', event => {
    if (reduced() || document.querySelector('#menu-screen')?.hidden || frame) return;
    frame = setTimeout(() => {
      frame = null;
      const x = event.clientX / window.innerWidth - .5, y = event.clientY / window.innerHeight - .5;
      stage.style.setProperty('--px', `${(-x * 22).toFixed(1)}px`);
      stage.style.setProperty('--py', `${(-y * 14).toFixed(1)}px`);
      host.style.setProperty('--px', `${(x * 30).toFixed(1)}px`);
      host.style.setProperty('--py', `${(y * 18).toFixed(1)}px`);
    }, 16);
  }, { passive: true });
}

// FLIP: registra a posição das peças antes de redesenhar o tabuleiro.
export function snapshot(container) {
  const positions = new Map();
  for (const el of container.querySelectorAll('.piece[data-id]')) positions.set(el.dataset.id, el.getBoundingClientRect());
  return positions;
}

// Anima cada peça da posição anterior até a nova.
export function animateMoves(container, before) {
  if (reduced() || !before.size) return;
  for (const el of container.querySelectorAll('.piece[data-id]')) {
    const old = before.get(el.dataset.id);
    if (!old || typeof el.animate !== 'function') continue;
    const now = el.getBoundingClientRect();
    const dx = old.left - now.left, dy = old.top - now.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
    el.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(1.08)`, zIndex: 5 },
      { transform: 'translate(0, 0) scale(1)', zIndex: 5 },
    ], { duration: 320, easing: 'cubic-bezier(.2,.8,.25,1)' });
  }
}

let bannerTimer = null;
export function banner(text, tone = 'neutral', duration = 1700) {
  const box = document.querySelector('#banner');
  if (!box) return;
  clearTimeout(bannerTimer);
  box.querySelector('span').textContent = text;
  box.dataset.tone = tone;
  box.hidden = false;
  box.classList.remove('show');
  void box.offsetWidth;
  box.classList.add('show');
  bannerTimer = setTimeout(() => { box.hidden = true; box.classList.remove('show'); }, reduced() ? 900 : duration);
}
