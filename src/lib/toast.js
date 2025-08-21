import { get, writable } from 'svelte/store';

export const toasts = writable([]);

export function showToast(message, type = 'info', duration = 3000) {
  const id = Date.now();

  toasts.set([...get(toasts), { id, message, type }])

  setTimeout(() => {
    toasts.update((all) => all.filter((t) => t.id !== id));
  }, duration);
}
