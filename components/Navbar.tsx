"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import ProfileModal from "./ProfileModal";

export default function Navbar() {
    const { data: session, status } = useSession();
    const user = session?.user;
    const isAdmin = user?.role === "admin" || user?.role === "super_admin";

    const [cartCount, setCartCount] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    useEffect(() => {
        fetchCartCount();

        // Listen for cart update events from other components
        const handleCartUpdate = () => {
            fetchCartCount();
        };

        window.addEventListener("cart-updated", handleCartUpdate);
        return () => {
            window.removeEventListener("cart-updated", handleCartUpdate);
        };
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        if (!dropdownOpen) return;

        const handleOutsideClick = () => {
            setDropdownOpen(false);
        };

        window.addEventListener("click", handleOutsideClick);
        return () => {
            window.removeEventListener("click", handleOutsideClick);
        };
    }, [dropdownOpen]);

    const fetchCartCount = async () => {
        try {
            const res = await fetch("/api/addCart");
            if (res.ok) {
                const data = await res.json();
                const items = data.items || [];
                const totalCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
                setCartCount(totalCount);
            }
        } catch (err) {
            console.error("Error fetching cart count inside Navbar:", err);
        }
    };

    const handleCartClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.location.pathname === "/show-items") {
            window.dispatchEvent(new Event("toggle-cart"));
        } else {
            window.location.href = "/show-items?cart=open";
        }
    };

    const handleAvatarClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDropdownOpen(!dropdownOpen);
    };

    // Get role badge display name and styling classes
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

    if (status === "loading" || !isAdmin) return null;

    const roleBadge = getRoleBadge(user?.role || "user");

    return (
        <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 w-full px-6 py-3.5 flex items-center justify-between text-slate-100 select-none">
            {/* Left Brand Area */}
            <Link href="/show-items" className="flex items-center gap-2.5 hover:opacity-90 transition">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/10">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                </div>
                <span className="font-black text-white text-lg tracking-tight">E-Commerce</span>
            </Link>

            {/* Middle Nav Links */}
            <div className="hidden md:flex items-center gap-6">
                <Link href="/show-items" className="text-sm font-semibold hover:text-blue-500 transition-colors">
                    Store Catalog
                </Link>
                {isAdmin && (
                    <>
                        <Link href="/add-items" className="text-sm font-semibold hover:text-blue-500 transition-colors">
                            Add Product
                        </Link>
                        <Link href="/edite-details" className="text-sm font-semibold hover:text-blue-500 transition-colors">
                            Manage Inventory
                        </Link>
                    </>
                )}
            </div>

            {/* Right Action Icons Area */}
            <div className="flex items-center gap-4">
                {/* Cart Toggle Icon */}
                <button
                    onClick={handleCartClick}
                    className="relative flex items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white transition"
                    title="Shopping Cart"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                    </svg>
                    {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-slate-950">
                            {cartCount}
                        </span>
                    )}
                </button>

                {/* Profile Avatar Button */}
                <div className="relative">
                    <button
                        onClick={handleAvatarClick}
                        className="flex items-center focus:outline-none transition hover:scale-105 active:scale-95"
                    >
                        {user?.image ? (
                            <img
                                src={user.image}
                                alt={user.name || "User profile"}
                                className="w-9 h-9 rounded-full border border-slate-800 object-cover"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm border border-blue-500 shadow-md">
                                {user?.name ? user.name[0].toUpperCase() : "U"}
                            </div>
                        )}
                    </button>

                    {/* Profile Dropdown Card */}
                    {dropdownOpen && (
                        <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 mt-3 w-64 bg-slate-900/95 border border-slate-850 rounded-2xl shadow-2xl p-4 space-y-4 animate-fade-in-up z-50 text-slate-100 backdrop-blur-md"
                        >
                            {/* Profile Info Details */}
                            <div className="space-y-1">
                                <span className="block font-black text-sm text-white leading-tight">
                                    {user?.name || "E-Commerce User"}
                                </span>
                                <span className="block text-xs text-slate-400 truncate">
                                    {user?.email || "shopper@example.com"}
                                </span>
                                <span className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border mt-2 ${roleBadge.classes}`}>
                                    {roleBadge.label}
                                </span>
                            </div>

                            <hr className="border-slate-800" />

                            {/* Dropdown links */}
                            <div className="flex flex-col gap-1.5">
                                <Link 
                                    href="/show-items" 
                                    className="text-xs font-semibold text-slate-300 hover:text-white px-2 py-1.5 hover:bg-slate-800/50 rounded-lg transition"
                                >
                                    Browse Store
                                </Link>
                                <button 
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        setProfileOpen(true);
                                    }}
                                    className="w-full text-left text-xs font-semibold text-slate-300 hover:text-white px-2 py-1.5 hover:bg-slate-800/50 rounded-lg transition"
                                >
                                    View & Edit Profile
                                </button>
                                {isAdmin && (
                                    <>
                                        <Link 
                                            href="/add-items" 
                                            className="text-xs font-semibold text-slate-300 hover:text-white px-2 py-1.5 hover:bg-slate-800/50 rounded-lg transition"
                                        >
                                            Add New Product
                                        </Link>
                                        <Link 
                                            href="/edite-details" 
                                            className="text-xs font-semibold text-slate-300 hover:text-white px-2 py-1.5 hover:bg-slate-800/50 rounded-lg transition"
                                        >
                                            Manage Inventory
                                        </Link>
                                    </>
                                )}
                            </div>

                            <hr className="border-slate-800" />

                            {/* Logout trigger */}
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="w-full text-left text-xs font-bold text-red-400 hover:text-red-500 hover:bg-red-500/10 px-2 py-2 rounded-lg transition flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
        </nav>
    );
}
