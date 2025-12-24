
'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Camera, Eye, EyeOff, Save, Check, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import styles from './Header.module.css'; // Reusing header styles or could use inline/new module

export default function ProfileModal({ isOpen, onClose }) {
    const [user, setUser] = useState({ empName: '', userName: '', profileImage: null });
    const [loading, setLoading] = useState(false);

    // Password State
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
    const [showNewPass, setShowNewPass] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) fetchProfile();
    }, [isOpen]);

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
                onClose();
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-slate-50">
                    <h3 className="font-semibold text-lg text-slate-800">Edit Profile</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Profile Image */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-24 h-24 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 group">
                            {user.profileImage ? (
                                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold">
                                    {user.empName?.charAt(0) || 'U'}
                                </div>
                            )}
                            <div
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera className="text-white" size={24} />
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                        <span className="text-xs text-slate-500 mt-2">Click to change picture</span>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Employee Name</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                value={user.empName}
                                onChange={e => setUser({ ...user, empName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">User Name</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-md bg-slate-100 text-slate-500 cursor-not-allowed"
                                value={user.userName}
                                disabled
                            />
                        </div>
                    </div>

                    {/* Change Password Section */}
                    <div className="border-t pt-4">
                        <button
                            className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
                            onClick={() => setShowPasswordSection(!showPasswordSection)}
                        >
                            {showPasswordSection ? 'Cancel Password Change' : 'Change Password'}
                        </button>

                        {showPasswordSection && (
                            <div className="mt-4 space-y-3 bg-slate-50 p-4 rounded-md">
                                {/* Old Password */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Old Password *</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-md text-sm"
                                        value={passwords.old}
                                        onChange={e => setPasswords({ ...passwords, old: e.target.value })}
                                    />
                                </div>

                                {/* New Password */}
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">New Password *</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPass ? "text" : "password"}
                                            className="w-full px-3 py-2 border rounded-md text-sm pr-10"
                                            value={passwords.new}
                                            onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                        />
                                        <button
                                            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                                            onClick={() => setShowNewPass(!showNewPass)}
                                        >
                                            {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>

                                    {/* Policy Labels */}
                                    {passwords.new && (
                                        <div className="mt-2 space-y-1">
                                            <PolicyLabel isValid={policy.hasLength} text="6-20 Characters" />
                                            <PolicyLabel isValid={policy.hasNum} text="At least one number" />
                                            <PolicyLabel isValid={policy.hasSpecial} text="At least one special char (!@#$%^&*)" />
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Confirm Password *</label>
                                    <input
                                        type="password"
                                        className="w-full px-3 py-2 border rounded-md text-sm"
                                        value={passwords.confirm}
                                        onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                    />
                                    {passwords.new && passwords.confirm && passwords.new !== passwords.confirm && (
                                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
                    >
                        {loading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PolicyLabel({ isValid, text }) {
    return (
        <div className={`flex items-center gap-1 text-xs ${isValid ? 'text-green-600' : 'text-red-500'}`}>
            {isValid ? <Check size={12} /> : <XCircle size={12} />}
            <span>{text}</span>
        </div>
    );
}
