import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';

const navItems = [
  { to: '/dashboard', icon: 'dashboard',    label: 'Dashboard' },
  { to: '/merchant', icon: 'inventory_2',  label: 'Merchant' },
  { to: '/labor',     icon: 'groups',       label: 'Labor' },
  { to: '/factory',     icon: 'potted_plant', label: 'Factory' },
  { to: '/payments',  icon: 'payments',     label: 'Payments' },
  { to: '/reports',   icon: 'assessment',   label: 'Reports' },
];

export default function Sidebar({ collapsed = false, onToggle, isMobile = false }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const handleConfirmLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  return (
    <aside className="h-full flex flex-col border-r border-outline-variant/10 bg-surface-container-lowest/80 backdrop-blur-3xl overflow-hidden">

      {/* ── Navigation ── */}
      <nav className="flex flex-col gap-1 flex-1 px-2 py-4 overflow-hidden">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => isMobile && onToggle()}
            title={collapsed ? label : ''}
            className={({ isActive }) =>
              `flex items-center rounded-2xl px-3 py-3 transition-all cursor-pointer group ${
                isActive
                  ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                  : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
              }`
            }
          >
            {/* Icon */}
            <span className="material-symbols-outlined text-[22px] shrink-0">{icon}</span>

            {/* Label — slides in/out */}
            <span
              className={`ml-4 text-sm font-semibold tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${
                collapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100'
              }`}
            >
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* ── Footer actions ── */}
      <div className="border-t border-outline-variant/10 px-2 py-4 flex flex-col gap-1">
        {/* Settings */}
        <div
          title={collapsed ? 'Settings' : ''}
          className="text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface rounded-2xl flex items-center px-3 py-3 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[22px] shrink-0">settings</span>
          <span className={`ml-4 text-sm font-semibold tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100'}`}>
            Settings
          </span>
        </div>

        {/* Logout */}
        <div
          onClick={() => setShowLogoutConfirm(true)}
          title={collapsed ? 'Logout' : ''}
          className="text-error hover:bg-error/10 rounded-2xl flex items-center px-3 py-3 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[22px] shrink-0">logout</span>
          <span className={`ml-4 text-sm font-semibold tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100'}`}>
            Logout
          </span>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to logout from your account?"
        confirmText="Logout"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </aside>
  );
}
