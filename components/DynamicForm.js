'use client';

import styles from '@/app/dashboard/settings/Settings.module.css';

export default function DynamicForm({ columns, formData, setFormData, errors, setErrors }) {

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        // console.log("DynamicForm Change:", name, value);
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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const form = e.target.form;
            const index = Array.prototype.indexOf.call(form, e.target);
            const nextElement = form.elements[index + 1];
            if (nextElement) {
                nextElement.focus();
            }
        }
    };

    return (
        <form className={styles.formGrid}>
            {columns.map((col, idx) => {
                const isObj = typeof col === 'object';
                const accessor = isObj ? col.accessor : col;
                const label = isObj && col.label ? col.label : accessor.replace(/([A-Z])/g, ' $1').trim();
                const type = isObj ? col.type : 'text';
                const required = isObj ? col.required : false;
                const autoFocus = isObj ? col.autoFocus : (idx === 0);
                const accept = isObj ? col.accept : null;

                return (
                    <div key={accessor} className={styles.formGroup} style={{ position: 'relative' }}>
                        <label className={styles.label}>
                            {label} {required && <span style={{ color: 'red', marginLeft: '4px' }}>*</span>}
                        </label>
                        {type === 'file' ? (
                            <>
                                <input
                                    type="file"
                                    name={accessor}
                                    className={styles.input}
                                    accept={accept}
                                    onChange={(e) => handleFileChange(e, accessor, col.maxSize)}
                                    autoFocus={autoFocus}
                                    onKeyDown={handleKeyDown}
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
                                onKeyDown={handleKeyDown}
                                placeholder={`Enter ${label}`}
                                autoFocus={autoFocus}
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
                                name={accessor}
                                className={styles.input}
                                value={formData[accessor] || ''}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                placeholder={`Enter ${label}`}
                                autoFocus={autoFocus}
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
            })}

            {/* Toggle Switch for IsActive */}
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
        </form>
    );
}
