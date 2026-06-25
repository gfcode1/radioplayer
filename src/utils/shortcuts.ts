import { store } from '../state';
import { togglePlay, toggleMute } from '../audio';

type ShortcutHandler = () => void;

const shortcuts = new Map<string, ShortcutHandler>();

function registerDefault(): void {
  shortcuts.set('Space', () => togglePlay());
  shortcuts.set('m', () => toggleMute());
  shortcuts.set('M', () => toggleMute());
  shortcuts.set('f', () => store.emit('toggle-favorite'));
  shortcuts.set('F', () => store.emit('toggle-favorite'));
  shortcuts.set('?', () => store.emit('toggle-shortcuts'));
}

export function initShortcuts(): void {
  registerDefault();
  document.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    const handler = shortcuts.get(e.key);
    if (handler) {
      e.preventDefault();
      handler();
    }
  });
}
