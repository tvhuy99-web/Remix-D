
import React, { useId } from 'react';
import { Tooltip } from '../Tooltip';

interface ToggleInputProps {
    label?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    tooltip?: string;
    disabled?: boolean;
    className?: string;
    clean?: boolean; // New prop for removing background/padding
}

export const ToggleInput: React.FC<ToggleInputProps> = ({ 
    label, 
    checked, 
    onChange, 
    tooltip, 
    disabled, 
    className = '',
    clean = false 
}) => {
    const id = useId();
    const baseStyle = clean 
        ? "flex items-center justify-between" 
        : "flex items-center justify-between bg-slate-700/50 p-3 rounded-lg";

    return (
        <div 
            className={`${baseStyle} ${className} cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="switch"
            aria-checked={checked}
            aria-disabled={disabled}
            aria-label={label}
            aria-description={tooltip}
            tabIndex={disabled ? -1 : 0}
            onClick={(e) => {
                e.preventDefault();
                if (!disabled) onChange(!checked);
            }}
            onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    if (!disabled) onChange(!checked);
                }
            }}
        >
            <div className="flex-grow mr-3" aria-hidden="true">
                <Tooltip text={tooltip}>
                    {label && (
                        <span 
                            className={`text-sm font-medium ${disabled ? 'text-slate-500' : 'text-slate-300'}`}
                        >
                            {label}
                        </span>
                    )}
                </Tooltip>
            </div>
            <div
                className={`${
                    checked ? 'bg-sky-500' : 'bg-slate-600'
                } relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ease-in-out`}
                aria-hidden="true"
            >
                <span
                    className={`${
                        checked ? 'translate-x-4' : 'translate-x-0'
                    } inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ease-in-out`}
                />
            </div>
        </div>
    );
};
