import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/inventory', icon: 'inventory_2', label: 'Inventory' },
  { to: '/labor', icon: 'groups', label: 'Labor' },
  { to: '/sales', icon: 'potted_plant', label: 'Sales' },
  { to: '/payments', icon: 'payments', label: 'Payments' },
  { to: '/reports', icon: 'assessment', label: 'Reports' },
];

export default function Sidebar() {
  return (
    <aside className="h-[calc(100vh-72px)] w-64 hidden lg:flex flex-col border-r border-outline-variant/20 bg-surface-container-low/90 backdrop-blur-xl sticky top-[72px] p-gutter gap-stack-md">
      <div className="mb-stack-lg">
        <h2 className="font-headline text-headline-md text-primary font-semibold">Highland Estate</h2>
        <p className="text-on-surface-variant text-xs mt-1">Active Season 2026</p>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'bg-secondary-container text-on-secondary-container rounded-xl font-bold flex items-center gap-3 px-4 py-3 cursor-pointer'
                : 'text-on-surface-variant hover:bg-surface-variant/50 rounded-xl flex items-center gap-3 px-4 py-3 transition-all cursor-pointer hover:translate-x-1'
            }
          >
            <span className="material-symbols-outlined text-xl">{icon}</span>
            <span className="text-label-md font-semibold">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-outline-variant/20 pt-stack-md flex flex-col gap-1">
        <div className="text-on-surface-variant hover:bg-surface-variant/50 rounded-xl flex items-center gap-3 px-4 py-3 transition-all cursor-pointer">
          <span className="material-symbols-outlined text-xl">settings</span>
          <span className="text-label-md font-semibold">Settings</span>
        </div>
      </div>
    </aside>
  );
}
