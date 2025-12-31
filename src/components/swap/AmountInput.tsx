'use client';

import { useRef } from 'react';

interface AmountInputProps {
    value: string;
    onChange: (value: string) => void;
    balance?: string;
    symbol?: string;
    fiatValue?: string;
    disabled?: boolean;
    label: string;
    readOnly?: boolean;
}

export default function AmountInput({
    value,
    onChange,
    balance,
    symbol,
    fiatValue = '$0',
    disabled = false,
    label,
    readOnly = false,
}: AmountInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle input change with validation
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;

        // Allow empty string
        if (val === '') {
            onChange('');
            return;
        }

        // Validate numeric input with decimals
        if (/^\d*\.?\d*$/.test(val)) {
            onChange(val);
        }
    };

    return (
        <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
            <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={value}
                onChange={handleChange}
                placeholder="0"
                disabled={disabled}
                readOnly={readOnly}
                autoFocus={!readOnly && value === ''}
                className={`
                    w-full bg-transparent text-4xl font-display font-medium text-white 
                    placeholder:text-white/10 outline-none p-0 overflow-hidden text-ellipsis
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${readOnly ? 'cursor-default transition-all duration-300' : ''}
                    ${value.length > 8 ? 'text-3xl' : value.length > 12 ? 'text-2xl' : ''}
                `}
            />
            <div className="text-sm font-medium text-zinc-500">
                {fiatValue}
            </div>
        </div>
    );
}
