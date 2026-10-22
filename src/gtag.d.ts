/** GA4 (gtag.js) se inyecta diferido en Base.astro tras `window.load`. */
interface Window {
  gtag?: (command: string, ...args: unknown[]) => void;
}
