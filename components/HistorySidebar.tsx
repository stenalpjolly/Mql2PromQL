import React from 'react';
import { ConversionHistoryItem } from '../types';

interface HistorySidebarProps {
  history: ConversionHistoryItem[];
  onSelect: (item: ConversionHistoryItem) => void;
  onClear: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onSelect, onClear }) => {
  return (
    <div className="w-full md:w-64 bg-white border-l border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-700">Recent</h3>
        {history.length > 0 && (
            <button 
                onClick={onClear} 
                className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
                Clear
            </button>
        )}
      </div>
      <div className="overflow-y-auto flex-grow p-2 space-y-2">
        {history.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-8 italic">
            No recent conversions
          </div>
        ) : (
          history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    item.confidence === 'High' ? 'bg-green-100 text-green-700 border-green-200' :
                    item.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    'bg-red-100 text-red-700 border-red-200'
                }`}>
                    {item.confidence}
                </span>
                <span className="text-[10px] text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <div className="font-mono text-xs text-slate-600 truncate opacity-80 group-hover:opacity-100">
                {item.mql}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default HistorySidebar;
