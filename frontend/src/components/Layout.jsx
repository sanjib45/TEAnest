import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex h-screen w-full bg-surface overflow-hidden font-sans">
      {/* Sidebar Area */}
      <div className="print:hidden z-20 shadow-xl shadow-primary/5">
        <Sidebar />
      </div>

      {/* Main Scrollable Content */}
      <main className="flex-1 h-full overflow-y-auto p-6 md:p-10 lg:p-12 relative z-10 scroll-smooth print:overflow-visible print:h-auto print:p-0">
        <div className="max-w-[1600px] mx-auto w-full animate-fadeIn">
          <Outlet />
        </div>
      </main>

      {/* Background decorative leaf SVG */}
      <div className="fixed top-0 right-0 z-0 w-1/3 h-full opacity-[0.03] pointer-events-none">
        <svg className="w-full h-full text-primary" viewBox="0 0 100 100">
          <path d="M10,90 Q30,10 50,50 T90,10" fill="none" stroke="currentColor" strokeWidth="0.2" />
          <path d="M5,85 Q25,5 45,45 T85,5" fill="none" stroke="currentColor" strokeWidth="0.1" />
        </svg>
      </div>
    </div>
  );
}
