import React, { useState, useRef, useCallback } from 'react';
import { BatchItem } from '../types';
import { convertMqlToPromql } from '../services/geminiService';
import GcpImportModal from './GcpImportModal';

const BatchMode: React.FC = () => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newItems: BatchItem[] = [];
      const files = Array.from(e.target.files) as File[];

      for (const file of files) {
        const text = await file.text();
        
        // Handle JSON file containing an array of queries
        if (file.name.endsWith('.json')) {
            try {
                const json = JSON.parse(text);
                if (Array.isArray(json)) {
                    json.forEach((query, idx) => {
                        if (typeof query === 'string') {
                            newItems.push({
                                id: crypto.randomUUID(),
                                name: `${file.name} [${idx + 1}]`,
                                mql: query,
                                status: 'IDLE'
                            });
                        } else if (typeof query === 'object' && query.mql) {
                             newItems.push({
                                id: crypto.randomUUID(),
                                name: query.name || `${file.name} [${idx + 1}]`,
                                mql: query.mql,
                                status: 'IDLE'
                            });
                        }
                    });
                }
            } catch (err) {
                console.error("Failed to parse JSON file", file.name, err);
                // Fallback: treat as single text if JSON parse fails? No, simpler to error or ignore.
                 newItems.push({
                    id: crypto.randomUUID(),
                    name: file.name,
                    mql: text,
                    status: 'ERROR',
                    error: "Invalid JSON format"
                });
            }
        } else {
            // Treat as plain text (single query per file)
            newItems.push({
                id: crypto.randomUUID(),
                name: file.name,
                mql: text,
                status: 'IDLE'
            });
        }
      }

      setItems(prev => [...prev, ...newItems]);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    
    // Process sequentially to be gentle on rate limits
    // We create a copy of items to update state as we go
    const itemsToProcess = items.filter(i => i.status === 'IDLE' || i.status === 'ERROR');

    for (const item of itemsToProcess) {
      // Update status to CONVERTING
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'CONVERTING', error: undefined } : i));

      try {
        const result = await convertMqlToPromql(item.mql);
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'SUCCESS', result } : i));
      } catch (error: any) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'ERROR', error: error.message } : i));
      }
    }

    setIsProcessing(false);
  };

  const handleRemove = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleClearAll = () => {
    setItems([]);
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setExpandedItems(newSet);
  };

  const handleExport = () => {
    const data = items.map(item => ({
        name: item.name,
        mql: item.mql,
        promql: item.result?.promql || '',
        explanation: item.result?.explanation || '',
        status: item.status,
        error: item.error
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mql-migration-export-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const completedCount = items.filter(i => i.status === 'SUCCESS').length;
  const errorCount = items.filter(i => i.status === 'ERROR').length;
  const totalCount = items.length;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4 justify-between items-center">
            <div>
                <h3 className="font-bold text-slate-700">Batch Processing</h3>
                <p className="text-xs text-slate-500">
                    Upload multiple files (.txt, .mql) or a single JSON list.
                </p>
            </div>
            <div className="flex gap-2">
                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".txt,.mql,.json"
                />
                <button
                    onClick={() => setShowImportModal(true)}
                    className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm font-medium hover:bg-blue-100 shadow-sm transition-colors flex items-center gap-1.5"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Import from GCP
                </button>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-700 text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors"
                >
                    + Add Files
                </button>
                {items.length > 0 && (
                    <>
                        <button
                            onClick={handleProcess}
                            disabled={isProcessing || items.every(i => i.status === 'SUCCESS')}
                            className={`px-3 py-2 rounded-md text-white text-sm font-medium shadow-sm transition-colors ${
                                isProcessing || items.every(i => i.status === 'SUCCESS')
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {isProcessing ? 'Processing...' : `Convert All (${items.filter(i => i.status !== 'SUCCESS').length})`}
                        </button>
                        <button
                            onClick={handleExport}
                            className="px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-700 text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors"
                        >
                            Export Results
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
                        >
                            Clear
                        </button>
                    </>
                )}
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto bg-slate-50/50 p-4">
            {items.length === 0 ? (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-full border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-blue-400 hover:bg-blue-50/10 transition-colors p-8"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <p className="font-medium text-lg">Drop files here or click to upload</p>
                    <p className="text-sm mt-2 max-w-md text-center">
                        Supports multiple <code>.txt</code>/<code>.mql</code> files (one query per file) or a <code>.json</code> file containing an array of queries.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Progress Summary */}
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
                        <span>Queue ({totalCount})</span>
                        <span>Success: {completedCount} | Errors: {errorCount}</span>
                    </div>

                    {/* List Items */}
                    {items.map((item) => (
                        <div key={item.id} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden transition-all">
                            <div 
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50"
                                onClick={() => toggleExpand(item.id)}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {/* Status Icon */}
                                    <div className="flex-shrink-0">
                                        {item.status === 'IDLE' && <div className="w-2 h-2 rounded-full bg-slate-300" />}
                                        {item.status === 'CONVERTING' && (
                                            <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        )}
                                        {item.status === 'SUCCESS' && (
                                            <svg className="w-4 h-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        )}
                                        {item.status === 'ERROR' && (
                                            <svg className="w-4 h-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 truncate">{item.name}</span>
                                    {item.status === 'SUCCESS' && (
                                         <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                            item.result?.confidence === 'High' ? 'bg-green-50 text-green-700 border-green-200' :
                                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>
                                            {item.result?.confidence}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Remove item"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                    <svg 
                                        className={`w-4 h-4 text-slate-400 transition-transform ${expandedItems.has(item.id) ? 'rotate-180' : ''}`} 
                                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedItems.has(item.id) && (
                                <div className="border-t border-slate-100 bg-slate-50 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-500 font-sans font-semibold uppercase">Input MQL</span>
                                        <div className="bg-white p-2 rounded border border-slate-200 overflow-x-auto whitespace-pre-wrap max-h-40">
                                            {item.mql}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-blue-600 font-sans font-semibold uppercase">
                                            {item.status === 'ERROR' ? 'Error' : 'Output PromQL'}
                                        </span>
                                        {item.status === 'ERROR' ? (
                                             <div className="bg-red-50 p-2 rounded border border-red-200 text-red-600 overflow-x-auto">
                                                {item.error}
                                             </div>
                                        ) : item.result ? (
                                            <div className="bg-white p-2 rounded border border-blue-200 text-blue-900 overflow-x-auto whitespace-pre-wrap max-h-40">
                                                {item.result.promql}
                                            </div>
                                        ) : (
                                            <div className="text-slate-400 italic">Waiting to convert...</div>
                                        )}
                                        {item.result?.explanation && (
                                            <div className="mt-2 text-slate-600 font-sans bg-blue-50/50 p-2 rounded border border-blue-100/50">
                                                {item.result.explanation}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        <GcpImportModal 
            isOpen={showImportModal} 
            onClose={() => setShowImportModal(false)} 
        />
    </div>
  );
};

export default BatchMode;