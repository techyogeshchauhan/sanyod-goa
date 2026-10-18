import { useEffect } from 'react';

/** Adds a class to <body> while the component is mounted (activates the page's scoped CSS). */
export function useBodyClass(className: string): void {
  useEffect(() => {
    document.body.classList.add(className);
    return () => document.body.classList.remove(className);
  }, [className]);
}
