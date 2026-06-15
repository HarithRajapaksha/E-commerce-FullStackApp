"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function PasswordStrengthBar({ password }: { password: string }) {
    const getStrength = (pw: string) => {
        let score = 0;
        if (pw.length >= 6) score++;
        if (pw.length >= 10) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        return score;
    };

    const score = getStrength(password);
    const levels = [
        { label: "Too short", color: "bg-slate-350", textColor: "text-slate-400" },
        { label: "Weak", color: "bg-red-500", textColor: "text-red-500" },
        { label: "Fair", color: "bg-amber-500", textColor: "text-amber-500" },
        { label: "Good", color: "bg-yellow-500", textColor: "text-yellow-600" },
        { label: "Strong", color: "bg-blue-500", textColor: "text-blue-600" },
        { label: "Very Strong ", color: "bg-emerald-500", textColor: "text-emerald-600" },
    ];

    const current = levels[Math.min(score, 5)];

    if (!password) return null;

    return (
        <div className="mt-2 space-y-1">
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? current.color : "bg-slate-200"}`} />
                ))}
            </div>
            <p className={`text-xs font-semibold ${current.textColor}`}>{current.label}</p>
        </div>
    );
}

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim() || !email || !password || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Registration failed.");

            setSuccess(true);

            // Redirect directly to login page
            setTimeout(() => {
                router.push("/login");
            }, 800);
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-slate-950 px-4 py-12">
            {/* Background radial gradient overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />

            {/* Decorative ambient background glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                {/* Brand logo & header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20 mb-4 animate-pulse-ring">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                    </div>
                    <h1 className="text-white font-extrabold text-3xl tracking-tight">E-Commerce</h1>
                    <p className="text-blue-300 text-sm mt-2 font-medium">Your premium shopping destination</p>
                </div>

                {/* Card */}
                <div className="glass border border-white/20 rounded-3xl p-8 shadow-2xl">
                    <div className="mb-6">
                        <h2 className="text-slate-900 font-extrabold text-2xl">Create Account</h2>
                        <p className="text-slate-500 text-sm mt-1">Register as a normal user to get started</p>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="mb-5 flex items-start gap-3 p-4 rounded-2xl border border-red-100 bg-red-50 text-red-700">
                            <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                            </svg>
                            <p className="text-sm font-semibold leading-tight">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="mb-5 flex items-start gap-3 p-4 rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                            <svg className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        <p className="text-sm font-semibold leading-tight">Registration successful! Redirecting to login...</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                            <div className="relative">
                                {!name && (
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                        </svg>
                                    </span>
                                )}
                                <input id="name" type="text" required
                                    value={name} onChange={(e) => setName(e.target.value)} disabled={loading || success}
                                    className={`input-field pr-4 transition-all duration-200 ${name ? "pl-4" : "pl-10"}`}
                                    placeholder="John Doe" />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                            <div className="relative">
                                {!email && (
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                        </svg>
                                    </span>
                                )}
                                <input id="email" type="email" autoComplete="email" required
                                    value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading || success}
                                    className={`input-field pr-4 transition-all duration-200 ${email ? "pl-4" : "pl-10"}`}
                                    placeholder="name@example.com" />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                            <div className="relative">
                                {!password && (
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                        </svg>
                                    </span>
                                )}
                                <input id="password" type={showPassword ? "text" : "password"} required
                                    value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading || success}
                                    className={`input-field pr-12 transition-all duration-200 ${password ? "pl-4" : "pl-10"}`}
                                    placeholder="At least 6 characters" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors z-10">
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <PasswordStrengthBar password={password} />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                            <div className="relative">
                                {!confirmPassword && (
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                    </span>
                                )}
                                <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} required
                                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading || success}
                                    className={`input-field pr-12 transition-all duration-200 ${confirmPassword && password !== confirmPassword
                                            ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                            : confirmPassword && password === confirmPassword
                                                ? "border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500"
                                                : ""
                                        } ${confirmPassword ? "pl-4" : "pl-10"}`}
                                    placeholder="Repeat your password" />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors z-10">
                                    {showConfirmPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="text-xs text-red-500 font-semibold mt-1">Passwords do not match</p>
                            )}
                            {confirmPassword && password === confirmPassword && (
                                <p className="text-xs text-emerald-600 font-semibold mt-1">✓ Passwords match</p>
                            )}
                        </div>

                        {/* Terms Checkbox */}
                        <div className="flex items-start gap-3 pt-1">
                            <input id="terms" type="checkbox" required disabled={loading || success}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer flex-shrink-0" />
                            <label htmlFor="terms" className="text-sm text-slate-600 cursor-pointer leading-relaxed">
                                I agree to the{" "}
                                <a href="#" className="text-blue-600 font-semibold hover:text-blue-700">Terms of Service</a>{" "}
                                and{" "}
                                <a href="#" className="text-blue-600 font-semibold hover:text-blue-700">Privacy Policy</a>
                            </label>
                        </div>

                        <div className="pt-2">
                            <button type="submit" disabled={loading || success} className="btn-primary">
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Creating account...
                                    </span>
                                ) : (
                                    "Create Account"
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Login redirect */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div >
    );
}
