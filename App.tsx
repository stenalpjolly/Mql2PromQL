import React, { useState, useCallback } from 'react';
import Layout from './components/Layout';
import CodeEditor from './components/CodeEditor';
import HistorySidebar from './components/HistorySidebar';
import ExamplesModal from './components/ExamplesModal';
import { convertMqlToPromql } from './services/geminiService';
import { ConversionResult, ConversionHistoryItem, LoadingState, ExampleItem } from './types';
import { APP_DESCRIPTION, MIGRATION_EXAMPLES } from './constants';

function App() {
  const [mqlInput, setMqlInput] = useState<string>('');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(true);
  const [showExamples, setShowExamples] = useState<boolean>(false);

  const handleConvert = async () => {
    if (!mqlInput.trim()) return;

    setLoadingState(LoadingState.LOADING);
    setErrorMsg(null);
    setResult(null);

    try {
      const conversionResult = await convertMqlToPromql(mqlInput);
      setResult(conversionResult);
      setLoadingState(LoadingState.SUCCESS);

      // Add to history
      const historyItem: ConversionHistoryItem = {
        ...conversionResult,
        id: crypto.randomUUID(),
        mql: mqlInput,
        timestamp: Date.now(),
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 20)); // Keep last 20
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleSelectHistory = useCallback((item: ConversionHistoryItem) => {
    setMqlInput(item.mql);
    setResult({
        promql: item.promql,
        explanation: item.explanation,
        confidence: item.confidence,
        references: item.references
    });
    setLoadingState(LoadingState.SUCCESS);
    setErrorMsg(null);
  }, []);

  const handleSelectExample = useCallback((example: ExampleItem) => {
    setMqlInput(example.mql);
    setResult({
        promql: example.promql,
        explanation: example.explanation,
        confidence: 'High'
    });
    setLoadingState(LoadingState.SUCCESS);
    setErrorMsg(null);
    setShowExamples(false);
  }, []);

  const handleClearHistory = () => {
      setHistory([]);
  };

  const handleClearEditor = () => {
      setMqlInput('');
      setResult(null);
      setErrorMsg(null);
      setLoadingState(LoadingState.IDLE);
  };

  return (
    <Layout>
      <div className="flex flex-grow overflow-hidden">
        {/* Main Workspace */}
        <div className="flex-grow flex flex-col p-4 sm:p-6 overflow-y-auto">
          
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
             <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Migrate Queries</h2>
                <p className="text-slate-600">{APP_DESCRIPTION}</p>
             </div>
             <button
               onClick={() => setShowExamples(true)}
               className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-slate-700 font-medium hover:bg-slate-50 hover:text-blue-600 transition-colors whitespace-nowrap"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
               View Examples
             </button>
          </div>

          <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
            {/* Input Column */}
            <div className="flex flex-col h-full gap-4">
               <div className="flex-grow">
                 <CodeEditor 
                    label="MQL (Monitoring Query Language)" 
                    languageLabel="MQL"
                    value={mqlInput} 
                    onChange={setMqlInput}
                    placeholder="fetch gce_instance | metric 'compute.googleapis.com/instance/cpu/utilization' | group_by 1h, [value_utilization_mean: mean(value.utilization)]"
                    className="h-[400px] lg:h-full"
                 />
               </div>
               <div className="flex gap-3">
                   <button
                    onClick={handleConvert}
                    disabled={loadingState === LoadingState.LOADING || !mqlInput.trim()}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white shadow-md transition-all 
                        ${loadingState === LoadingState.LOADING || !mqlInput.trim() 
                            ? 'bg-blue-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-[0.99]'}`}
                   >
                     {loadingState === LoadingState.LOADING ? (
                         <span className="flex items-center justify-center gap-2">
                             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                             Converting...
                         </span>
                     ) : 'Convert to PromQL'}
                   </button>
                   <button 
                    onClick={handleClearEditor}
                    className="px-4 py-3 rounded-lg border border-slate-300 font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                   >
                       Clear
                   </button>
               </div>
            </div>

            {/* Output Column */}
            <div className="flex flex-col h-full gap-4">
                <div className="flex-grow relative">
                    <CodeEditor 
                        label="PromQL (Prometheus Query Language)" 
                        languageLabel="PromQL"
                        value={result ? result.promql : ''} 
                        readOnly={true}
                        placeholder={loadingState === LoadingState.LOADING ? "Checking documentation and thinking..." : "Result will appear here..."}
                        className="h-[400px] lg:h-full"
                    />
                    
                    {/* Error Overlay */}
                    {loadingState === LoadingState.ERROR && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-6 text-center z-10 border border-red-100">
                             <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                             </div>
                             <h3 className="text-lg font-bold text-slate-800">Conversion Failed</h3>
                             <p className="text-slate-600 mt-2 max-w-xs">{errorMsg}</p>
                             <button onClick={() => setLoadingState(LoadingState.IDLE)} className="mt-4 text-blue-600 hover:underline font-medium text-sm">Dismiss</button>
                        </div>
                    )}
                </div>

                {/* Explanation Card */}
                {result && (
                    <div className="flex flex-col gap-3 animate-fade-in">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">Gemini Analysis</h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                                    result.confidence === 'High' ? 'bg-green-100 text-green-800 border-green-200' :
                                    result.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                    'bg-red-100 text-red-800 border-red-200'
                                }`}>
                                    {result.confidence} Confidence
                                </span>
                            </div>
                            <p className="text-sm text-blue-800 leading-relaxed">
                                {result.explanation}
                            </p>
                        </div>

                        {/* References Section */}
                        {result.references && result.references.length > 0 && (
                            <div className="bg-white border border-slate-200 rounded-lg p-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                    Sources & Documentation
                                </h4>
                                <ul className="space-y-1">
                                    {result.references.map((ref, idx) => (
                                        <li key={idx} className="text-sm truncate">
                                            <a 
                                                href={ref.uri} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5"
                                            >
                                                <span className="truncate">{ref.title}</span>
                                                <svg className="flex-shrink-0 w-3 h-3 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* History Sidebar Toggle (Mobile) */}
        <button 
            className="md:hidden fixed bottom-4 right-4 z-50 bg-slate-800 text-white p-3 rounded-full shadow-lg"
            onClick={() => setShowHistory(!showHistory)}
        >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
        </button>

        {/* Sidebar */}
        <div className={`${showHistory ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 fixed inset-y-0 right-0 z-40 md:static md:block transition-transform duration-300 ease-in-out bg-white shadow-xl md:shadow-none h-full`}>
            <div className="md:hidden absolute top-0 left-0 -ml-10 p-2">
                 <button onClick={() => setShowHistory(false)} className="text-white">Close</button>
            </div>
            <HistorySidebar 
                history={history} 
                onSelect={handleSelectHistory} 
                onClear={handleClearHistory}
            />
        </div>

        <ExamplesModal 
          isOpen={showExamples}
          onClose={() => setShowExamples(false)}
          examples={MIGRATION_EXAMPLES}
          onSelect={handleSelectExample}
        />
      </div>
    </Layout>
  );
}

export default App;