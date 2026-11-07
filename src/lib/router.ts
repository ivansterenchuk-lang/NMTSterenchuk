import { useEffect, useState } from 'react';

export type Route =
  | { name: 'list' }
  | { name: 'bank' }
  | { name: 'sessions' }
  | { name: 'analytics' }
  | { name: 'practice' }
  | { name: 'practiceTest'; testId: string }
  | { name: 'new' }
  | { name: 'edit'; testId: string }
  | { name: 'take'; testId: string }
  | { name: 'results'; testId: string }
  | { name: 'session'; sessionId: string }
  | { name: 'join'; code: string };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '');
  const editMatch = path.match(/^\/tests\/([^/]+)\/edit$/);
  if (editMatch) return { name: 'edit', testId: editMatch[1] };
  if (path === '/tests/new') return { name: 'new' };
  if (path === '/bank') return { name: 'bank' };
  if (path === '/sessions') return { name: 'sessions' };
  if (path === '/analytics') return { name: 'analytics' };
  if (path === '/practice') return { name: 'practice' };
  const practiceMatch = path.match(/^\/practice\/([^/]+)$/);
  if (practiceMatch) return { name: 'practiceTest', testId: practiceMatch[1] };
  const resultsMatch = path.match(/^\/tests\/([^/]+)\/results$/);
  if (resultsMatch) return { name: 'results', testId: resultsMatch[1] };
  const sessionMatch = path.match(/^\/sessions\/([^/]+)$/);
  if (sessionMatch) return { name: 'session', sessionId: sessionMatch[1] };
  const joinMatch = path.match(/^\/join\/([^/]+)$/);
  if (joinMatch) return { name: 'join', code: joinMatch[1] };
  const takeMatch = path.match(/^\/tests\/([^/]+)$/);
  if (takeMatch) return { name: 'take', testId: takeMatch[1] };
  return { name: 'list' };
}

export function navigate(path: string) {
  window.location.hash = path;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}
