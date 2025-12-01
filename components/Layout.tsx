import React from 'react';
import { APP_TITLE, APP_DESCRIPTION } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold shadow-sm">
                    M
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">{APP_TITLE}</h1>
                    <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Google Cloud Monitoring Migration Tool</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                 <a href="https://cloud.google.com/monitoring/mql/to-promql" target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    Migration Guide &rarr;
                 </a>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col h-[calc(100vh-64px)] overflow-hidden">
         {children}
      </main>
    </div>
  );
};

export default Layout;
