import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};

const getRoute = () => window.location.hash.replace(/^#/, '') || '/';

/** Current hash route, e.g. '/c64' for '#/c64'. Defaults to '/'. */
export const useHashRoute = () => useSyncExternalStore(subscribe, getRoute);
