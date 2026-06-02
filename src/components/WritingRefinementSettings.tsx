import React, { useState, useEffect } from 'react';
import { 
    getGlobalWritingRefinementSettings, 
    saveGlobalWritingRefinementSettings,
    getConnectionSettings,
    getProxyForTools
} from '../services/settingsService';
import { useGeminiModels } from '../hooks/useGeminiModels';
import { useToast } from './ToastSystem';
import { ToggleInput } from './ui/ToggleInput';
import { SelectInput } from './ui/SelectInput';
import { LabeledTextarea } from './ui/LabeledTextarea';

export const WritingRefinementSettings: React.FC = () => {
    const { showToast } = useToast();
    const [enabled, setEnabled] = useState(false);
    const [geminiModel, setGeminiModel] = useState('');
    const [promptText, setPromptText] = useState('');
    const { models: geminiModels, isLoading } = useGeminiModels([]);

    const conn = getConnectionSettings();
    const isProxyTools = getProxyForTools();
    const isGeminiSource = !isProxyTools && conn.source === 'gemini';

    useEffect(() => {
        const settings = getGlobalWritingRefinementSettings();
        setEnabled(settings.enabled);
        setGeminiModel(settings.gemini_model);
        setPromptText(settings.writing_refinement_prompt);
    }, []);

    const handleSave = () => {
        saveGlobalWritingRefinementSettings({
            enabled,
            gemini_model: geminiModel,
            writing_refinement_prompt: promptText
        });
        showToast('Đã lưu cấu hình Cải thiện văn chương', 'success');
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-teal-400 mb-4">Cài đặt Cải thiện Văn chương</h3>
                <div className="space-y-4">
                    <ToggleInput 
                        label="Bật Cải thiện Văn chương"
                        checked={enabled}
                        onChange={setEnabled}
                    />

                    {enabled && isGeminiSource && (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                            <label className="block text-sm font-bold text-indigo-300 mb-2">Mô hình Google Gemini (Chuyên dụng)</label>
                            <SelectInput
                                value={geminiModel}
                                onChange={(e) => setGeminiModel(e.target.value)}
                                options={geminiModels.map(m => ({ value: m.id, label: m.name }))}
                                disabled={isLoading}
                            />
                        </div>
                    )}
                    
                    {enabled && !isGeminiSource && (
                         <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                            <p className="text-sm text-slate-300">
                                Đang sử dụng {isProxyTools || conn.source === 'proxy' ? 'Proxy Tool Model' : 'OpenRouter Model'} (Được cấu hình trong Thiết lập API)
                            </p>
                        </div>
                    )}

                    {enabled && (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                            <h4 className="text-sm font-bold text-teal-300 mb-2">Tùy chỉnh Lời nhắc (Prompt)</h4>
                            <LabeledTextarea
                                label="Lời nhắc (System Prompt)"
                                value={promptText}
                                onChange={(e) => setPromptText(e.target.value)}
                                rows={17}
                                placeholder="Nhập lời nhắc tuỳ chỉnh cho Cải thiện Văn chương..."
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end border-t border-slate-700 pt-4">
                <button
                    onClick={handleSave}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-colors"
                >
                    Lưu cấu hình
                </button>
            </div>
        </div>
    );
};
