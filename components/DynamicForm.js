'use client';

import styles from '@/app/dashboard/settings/Settings.module.css';
import SearchableSelect from '@/components/SearchableSelect';

export default function DynamicForm({ columns, formData, setFormData, errors, setErrors }) {

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Strict Validation for Numbers (if typed, double check)
        // Note: The main strict blocking is done in onKeyDown/onKeyPress

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user types
        if (errors && errors[name] && setErrors) {
            setErrors(prev => {
                const newErr = { ...prev };
                delete newErr[name];
                return newErr;
            });
        }
    };

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors && errors[name] && setErrors) {
            setErrors(prev => {
                const newErr = { ...prev };
                delete newErr[name];
                return newErr;
            });
        }
    };

    const handleFileChange = (e, accessor, maxSizeMB) => {
        const file = e.target.files[0];
        if (file) {
            if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
                alert(`File size exceeds ${maxSizeMB}MB limit`);
                e.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [accessor]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Generic Enter Key Navigation
    const handleEnterNav = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const form = e.target.form;
            if (form) {
                const index = Array.prototype.indexOf.call(form, e.target);
                // Try to find next interactive element
                let nextIndex = index + 1;
                while (form.elements[nextIndex]) {
                    if (!form.elements[nextIndex].disabled && form.elements[nextIndex].type !== 'hidden') {
                        form.elements[nextIndex].focus();
                        break;
                    }
                    nextIndex++;
                }
            }
        }
    };

    // Strict Input Validation Handler
    const handleStrictInput = (e, type, decimals = 0) => {
        if (e.key === 'Backspace' || e.key === 'Tab' || e.key === 'Delete' || e.key.startsWith('Arrow')) return;
        if (e.key === 'Enter') return; // Let handleEnterNav handle it

        const isControl = e.ctrlKey || e.metaKey;
        if (isControl) return; // Allow copy/paste etc

        if (type === 'integer') {
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        } else if (type === 'decimal') {
            // Allow numbers
            if (/[0-9]/.test(e.key)) {
                // Check decimal limit if needed (complex to do perfectly on keyDown, usually onChange is safer, but strictly blocking chars here)
                const val = e.target.value;
                if (val.includes('.') && val.split('.')[1].length >= decimals && e.target.selectionStart > val.indexOf('.')) {
                    e.preventDefault();
                }
                return;
            }
            // Allow ONE dot
            if (e.key === '.') {
                if (e.target.value.includes('.')) {
                    e.preventDefault();
                }
                return;
            }
            // Block everything else
            e.preventDefault();
        }
    };

    // Validation Logic for Decimals on Change
    const handleDecimalInput = (e, accessor, decimals) => {
        let val = e.target.value;
        if (val.includes('.')) {
            const [int, dec] = val.split('.');
            if (dec.length > decimals) {
                val = `${int}.${dec.substring(0, decimals)}`;
                e.target.value = val; // Update the input element's value directly
            }
        }
        // Then call the general handleChange to update formData and clear errors
        handleChange(e);
    };

    // Helper to render individual fields
    const renderField = (col, idx, isRowLayout) => {
        const isObj = typeof col === 'object';
        const accessor = isObj ? col.accessor : col;
        const label = isObj && col.label ? col.label : accessor.replace(/([A-Z])/g, ' $1').trim();
        const type = isObj ? col.type : 'text';
        const required = isObj ? col.required : false;
        const autoFocus = isObj ? col.autoFocus : (idx === 0);
        const accept = isObj ? col.accept : null;

        // Validation Props
        const validationType = isObj ? col.validationType : null;
        const decimals = isObj ? col.decimals : 2;
        const isFirstField = idx === 0;

        return (
            <div key={accessor} className={styles.formGroup} style={{
                position: 'relative',
                gridColumn: col.fullRow ? '1 / -1' : 'auto',
                flex: isRowLayout ? (col.colSpan || '1') : undefined // Distribute space based on colSpan or equal
            }}>
                <label className={styles.label}>
                    {label} {required && <span style={{ color: 'red', marginLeft: '4px' }}>*</span>}
                </label>

                {type === 'select' ? (
                    <SearchableSelect
                        name={accessor}
                        value={formData[accessor]}
                        onChange={handleSelectChange}
                        options={col.lookupData || []}
                        placeholder={`Select ${label}...`}
                        error={errors && errors[accessor]}
                        autoFocus={col.autoFocus || (!isRowLayout && isFirstField)}
                    />
                ) : type === 'file' ? (
                    <>
                        <input
                            type="file"
                            name={accessor}
                            className={styles.input}
                            accept={accept}
                            onChange={(e) => handleFileChange(e, accessor, col.maxSize)}
                            autoFocus={col.autoFocus || (!isRowLayout && isFirstField)}
                            onKeyDown={handleEnterNav}
                            style={errors && errors[accessor] ? { borderColor: 'red' } : {}}
                        />
                        {formData[accessor] && (
                            <img src={formData[accessor]} alt="Preview" style={{ marginTop: '5px', maxHeight: '50px' }} />
                        )}
                    </>
                ) : type === 'textarea' ? (
                    <textarea
                        name={accessor}
                        className={styles.input}
                        value={formData[accessor] || ''}
                        onChange={handleChange}
                        onKeyDown={handleEnterNav}
                        placeholder={`Enter ${label}`}
                        autoFocus={col.autoFocus || (!isRowLayout && isFirstField)}
                        style={errors && errors[accessor] ? { borderColor: 'red' } : {}}
                    />
                ) : type === 'checkbox' ? (
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            name={accessor}
                            checked={!!formData[accessor]}
                            onChange={handleChange}
                        />
                        <span className={styles.slider}></span>
                    </label>
                ) : (
                    <input
                        type={type || 'text'}
                        name={accessor}
                        className={styles.input}
                        value={formData[accessor] || ''}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            handleEnterNav(e);
                            if (validationType) handleStrictInput(e, validationType, decimals);
                        }}
                        placeholder={`Enter ${label}`}
                        autoFocus={col.autoFocus || (!isRowLayout && isFirstField)}
                        style={errors && errors[accessor] ? { borderColor: 'red' } : {}}
                    />
                )}
                {errors && errors[accessor] && (
                    <div style={{ color: 'red', fontSize: '12px', marginTop: '2px', position: 'absolute', right: 0, top: 0, background: '#fff', padding: '0 4px', border: '1px solid red', borderRadius: '4px' }}>
                        Value is missing
                    </div>
                )}
            </div>
        );
    };

    return (
        <form className={styles.formGrid}>
            {(() => {
                // Group columns by Row if 'row' property exists
                const groups = {};
                let hasRows = false;

                columns.filter(c => !(typeof c === 'object' && c.viewOnly)).forEach(col => {
                    const row = (typeof col === 'object' && col.row) ? col.row : 'default';
                    if (row !== 'default') hasRows = true;
                    if (!groups[row]) groups[row] = [];
                    groups[row].push(col);
                });

                // If no rows defined, stick to default grid (groups['default'] will have all if mix but checking hasRows)
                if (!hasRows) {
                    // Linear Render (Original Logic)
                    return columns.filter(col => !(typeof col === 'object' && col.viewOnly)).map((col, idx) => renderField(col, idx, false));
                }

                // Row-Based Render
                // Sort keys: 1, 2, 3 ... 'default'
                const sortedKeys = Object.keys(groups).sort((a, b) => {
                    if (a === 'default') return 1;
                    if (b === 'default') return -1;
                    return Number(a) - Number(b);
                });

                return sortedKeys.map(key => (
                    <div key={key} className={styles.formRow} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', gridColumn: '1 / -1' }}>
                        {groups[key].map((col, idx) => renderField(col, idx, true))}
                    </div>
                ));
            })()}

            {/* Toggle Switch for IsActive - Only if NOT already in columns (avoid duplicate) */}
            {!columns.some(c => (typeof c === 'object' ? c.accessor : c) === 'IsActive') && (
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label className={styles.label} style={{ marginBottom: 0 }}>Is Active</label>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            name="IsActive"
                            checked={formData.IsActive ?? true}
                            onChange={handleChange}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>
            )}
        </form>
    );
}
