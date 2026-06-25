import { store } from '../state';
import { EQ_FREQUENCIES, EQ_PRESETS, setEqBand, setEqPreset } from '../audio';

function buildEqHtml(): string {
  let html = `<div class="eq-title">EQUALIZER</div>`;
  html += '<div class="eq-presets" role="group" aria-label="Preset equalizer">';
  for (const name of Object.keys(EQ_PRESETS)) {
    html += `<button class="eq-preset${store.eq.preset === name ? ' active' : ''}" data-preset="${name}" aria-label="Preset ${name}" aria-pressed="${store.eq.preset === name}">${name.toUpperCase()}</button>`;
  }
  html += '</div><div class="eq-sliders">';
  EQ_FREQUENCIES.forEach((freq, i) => {
    const val = store.eq.bands[i];
    const label = freq >= 1000 ? freq / 1000 + 'K' : String(freq);
    html += `
      <div class="eq-band">
        <span class="eq-val">${val > 0 ? '+' : ''}${val}dB</span>
        <input type="range" class="eq-slider" min="-12" max="12" value="${val}" data-eq="${i}" aria-label="Frequenza ${label}Hz" aria-valuenow="${val}" aria-valuemin="-12" aria-valuemax="12">
        <span class="eq-band-label">${label}Hz</span>
      </div>`;
  });
  html += '</div>';
  return html;
}

function attachEqEvents(container: HTMLElement): void {
  container.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = (btn as HTMLElement).dataset.preset!;
      setEqPreset(name);
      renderAll();
    });
  });

  container.querySelectorAll('[data-eq]').forEach((slider) => {
    slider.addEventListener('input', () => {
      const idx = parseInt((slider as HTMLElement).dataset.eq!, 10);
      const val = parseInt((slider as HTMLInputElement).value, 10);
      setEqBand(idx, val);
      const valSpan = slider.previousElementSibling;
      if (valSpan) valSpan.textContent = (val > 0 ? '+' : '') + val + 'dB';
    });
  });
}

function renderAll(): void {
  /* sidebar EQ view */
  const sidebarEq = document.getElementById('eqPanelSidebar');
  if (sidebarEq) {
    sidebarEq.innerHTML = buildEqHtml();
    attachEqEvents(sidebarEq);
  }

  /* inline EQ in search view */
  const inlineEq = document.getElementById('eqPanelInline');
  if (inlineEq && inlineEq.innerHTML) {
    inlineEq.innerHTML = buildEqHtml();
    attachEqEvents(inlineEq);
  }
}

export function initEq(): void {
  store.on('render-eq', () => {
    const content = document.getElementById('content')!;
    content.innerHTML = `<div class="eq-panel open" id="eqPanelSidebar"></div>`;
    const panel = document.getElementById('eqPanelSidebar')!;
    panel.innerHTML = buildEqHtml();
    attachEqEvents(panel);
  });

  store.on('render-eq-inline', () => {
    const inlineEq = document.getElementById('eqPanelInline');
    if (inlineEq) {
      inlineEq.innerHTML = buildEqHtml();
      attachEqEvents(inlineEq);
    }
  });
}
