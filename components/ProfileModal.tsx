"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { data: session, update } = useSession();
    const user = session?.user;

    const [name, setName] = useState("");
    const [image, setImage] = useState("");
    const [provider, setProvider] = useState("credentials");
    
    // Password state fields
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && user) {
            setName(user.name || "");
            setImage(user.image || "");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setError(null);
            setSuccess(null);
            setProvider("credentials");

            // Fetch profile info to verify identity provider
            const getDetails = async () => {
                setLoadingDetails(true);
                try {
                    const res = await fetch("/api/profile");
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.user) {
                            setProvider(data.user.provider || "credentials");
                        }
                    }
                } catch (err) {
                    console.error("Error loading user identity details:", err);
                } finally {
                    setLoadingDetails(false);
                }
            };
            getDetails();
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please upload a valid image file.");
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Failed to upload image");
            }

            const data = await res.json();
            if (data.success && data.imageUrl) {
                setImage(data.imageUrl);
            } else {
                throw new Error(data.message || "Upload failed");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error uploading image");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            setError("Name cannot be empty.");
            return;
        }

        // Validate password fields if any are filled in
        const isPasswordChange = currentPassword || newPassword || confirmPassword;
        if (isPasswordChange) {
            if (!currentPassword) {
                setError("Please enter your current password.");
                return;
            }
            if (!newPassword) {
                setError("Please enter a new password.");
                return;
            }
            if (newPassword.length < 6) {
                setError("New password must be at least 6 characters.");
                return;
            }
            if (newPassword !== confirmPassword) {
                setError("New password and confirm password do not match.");
                return;
            }
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const payload: any = {
                name: name.trim(),
                image: image,
            };

            if (isPasswordChange) {
                payload.currentPassword = currentPassword;
                payload.newPassword = newPassword;
            }

            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Failed to update profile");
            }

            const data = await res.json();
            if (data.success) {
                // Update client session details
                await update({
                    name: name.trim(),
                    image: image,
                });
                
                setSuccess("Profile details updated successfully!");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");

                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                throw new Error(data.message || "Failed to save details");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "super_admin":
                return { label: "Super Admin", classes: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
            case "admin":
                return { label: "Admin", classes: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
            default:
                return { label: "Shopper", classes: "bg-slate-800 text-slate-400 border-slate-700" };
        }
    };

    const roleBadge = getRoleBadge(user?.role || "user");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none overflow-y-auto">
            {/* Backdrop Click Closer */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col z-10 animate-fade-in-up text-slate-100 backdrop-blur-md max-h-[90vh] overflow-y-auto">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-850 mb-6">
                    <div>
                        <h2 className="font-extrabold text-xl text-white">Your Profile</h2>
                        <p className="text-xs text-slate-400 mt-0.5">View and update your personal information</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 transition"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-4 flex items-start gap-3 p-3.5 rounded-xl border border-red-900/30 bg-red-950/20 text-red-400">
                        <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                        <span className="text-xs font-semibold leading-tight">{error}</span>
                    </div>
                )}
                {success && (
                    <div className="mb-4 flex items-start gap-3 p-3.5 rounded-xl border border-emerald-900/30 bg-emerald-950/20 text-emerald-400 animate-slide-in">
                        <svg className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span className="text-xs font-semibold leading-tight">{success}</span>
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6">
                    {/* User Avatar Setup */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative group w-24 h-24 rounded-full overflow-hidden border border-slate-700 bg-slate-950 shadow-md">
                            {uploading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                                    <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </div>
                            ) : image ? (
                                <img src={image} alt="User Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-black text-3xl">
                                    {user?.name ? user.name[0].toUpperCase() : "U"}
                                </div>
                            )}

                            {/* Hover overlay upload button */}
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition duration-300">
                                <svg className="w-5 h-5 text-white mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                </svg>
                                <span className="text-[9px] font-extrabold text-white uppercase tracking-wider">Change Photo</span>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                        </div>
                        <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${roleBadge.classes}`}>
                            {roleBadge.label}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {/* Email Address (Disabled) */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                            <input 
                                type="text" 
                                disabled 
                                value={user?.email || ""} 
                                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-slate-400 text-sm focus:outline-none cursor-not-allowed select-none"
                            />
                        </div>

                        {/* Name Field */}
                        <div>
                            <label htmlFor="profile-name" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                            <input 
                                id="profile-name"
                                type="text" 
                                required
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                disabled={saving}
                                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 transition"
                                placeholder="Enter your full name"
                            />
                        </div>

                        {/* Password Fields Section (Credentials Users Only) */}
                        {loadingDetails ? (
                            <div className="flex items-center justify-center py-4">
                                <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            </div>
                        ) : provider === "credentials" ? (
                            <div className="pt-4 border-t border-slate-850 space-y-4">
                                <h3 className="text-xs font-black text-white uppercase tracking-wider">Change Password</h3>
                                
                                {/* Current Password */}
                                <div>
                                    <label htmlFor="current-pwd" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Current Password</label>
                                    <input 
                                        id="current-pwd"
                                        type="password" 
                                        value={currentPassword} 
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        disabled={saving}
                                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 transition"
                                        placeholder="••••••••"
                                    />
                                </div>

                                {/* New Password & Confirm Password Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="new-pwd" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">New Password</label>
                                        <input 
                                            id="new-pwd"
                                            type="password" 
                                            value={newPassword} 
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            disabled={saving}
                                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 transition"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="confirm-pwd" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                                        <input 
                                            id="confirm-pwd"
                                            type="password" 
                                            value={confirmPassword} 
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            disabled={saving}
                                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 transition"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Google User Security Banner */
                            <div className="pt-4 border-t border-slate-850">
                                <div className="flex items-center gap-2.5 p-3.5 bg-blue-950/20 border border-blue-900/20 rounded-xl text-blue-400">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.47 1.617l2.424-2.425C17.382 1.624 14.975 1 12.24 1c-5.523 0-10 4.477-10 10s4.477 10 10 10c5.757 0 9.563-4.048 9.563-9.727 0-.655-.06-1.287-.175-1.988H12.24z"/>
                                    </svg>
                                    <span className="text-xs font-semibold">Account secured via Google Identity Provider</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions Panel */}
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-850 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-xs transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || uploading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/10 transition active:scale-98"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
