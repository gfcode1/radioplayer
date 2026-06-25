import type { ToastType } from '../types';

const container = (): HTMLElement => {
  let c = document.getElementById('toastContainer');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toastContainer';
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
  return c;
};

export function toast(msg: string, type: ToastType = 'info'): void {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container().appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
