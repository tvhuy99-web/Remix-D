import React from 'react';
import { Loader } from './Loader';

interface WritingRefinementModalProps {
    isOpen: boolean;
    originalText: string;
    refinedText: string;
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    onRetry: () => void;
    onClose: () => void;
}

export const WritingRefinementModal: React.FC<WritingRefinementModalProps> = ({
    isOpen,
    originalText,
    refinedText,
    isLoading,
    onConfirm,
    onCancel,
    onRetry,
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-teal-400">Cải thiện Cốt truyện</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-2xl">&times;</button>
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 p-6">
                    {/* Left side - Original */}
                    <div className="flex-1 bg-slate-800/30 border border-slate-700 rounded-lg p-6 flex flex-col overflow-y-auto">
                        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Bản gốc</h3>
                        <div className="flex-1 whitespace-pre-wrap text-slate-300 font-serif leading-relaxed text-lg">
                            {originalText}
                        </div>
                    </div>
                    
                    {/* Right side - Refined */}
                    <div className="flex-1 bg-slate-800/80 border border-teal-700/50 rounded-lg p-6 flex flex-col overflow-y-auto relative shadow-[0_0_15px_rgba(20,184,166,0.1)]">
                        <h3 className="text-sm font-bold text-teal-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span>Bản cải thiện</span>
                            {isLoading && <span className="animate-spin">⏳</span>}
                        </h3>
                        <div className="flex-1 whitespace-pre-wrap text-slate-200 font-serif leading-relaxed text-lg">
                            {isLoading && !refinedText ? (
                                <div className="flex flex-col items-center justify-center h-full text-teal-500/50 space-y-4">
                                    <Loader />
                                    <span className="text-sm font-medium tracking-wide">AI đang viết lại...</span>
                                </div>
                            ) : (
                                refinedText || <span className="text-slate-500 italic">Chưa có kết quả...</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-800/50 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold text-white transition-colors disabled:opacity-50"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={onRetry}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 font-bold text-white transition-colors disabled:opacity-50 border border-indigo-500/50 flex items-center gap-2"
                    >
                        <span>Thử lại</span>
                        <span className="text-sm">🔄</span>
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading || !refinedText}
                        className="px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 font-bold text-white transition-colors disabled:opacity-50 shadow-lg shadow-teal-900/50 flex items-center gap-2"
                    >
                        <span>Áp dụng bản dịch</span>
                        <span className="text-sm">✨</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
