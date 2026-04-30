import { Link, useParams, useRouterState } from '@tanstack/react-router';
import { SCHOOL_TAB_ROUTES } from '@/router/routes';

interface Tab {
  label: string;
  path: string;
}

function getTabs(slug: string): Tab[] {
  const r = (route: string) => route.replace('$slug', slug);
  return [
    { label: 'Overzicht', path: r(SCHOOL_TAB_ROUTES.overzicht) },
    { label: 'Vergelijking', path: r(SCHOOL_TAB_ROUTES.vergelijking) },
    { label: 'Producten', path: r(SCHOOL_TAB_ROUTES.producten) },
    { label: 'Contacten', path: r(SCHOOL_TAB_ROUTES.contacten) },
    { label: 'Gesprekken', path: r(SCHOOL_TAB_ROUTES.gesprekken) },
    { label: 'Schoolplan', path: r(SCHOOL_TAB_ROUTES.schoolplan) },
    { label: 'Export', path: r(SCHOOL_TAB_ROUTES.export) },
  ];
}

export default function TabNavigation() {
  const { slug } = useParams({ from: '/scholen/$slug' });
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const tabs = getTabs(slug);

  // Determine active tab: exact match or the most specific prefix match
  const isActive = (tabPath: string) => {
    // For the base path (Overzicht), only match exactly
    const base = `/scholen/${slug}`;
    if (tabPath === base) {
      return currentPath === base || currentPath === `${base}/`;
    }
    // For other tabs, match prefix
    return currentPath.startsWith(tabPath);
  };

  return (
    <div className="border-b border-neutral-200 overflow-x-auto">
      <nav className="flex px-8 max-sm:px-4 gap-0 w-max min-w-full" aria-label="Schoolprofiel tabs">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`
                inline-flex items-center h-11 px-4 text-[14px] font-semibold whitespace-nowrap
                border-b-2 transition-colors
                ${active
                  ? 'text-cito-primary border-cito-primary'
                  : 'text-neutral-500 border-transparent hover:text-neutral-700 hover:bg-neutral-50'
                }
              `}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
