import { useCallback, useRef, useState } from 'react';

let toastSeed = 0;

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback((message, options = {}) => {
    const id = ++toastSeed;
    const { type = 'success', duration = 3600, icon } = options;
    setToasts((current) => [...current, { id, message, type, icon }]);
    const timer = window.setTimeout(() => dismiss(id), duration);
    timers.current.set(id, timer);
    return id;
  }, [dismiss]);

  return { toasts, notify, dismiss };
}
