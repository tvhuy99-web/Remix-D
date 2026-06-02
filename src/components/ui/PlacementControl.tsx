
import React from 'react';

interface PlacementControlProps {
    value: 'before' | 'after' | undefined;
    onChange: (val: 'before' | 'after' | undefined) => void;
    className?: string;
}

export const PlacementControl: React.FC<PlacementControlProps> = ({ value, onChange, className = '' }) => {
    const optionClass = (active: boolean, colorClass: string) => 
        `flex-1 px-2 py-1 text-xs font-bold  flex items-center justify-center gap-1 ${
            active ? `${colorClass} text-white shadow-sm` : 'text-slate-400 hover:text-slate-200 hover:bg-slate-600/50'
        }`;

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <label className="text-sm font-medium text-slate-300 mb-1">Vị trí</label>
            <div className="flex bg-slate-700 border border-slate-600 rounded-md p-1 w-full" role="radiogroup" aria-label="Placement">
                <button 
                    role="radio"
                    aria-checked={value === undefined}
                    onClick={() => onChange(undefined)} 
                    className={`rounded-l-sm outline-none focus:ring-1 focus:ring-sky-500 ${optionClass(value === undefined, 'bg-slate-600')}`} 
                    title="Mặc định"
                >
                    Mặc định
                </button>
                <button 
                    role="radio"
                    aria-checked={value === 'before'}
                    onClick={() => onChange('before')} 
                    className={`outline-none focus:ring-1 focus:ring-sky-500 ${optionClass(value === 'before', 'bg-sky-600')}`} 
                    title="Đầu Prompt"
                >
                    Đầu
                </button>
                <button 
                    role="radio"
                    aria-checked={value === 'after'}
                    onClick={() => onChange('after')} 
                    className={`rounded-r-sm outline-none focus:ring-1 focus:ring-sky-500 ${optionClass(value === 'after', 'bg-violet-600')}`} 
                    title="Cuối Prompt"
                >
                    Cuối
                </button>
            </div>
        </div>
    );
};
