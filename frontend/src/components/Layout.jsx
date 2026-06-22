import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default hidden on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Update isMobile state on window resize
  useState(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen w-full bg-surface overflow-hidden font-sans relative">
      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — Off-canvas on mobile, collapsable on desktop */}
      <div
        className={`print:hidden z-40 shadow-xl shadow-primary/5 flex-shrink-0 transition-all duration-300 ease-in-out absolute md:relative h-full ${
          isMobile
            ? `fixed inset-y-0 left-0 bg-white ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'}`
            : sidebarOpen ? 'w-72 translate-x-0' : 'w-[72px] translate-x-0'
        }`}
      >
        <Sidebar 
          collapsed={!isMobile && !sidebarOpen} 
          onToggle={() => setSidebarOpen(o => !o)} 
          isMobile={isMobile}
        />
      </div>

      {/* Main Scrollable Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 print:overflow-visible print:h-auto print:p-0">
        {/* Mobile Header (only visible on small screens) */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl hover:bg-surface-container transition-all text-on-surface-variant active:scale-90"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="font-headline font-bold text-primary text-lg">TEAnest</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 scroll-smooth">
          <div className="max-w-[1600px] mx-auto w-full animate-fadeIn">
            <Outlet />
          </div>
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
