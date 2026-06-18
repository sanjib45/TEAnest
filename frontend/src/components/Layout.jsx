import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <div className="print:hidden">
        <Header />
      </div>
      <div className="flex flex-1 max-w-[1440px] w-full mx-auto relative">
        <div className="print:hidden">
          <Sidebar />
        </div>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-[calc(100vh-72px)] print:max-h-none print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
      {/* Background decorative leaf SVG */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-full opacity-10 pointer-events-none">
        <svg className="w-full h-full text-primary" viewBox="0 0 100 100">
          <path d="M10,90 Q30,10 50,50 T90,10" fill="none" stroke="currentColor" strokeWidth="0.2" />
          <path d="M5,85 Q25,5 45,45 T85,5" fill="none" stroke="currentColor" strokeWidth="0.1" />
        </svg>
      </div>
    </div>
  );
}
