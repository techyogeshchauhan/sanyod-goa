import { useEffect, type DependencyList } from 'react';
import { EffectScope } from './EffectScope';

/** Runs a page's ported script after render and undoes everything it did on unmount. */
export function usePageEffects(setup: (scope: EffectScope) => void, deps: DependencyList = []): void {
  useEffect(() => {
    const scope = new EffectScope();
    setup(scope);
    return () => scope.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
