import { store } from '../state';
import type { Section } from '../types';

export function initSidebar(): void {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => {
      const section = (item as HTMLElement).dataset.section as Section;
      if (section) switchSection(section);
    });
  });

  const hamburger = document.getElementById('hamburger');
  hamburger?.addEventListener('click', toggleSidebar);
}

export function switchSection(section: Section): void {
  store.section = section;
  store.page = 0;
  document.querySelectorAll('.nav-item').forEach((el) => el.classList.remove('active'));
  document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
  closeSidebar();
  store.emit('section-changed');
}

function toggleSidebar(): void {
  document.getElementById('sidebar')?.classList.toggle('open');
}

function closeSidebar(): void {
  document.getElementById('sidebar')?.classList.remove('open');
}
