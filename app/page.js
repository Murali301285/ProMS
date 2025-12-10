'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Settings } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import styles from './login.module.css';

export default function LoginPage() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDbModal, setShowDbModal] = useState(false);
    const [dbList, setDbList] = useState([]);
    const [selectedDb, setSelectedDb] = useState(null);
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();

    const fetchDbList = async () => {
        try {
            const res = await fetch('/api/setup/db-list');
            const data = await res.json();
            setDbList(data);
            // Default select the first one or logic to check current
            if (data.length > 0) setSelectedDb(data[0]);
        } catch (error) {
            console.error("Failed to load DBs", error);
        }
    };

    const handleSettingsClick = async () => {
        await fetchDbList();
        setShowDbModal(true);
    };

    const handleDbSelect = (db) => {
        setSelectedDb(db);
    };

    const saveDbSelection = () => {
        if (selectedDb) {
            // Set cookie for DB
            document.cookie = `current_db=${selectedDb.DbName}; path=/; max-age=31536000`; // 1 year
            console.log("DB Selected:", selectedDb.DbName);
            setShowDbModal(false);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (res.ok) {
                router.push('/dashboard');
            } else {
                alert(result.message || 'Login Failed');
            }
        } catch (error) {
            console.error(error);
            alert('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={`${styles.card} glass`}>
                <div className={styles.header}>
                    <div className={styles.logo}>
                        <div className={styles.logoIcon}>ProMS 2.0</div>
                    </div>
                    {/* Display Current DB Environment Badge if selected */}
                    {/* For now, just title */}
                    <h1 className={styles.title}>Welcome Back</h1>
                    <p className={styles.subtitle}>Enter your details to proceed</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>Username</label>
                        <input
                            {...register('username', { required: true })}
                            className={styles.input}
                            placeholder="Enter Username"
                        />
                        {errors.username && <span className={styles.error}>Username is required</span>}
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Password</label>
                        <div className={styles.passwordWrapper}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                {...register('password', { required: true })}
                                className={styles.input}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.password && <span className={styles.error}>Password is required</span>}
                    </div>

                    <button type="submit" disabled={loading} className={styles.submitBtn}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className={styles.footer}>
                    <button className={styles.iconBtn} onClick={handleSettingsClick} title="Settings">
                        <Settings size={20} />
                    </button>
                    <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle Theme">
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <p>ProMS 2.0 © 2026</p>
                </div>
            </div>

            {/* DB Selection Modal */}
            {showDbModal && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} glass`}>
                        <h2 className={styles.modalTitle}>Select Database Environment</h2>
                        <div className={styles.dbList}>
                            {dbList.map((db) => (
                                <div
                                    key={db.SlNo}
                                    className={`${styles.dbItem} ${selectedDb?.SlNo === db.SlNo ? styles.selected : ''}`}
                                    onClick={() => handleDbSelect(db)}
                                >
                                    <div className={styles.dbHeader}>
                                        <span className={styles.dbName}>{db.DisplayName}</span>
                                        <span className={`${styles.envBadge} ${db.Environment.toLowerCase()}`}>
                                            {db.Environment}
                                        </span>
                                    </div>
                                    {db.Remarks && <span className={styles.remarks}>{db.Remarks}</span>}
                                </div>
                            ))}
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowDbModal(false)}>Cancel</button>
                            <button className={styles.saveBtn} onClick={saveDbSelection}>Confirm Change</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
