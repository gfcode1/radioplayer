let faviconHandlerInstalled = false;

export function installFaviconFallback(): void {
  if (faviconHandlerInstalled) return;
  faviconHandlerInstalled = true;
  document.addEventListener('error', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' && target.classList.contains('station-favicon')) {
      const fallback = document.createElement('span');
      fallback.className = 'favicon-fallback';
      fallback.textContent = '📻';
      target.replaceWith(fallback);
    }
  }, true);
}

export function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}
