import React from 'react';

interface CodeEditorProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  languageLabel?: string;
  className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  label,
  value,
  onChange,
  readOnly = false,
  placeholder,
  languageLabel,
  className = ""
}) => {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex justify-between items-center mb-2 px-1">
        <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{label}</label>
        {languageLabel && (
          <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
            {languageLabel}
          </span>
        )}
      </div>
      <div className="relative flex-grow rounded-lg border border-slate-300 bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all">
        <textarea
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`w-full h-full p-4 font-mono text-sm resize-none outline-none ${
            readOnly ? 'bg-slate-50 text-slate-800' : 'bg-white text-slate-900'
          }`}
          spellCheck={false}
        />
        {readOnly && value && (
           <div className="absolute top-2 right-2">
             <button
                onClick={() => navigator.clipboard.writeText(value)}
                className="p-1.5 bg-white/80 hover:bg-white border border-slate-200 rounded-md text-slate-500 hover:text-blue-600 transition-colors shadow-sm"
                title="Copy to clipboard"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                 <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
               </svg>
             </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
