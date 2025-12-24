'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Eye, EyeOff, Save, Check, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import styles from './Profile.module.css';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState({ empName: '', userName: '', profileImage: null });
    const [loading, setLoading] = useState(false);

    // Password State
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
    const [showNewPass, setShowNewPass] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user/profile');
            const data = await res.json();
            if (data.success) {
                setUser({
                    empName: data.user.EmpName,
                    userName: data.user.UserName,
                    profileImage: data.user.ProfileImage
                });
            } else {
                toast.error("Failed to load profile");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) return toast.error("Image size too large (Max 2MB)");

            const reader = new FileReader();
            reader.onloadend = () => {
                setUser(prev => ({ ...prev, profileImage: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const validatePolicy = (pass) => {
        const hasLength = pass.length >= 6 && pass.length <= 20;
        const hasNum = /[0-9]/.test(pass);
        const hasSpecial = /[!@#$%^&*]/.test(pass);
        return { hasLength, hasNum, hasSpecial, isValid: hasLength && hasNum && hasSpecial };
    };

    const policy = validatePolicy(passwords.new);

    const handleSave = async () => {
        if (!user.empName.trim()) return toast.error("Employee Name is required");

        const payload = {
            empName: user.empName,
            profileImage: user.profileImage
        };

        if (showPasswordSection) {
            if (!passwords.old) return toast.error("Old password is required");
            if (!policy.isValid) return toast.error("New password does not meet policy");
            if (passwords.new !== passwords.confirm) return toast.error("Confirm password mismatch");

            payload.oldPassword = passwords.old;
            payload.newPassword = passwords.new;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.success) {
                toast.success("Profile Updated Successfully");
                // Optionally reset password fields
                setPasswords({ old: '', new: '', confirm: '' });
                setShowPasswordSection(false);
            } else {
                toast.error(result.message || "Update Failed");
            }

        } catch (e) {
            console.error(e);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <button onClick={() => router.back()} className={styles.backBtn}>
                <ArrowLeft size={20} /> Back
            </button>

            <div className={styles.card}>
                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>My Profile</h1>
                    <p className={styles.subtitle}>Manage your account settings and preferences.</p>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {/* Profile Image Section */}
                    <div className={styles.imageSection}>
                        <div className={styles.imageWrapper}>
                            {user.profileImage ? (
                                <img src={user.profileImage} alt="Profile" className={styles.profileImg} />
                            ) : (
                                <div className={styles.placeholderImg}>
                                    {user.empName?.charAt(0) || 'U'}
                                </div>
                            )}
                            <div
                                className={styles.cameraOverlay}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera color="white" size={32} />
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                        <span className={styles.changePhotoText} onClick={() => fileInputRef.current?.click()}>
                            Change Profile Picture
                        </span>
                    </div>

                    {/* Basic Info */}
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Employee Name</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={user.empName}
                                onChange={e => setUser({ ...user, empName: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>User Name</label>
                            <input
                                type="text"
                                className={`${styles.input} ${styles.inputDisabled}`}
                                value={user.userName}
                                disabled
                            />
                        </div>
                    </div>

                    {/* Change Password Section */}
                    <div className={styles.passwordSection}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>Security</h3>
                            <button
                                className={styles.toggleBtn}
                                onClick={() => setShowPasswordSection(!showPasswordSection)}
                            >
                                {showPasswordSection ? 'Cancel Password Change' : 'Change Password'}
                            </button>
                        </div>

                        {showPasswordSection && (
                            <div className={styles.passwordForm}>
                                {/* Old Password */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Old Password *</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={passwords.old}
                                        onChange={e => setPasswords({ ...passwords, old: e.target.value })}
                                    />
                                </div>

                                {/* New Password */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>New Password *</label>
                                    <div className={styles.passwordInputWrapper}>
                                        <input
                                            type={showNewPass ? "text" : "password"}
                                            className={styles.input}
                                            value={passwords.new}
                                            onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                            style={{ paddingRight: '40px' }}
                                        />
                                        <button
                                            className={styles.eyeBtn}
                                            onClick={() => setShowNewPass(!showNewPass)}
                                        >
                                            {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    {/* Policy Labels */}
                                    {passwords.new && (
                                        <div className={styles.policyContainer}>
                                            <PolicyLabel isValid={policy.hasLength} text="6-20 Characters" />
                                            <PolicyLabel isValid={policy.hasNum} text="At least one number" />
                                            <PolicyLabel isValid={policy.hasSpecial} text="At least one special char (!@#$%^&*)" />
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Confirm Password *</label>
                                    <input
                                        type="password"
                                        className={styles.input}
                                        value={passwords.confirm}
                                        onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                    />
                                    {passwords.new && passwords.confirm && passwords.new !== passwords.confirm && (
                                        <p className={styles.errorText}><XCircle size={12} /> Passwords do not match</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={styles.saveBtn}
                    >
                        {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PolicyLabel({ isValid, text }) {
    return (
        <div className={`${styles.policyItem} ${isValid ? styles.policyValid : styles.policyInvalid}`}>
            {isValid ? <Check size={14} /> : <XCircle size={14} />}
            <span>{text}</span>
        </div>
    );
}
