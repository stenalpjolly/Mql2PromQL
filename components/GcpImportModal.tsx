import React from 'react';

interface GcpImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GcpImportModal: React.FC<GcpImportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const script = `gcloud monitoring policies list --format="json" | \\
jq '[.[] | .displayName as $pname | .conditions[]? | select(.conditionMonitoringQueryLanguage != null) | {name: ($pname + " : " + (.displayName // "Condition")), mql: .conditionMonitoringQueryLanguage.query}]' \\
> mql_queries.json`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800">Import from Google Cloud</h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">Direct Connection Unavailable</p>
            <p>
              Due to security constraints, this web app cannot directly access your private GCP project. 
              However, you can easily export your queries using Cloud Shell.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-700 mb-2">Step 1: Run in Cloud Shell</h4>
            <p className="text-sm text-slate-600 mb-3">
              Copy the command below and paste it into your <a href="https://shell.cloud.google.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google Cloud Shell</a>. 
              It uses <code>gcloud</code> to fetch alerting policies and <code>jq</code> to extract the MQL queries into a JSON file.
            </p>
            <div className="relative group">
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
{script}
                </pre>
                <button
                    onClick={() => navigator.clipboard.writeText(script)}
                    className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Copy to clipboard"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-700 mb-2">Step 2: Upload File</h4>
            <p className="text-sm text-slate-600">
              Download the generated <code>mql_queries.json</code> file from Cloud Shell and upload it here using the <strong>"+ Add Files"</strong> button.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
             <button 
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
             >
                Close
             </button>
        </div>
      </div>
    </div>
  );
};

export default GcpImportModal;