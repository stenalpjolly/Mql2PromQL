import React from 'react';
import { ExampleItem } from '../types';

interface ExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  examples: ExampleItem[];
  onSelect: (example: ExampleItem) => void;
}

const ExamplesModal: React.FC<ExamplesModalProps> = ({ isOpen, onClose, examples, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Example Conversions</h3>
            <p className="text-sm text-slate-500 mt-1">Select an example to load it into the editor.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="overflow-y-auto p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 gap-6">
            {examples.map((example, index) => (
              <div 
                key={index}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-slate-800 text-lg">{example.title}</h4>
                        <p className="text-slate-600 text-sm mt-1">{example.description}</p>
                    </div>
                    <button
                        onClick={() => onSelect(example)}
                        className="flex-shrink-0 ml-4 px-4 py-2 bg-blue-50 text-blue-700 font-semibold rounded-md hover:bg-blue-100 transition-colors text-sm flex items-center gap-2"
                    >
                        <span>Load</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    <div className="p-4 bg-slate-50">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">MQL</div>
                        <pre className="text-xs font-mono text-slate-800 bg-white p-3 rounded border border-slate-200 overflow-x-auto whitespace-pre-wrap">
                            {example.mql}
                        </pre>
                    </div>
                    <div className="p-4 bg-blue-50/30">
                        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">PromQL</div>
                        <pre className="text-xs font-mono text-blue-900 bg-white p-3 rounded border border-blue-100 overflow-x-auto whitespace-pre-wrap">
                            {example.promql}
                        </pre>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamplesModal;