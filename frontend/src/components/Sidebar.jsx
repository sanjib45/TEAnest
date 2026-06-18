import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/inventory', icon: 'inventory_2', label: 'Inventory' },
  { to: '/labor', icon: 'groups', label: 'Labor' },
  { to: '/sales', icon: 'potted_plant', label: 'Sales' },
  { to: '/payments', icon: 'payments', label: 'Payments' },
  { to: '/reports', icon: 'assessment', label: 'Reports' },
];

export default function Sidebar() {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const handleConfirmLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  return (
    <aside className="h-full w-72 flex flex-col border-r border-outline-variant/10 bg-surface-container-lowest/80 backdrop-blur-3xl p-8 gap-8">
      {/* Logo Area */}
      <div className="flex items-center gap-3 pl-2 py-4">
        <div className="w-14 h-14 rounded-full overflow-hidden flex justify-center items-start shadow-sm bg-white border-2 border-white shrink-0">
          <img src="/logo.png" alt="TEAnest Logo" className="h-[115%] max-w-none -mt-[10%]" />
        </div>
        <h2 className="font-headline text-2xl text-primary font-bold tracking-tight">
          TEAnest
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-1 mt-4">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'bg-primary/10 text-primary rounded-2xl font-bold flex items-center gap-4 px-5 py-3.5 cursor-pointer shadow-sm shadow-primary/5 transition-all'
                : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface rounded-2xl flex items-center gap-4 px-5 py-3.5 transition-all cursor-pointer hover:translate-x-1'
            }
          >
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
            <span className="text-sm font-semibold tracking-wide">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="border-t border-outline-variant/10 pt-6 flex flex-col gap-2">
        <div className="text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface rounded-2xl flex items-center gap-4 px-5 py-3.5 transition-all cursor-pointer">
          <span className="material-symbols-outlined text-[22px]">settings</span>
          <span className="text-sm font-semibold tracking-wide">Settings</span>
        </div>
        <div onClick={() => setShowLogoutConfirm(true)} className="text-error hover:bg-error/10 hover:text-error rounded-2xl flex items-center gap-4 px-5 py-3.5 transition-all cursor-pointer">
          <span className="material-symbols-outlined text-[22px]">logout</span>
          <span className="text-sm font-semibold tracking-wide">Logout</span>
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
