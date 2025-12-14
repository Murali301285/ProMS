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
    autoFocus,
    className,
    multiple = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightindex, setHighlightIndex] = useState(0);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Filter options based on search
    const safeOptions = Array.isArray(options) ? options : [];
    const filteredOptions = safeOptions.filter(opt =>
        opt.name && opt.name.toLowerCase().includes(search.toLowerCase())
    );

    // Get display label
    let selectedLabel = '';
    if (multiple) {
        if (Array.isArray(value) && value.length > 0) {
            selectedLabel = value.map(id => options.find(o => o.id == id)?.name).filter(Boolean).join(', ');
        }
    } else {
        selectedLabel = options.find(opt => opt.id == value)?.name || '';
    }

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
                setSearch('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll highlighted
    useEffect(() => {
        if (isOpen && listRef.current && filteredOptions.length > 0) {
            const item = listRef.current.children[highlightindex];
            if (item) {
                item.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightindex, isOpen, filteredOptions.length]);


    const handleSelect = (option) => {
        if (multiple) {
            let newValue = Array.isArray(value) ? [...value] : [];
            if (newValue.includes(option.id)) {
                newValue = newValue.filter(id => id !== option.id);
            } else {
                newValue.push(option.id);
            }
            onChange({ target: { name, value: newValue } });
            // Keep open for multiple choice
            inputRef.current?.focus();
        } else {
            onChange({ target: { name, value: option.id } });
            setIsOpen(false);
            setSearch('');
        }
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
            // Check if highlighting "Select All" / "Clear All" buttons? No, simple list focus for now.
            case 'Tab':
                if (filteredOptions.length > 0) {
                    if (e.key === 'Enter') e.preventDefault();
                    handleSelect(filteredOptions[highlightindex]);

                    if (!multiple && e.key === 'Enter') {
                        // Focus next logic
                        setTimeout(() => {
                            // Find the current wrapper's container form
                            const form = wrapperRef.current ? wrapperRef.current.closest('form') : null;
                            const container = form || document.body;

                            // Get all focusable elements
                            const focusable = Array.from(container.querySelectorAll('input:not([type="hidden"]), select, textarea, button:not([disabled]), [tabindex]:not([tabindex="-1"])'));

                            // Find the button (trigger) of THIS component
                            const triggerBtn = wrapperRef.current.querySelector('button');
                            const currentIndex = focusable.indexOf(triggerBtn);

                            if (currentIndex > -1) {
                                let nextIndex = currentIndex + 1;
                                while (nextIndex < focusable.length) {
                                    const el = focusable[nextIndex];
                                    // Skip self (if multiple inputs inside), disabled, readonly, hidden
                                    // Also check if it is visible
                                    if (
                                        el.offsetParent !== null &&
                                        !el.disabled &&
                                        !el.readOnly &&
                                        el !== triggerBtn &&
                                        !wrapperRef.current.contains(el) // Don't focus internal search input if closed
                                    ) {
                                        el.focus();
                                        break;
                                    }
                                    nextIndex++;
                                }
                            }
                        }, 0);
                    }
                } else {
                    if (e.key === 'Tab') setIsOpen(false);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    const isSelected = (id) => {
        if (multiple) return Array.isArray(value) && value.some(v => v == id);
        return value == id;
    };

    return (
        <div className={styles.selectWrapper} ref={wrapperRef} style={{ position: 'relative' }}>
            <button
                type="button"
                className={`${styles.input} ${error ? styles.errorBorder : ''} ${className || ''}`}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                data-searchable="true"
                style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'var(--input)', minHeight: '38px' }}
                autoFocus={autoFocus}
            >
                <span style={{ opacity: (multiple ? value?.length : value) ? 1 : 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '8px' }}>
                    {selectedLabel || placeholder}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {/* Clear 'X' for single select if value exists */}
                    {!multiple && value && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange({ target: { name, value: '' } });
                            }}
                            className={styles.clearBtn} // Verify style or use inline
                            style={{ padding: '2px', cursor: 'pointer', opacity: 0.6 }}
                            title="Clear"
                        >
                            <X size={14} />
                        </div>
                    )}
                    {/* Clear 'X' for multi select if value exists */}
                    {multiple && Array.isArray(value) && value.length > 0 && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange({ target: { name, value: [] } });
                            }}
                            style={{ padding: '2px', cursor: 'pointer', opacity: 0.6 }}
                            title="Clear All"
                        >
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown size={16} opacity={0.5} style={{ flexShrink: 0 }} />
                </div>
            </button>

            {isOpen && (
                <div className={styles.dropdownMenu} style={{
                    position: 'absolute', top: '100%', left: 0, width: '100%', maxHeight: '250px', overflowY: 'auto',
                    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                    zIndex: 100, marginTop: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    {/* Multi-Select Actions Header */}
                    {multiple && (
                        <div style={{ display: 'flex', gap: '8px', padding: '8px', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
                            <button
                                type="button"
                                style={{ flex: 1, fontSize: '0.75rem', padding: '4px', background: '#e2e8f0', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    const allIds = filteredOptions.map(o => o.id);
                                    onChange({ target: { name, value: allIds } });
                                    inputRef.current?.focus();
                                }}
                            >
                                Select All
                            </button>
                            <button
                                type="button"
                                style={{ flex: 1, fontSize: '0.75rem', padding: '4px', background: '#e2e8f0', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onChange({ target: { name, value: [] } });
                                    inputRef.current?.focus();
                                }}
                            >
                                Clear All
                            </button>
                        </div>
                    )}

                    <div style={{ padding: '8px', position: 'sticky', top: multiple ? '37px' : 0, background: 'inherit', borderBottom: '1px solid var(--border)' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setHighlightIndex(0); }}
                            onKeyDown={handleKeyDown}
                            placeholder="Search..."
                            className={styles.input}
                            style={{ padding: '6px', fontSize: '0.85rem' }}
                        />
                    </div>
                    <div ref={listRef}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, index) => (
                                <div
                                    key={opt.id}
                                    className={styles.option}
                                    style={{
                                        padding: '8px 12px', cursor: 'pointer',
                                        background: index === highlightindex ? 'var(--primary)' : 'transparent',
                                        color: index === highlightindex ? 'var(--primary-foreground)' : 'var(--foreground)',
                                        fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}
                                    onClick={() => handleSelect(opt)}
                                    onMouseEnter={() => setHighlightIndex(index)}
                                >
                                    <span>{opt.name}</span>
                                    {isSelected(opt.id) && <Check size={14} />}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '12px', textAlign: 'center', opacity: 0.5, fontSize: '0.85rem' }}>No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
