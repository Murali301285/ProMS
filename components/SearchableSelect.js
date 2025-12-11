'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import styles from '@/app/dashboard/settings/Settings.module.css'; // Reusing styles

export default function SearchableSelect({
    options = [],
    value,
    onChange,
    placeholder = 'Select...',
    name,
    error,
    autoFocus
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightindex, setHighlightIndex] = useState(0);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Filter options based on search
    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    // Get display label for current value
    const selectedLabel = options.find(opt => opt.id === value)?.name || '';

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Handle outside click to close
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearch(''); // Reset search on close
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll highlighted item into view
    useEffect(() => {
        if (isOpen && listRef.current && filteredOptions.length > 0) {
            const item = listRef.current.children[highlightindex];
            if (item) {
                item.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightindex, isOpen, filteredOptions.length]);


    const handleSelect = (option) => {
        onChange({ target: { name, value: option.id } });
        setIsOpen(false);
        setSearch('');
        // Focus next element logic handled by parent form or native tab behavior?
        // User requested: "highlighted details ... selected and control focus should be moved to next control"
        // We will focus the wrapper div to ensure tab flow, but the parent form's 'Enter' logic might handle the jump.
        // Actually, let's try to programmatically find the next input if required, but standard behavior is usually best left to browser unless 'Enter' is pressed.
    };

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightIndex(prev => (prev + 1) % filteredOptions.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
                break;
            case 'Enter':
            case 'Tab':
                if (filteredOptions.length > 0) {
                    if (e.key === 'Enter') e.preventDefault(); // Prevent form submit
                    handleSelect(filteredOptions[highlightindex]);

                    // Specific requirement: "control focus should be moved to next control"
                    // We can attempt to simulate a Tab press or find the next focusable element.
                    if (e.key === 'Enter') {
                        setTimeout(() => {
                            const form = wrapperRef.current.closest('form');
                            if (form) {
                                const focusable = Array.from(form.querySelectorAll('input, button, textarea, [tabindex]:not([tabindex="-1"])'));
                                // The wrapper itself might be focusable or the hidden input?
                                // Best is to find the container div index
                                const currentIndex = focusable.indexOf(wrapperRef.current.querySelector('button')); // The toggle button
                                if (currentIndex > -1 && currentIndex < focusable.length - 1) {
                                    focusable[currentIndex + 1].focus();
                                }
                            }
                        }, 0);
                    }
                } else {
                    if (e.key === 'Tab') {
                        setIsOpen(false);
                    }
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    return (
        <div className={styles.selectWrapper} ref={wrapperRef} style={{ position: 'relative' }}>
            {/* Main Display Button */}
            <button
                type="button"
                className={`${styles.input} ${error ? styles.errorBorder : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'var(--input)' }}
                autoFocus={autoFocus}
            >
                <span style={{ opacity: value ? 1 : 0.5 }}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown size={16} opacity={0.5} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className={styles.dropdownMenu} style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    background: 'var(--card)', // or input background
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    zIndex: 100,
                    marginTop: '4px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    {/* Search Input */}
                    <div style={{ padding: '8px', position: 'sticky', top: 0, background: 'inherit', borderBottom: '1px solid var(--border)' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setHighlightIndex(0);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Search..."
                            className={styles.input}
                            style={{ padding: '6px', fontSize: '0.85rem' }}
                        />
                    </div>

                    {/* Options List */}
                    <div ref={listRef}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, index) => (
                                <div
                                    key={opt.id}
                                    className={styles.option}
                                    style={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        background: index === highlightindex ? 'var(--primary)' : 'transparent',
                                        color: index === highlightindex ? 'var(--primary-foreground)' : 'var(--foreground)',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                    onClick={() => handleSelect(opt)}
                                    onMouseEnter={() => setHighlightIndex(index)}
                                >
                                    {opt.name}
                                    {value === opt.id && <Check size={14} />}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '12px', textAlign: 'center', opacity: 0.5, fontSize: '0.85rem' }}>
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
