/**
 * Node 22+ can expose `localStorage` / `sessionStorage` globals on the server
 * (here enabled by a `--localstorage-file` flag injected into the Node runtime).
 *
 * Server-side rendering assumes Web Storage exists only in the browser and is
 * `undefined` on the server — Clerk, the cart context, and even Next.js's own
 * dev error overlay branch on `typeof localStorage`. When the global is present
 * but non-functional, `localStorage.getItem(...)` throws
 * `TypeError: localStorage.getItem is not a function` and crashes SSR (HTTP 500).
 *
 * Removing the globals at server startup restores the environment the ecosystem
 * expects. This is a no-op in environments that don't expose Web Storage.
 */
export function register() {
  for (const key of ['localStorage', 'sessionStorage'] as const) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    if (descriptor?.configurable) {
      delete (globalThis as Record<string, unknown>)[key];
    }
  }
}
