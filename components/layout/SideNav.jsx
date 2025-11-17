/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState, useCallback } from 'react';

/* Your NAV as before */
const NAV = [
  {
    type: 'section',
    title: 'Operations',
    id: 'operations',
    collapsible: false,
    items: [
      { label: 'Vehicle Status', href: '/vehicle-status' },
      { label: 'Lot manager', href: '/lot-manager' },
      { label: 'Reservations', href: '/reservations' },
    ],
  },
  {
    type: 'section',
    title: 'Admin',
    id: 'admin',
    collapsible: false,
    items: [{ label: 'Users', href: '/users' }],
  },
];

/* ---------- Helpers ---------- */
const normalize = (p = '') => {
  const base = String(p).split('#')[0].split('?')[0];
  return base !== '/' ? base.replace(/\/+$/, '') : '/';
};

/** Segment-wise matcher supporting:
 * - '*' (global)
 * - '/*' suffix → descendant wildcard (e.g. '/users/*')
 * - Next.js dynamic: '/users/[user]'
 * - Param style: '/users/:user'
 * - Exact match
 */
function matchPattern(patternRaw = '', pathRaw = '') {
  const pattern = normalize(patternRaw);
  const path = normalize(pathRaw);

  if (pattern === '*' || pattern === '/*') return true; // global
  if (pattern.endsWith('/*')) {
    const base = normalize(pattern.slice(0, -2)) || '/';
    if (base === '/') return true;
    return path === base || path.startsWith(base + '/');
  }
  if (pattern === path) return true;

  const pSegs = pattern.split('/').filter(Boolean);
  const xSegs = path.split('/').filter(Boolean);
  if (pSegs.length !== xSegs.length) return false;

  for (let i = 0; i < pSegs.length; i++) {
    const seg = pSegs[i];
    const isParam =
      (seg.startsWith('[') && seg.endsWith(']')) || seg.startsWith(':');
    if (isParam) continue;
    if (seg !== xSegs[i]) return false;
  }
  return true;
}

export default function SideNav({ open, onClose, currentUser }) {
  const router = useRouter();
  const path = normalize(router.asPath || router.pathname || '/');
  const [expanded, setExpanded] = useState({});

  /* Permissions → Set */
  const permSet = useMemo(() => {
    const raw = Array.isArray(currentUser?.permissions)
      ? currentUser.permissions
      : [];
    return new Set(raw.map((p) => normalize(p)));
  }, [currentUser?.permissions]);

  const allowAll = useMemo(
    () => Array.from(permSet).some((p) => p === '*' || p === '/*'),
    [permSet]
  );

  const canAccessPath = useCallback(
    (targetHref) => {
      if (allowAll) return true;
      const target = normalize(targetHref);
      for (const pat of permSet) {
        if (matchPattern(pat, target)) return true;
      }
      return false;
    },
    [allowAll, permSet]
  );

  const isActiveFor = useCallback((href) => matchPattern(href, path), [path]);

  const sectionContainsActive = useCallback(
    (section) => (section.items || []).some((it) => isActiveFor(it.href)),
    [isActiveFor]
  );

  /* Filter NAV by permissions (links and section items) */
  const items = useMemo(() => {
    return NAV.reduce((acc, node) => {
      if (node.type === 'link') {
        if (canAccessPath(node.href)) acc.push(node);
        return acc;
      }
      const filteredItems = (node.items || []).filter((it) =>
        canAccessPath(it.href)
      );
      if (filteredItems.length > 0) acc.push({ ...node, items: filteredItems });
      return acc;
    }, []);
  }, [canAccessPath]);

  /* Expand section on first visit if it contains active route */
  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      items.forEach((n) => {
        if (n.type !== 'section') return;
        const isCollapsible = n.collapsible !== false;
        if (!isCollapsible) return;
        const active = sectionContainsActive(n);
        if (!(n.id in next)) next[n.id] = active ? true : false;
        else if (active && !next[n.id]) next[n.id] = true;
      });
      return next;
    });
    // respond to route or items structure changes only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, items]);

  const toggle = useCallback((id) => {
    setExpanded((s) => ({ ...s, [id]: !s[id] }));
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 lg:hidden ${
          open ? '' : 'hidden'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed z-40 flex h-screen w-72 flex-col border-r border-slate-200 bg-white px-4 py-6 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:self-start ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-2">
          <img
            src="/voyage-logo.png"
            alt="logo"
            className="w-[200px] mx-auto"
          />
        </div>

        {/* Scrollable nav area */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 mt-3">
          <nav className="space-y-2">
            {items.map((node, idx) => {
              if (node.type === 'link') {
                const active = isActiveFor(node.href);
                return (
                  <Link
                    key={`top-${idx}`}
                    href={node.href}
                    onClick={onClose}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                      active
                        ? 'bg-slate-100 font-semibold text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span>{node.icon}</span>
                    <span>{node.label}</span>
                  </Link>
                );
              }

              const isCollapsible = node.collapsible !== false;
              const activeInSection = sectionContainsActive(node);
              const isOpen = isCollapsible ? !!expanded[node.id] : true;
              const hasItems =
                Array.isArray(node.items) && node.items.length > 0;

              if (!hasItems) {
                return (
                  <div
                    key={node.id}
                    className="px-3 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {node.title}
                  </div>
                );
              }

              if (!isCollapsible) {
                return (
                  <div key={node.id} className="rounded-lg">
                    <div
                      className={`px-3 pt-3 text-xs font-semibold uppercase tracking-wider ${
                        activeInSection ? 'text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      {node.title}
                    </div>
                    <ul className="mt-2 space-y-1 pl-3">
                      {node.items.map((it) => {
                        const active = isActiveFor(it.href);
                        return (
                          <li key={it.href}>
                            <Link
                              href={it.href}
                              onClick={onClose}
                              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                                active
                                  ? 'bg-slate-100 font-semibold text-slate-900'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                              aria-current={active ? 'page' : undefined}
                            >
                              <span>{it.icon}</span>
                              <span>{it.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              }

              return (
                <div key={node.id} className="rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggle(node.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      activeInSection
                        ? 'bg-slate-100 font-semibold text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    aria-expanded={isOpen}
                    aria-controls={`section-${node.id}`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{node.title}</span>
                    </span>
                    <svg
                      className={`h-4 w-4 transform transition-transform ${
                        isOpen ? 'rotate-90' : ''
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.293 7.293a1 1 0 011.414 0L12 11.586l-4.293 4.293a1 1 0 01-1.414-1.414L9.586 12 6.293 8.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  <div
                    id={`section-${node.id}`}
                    className={`overflow-hidden transition-all ${
                      isOpen
                        ? 'max-h-[1000px] ease-in duration-300'
                        : 'max-h-0 ease-out duration-200'
                    }`}
                  >
                    <ul className="mt-1 space-y-1 pl-3">
                      {node.items.map((it) => {
                        const active = isActiveFor(it.href);
                        return (
                          <li key={it.href}>
                            <Link
                              href={it.href}
                              onClick={onClose}
                              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                                active
                                  ? 'bg-slate-100 font-semibold text-slate-900'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                              aria-current={active ? 'page' : undefined}
                            >
                              <span>{it.icon}</span>
                              <span>{it.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
          </nav>
          <div className="h-[2000px]" />
        </div>

        {/* Footer */}
        <div className="pt-4 text-xs text-slate-500">© Your Company</div>
      </aside>
    </>
  );
}
