"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Navbar from "@/components/Navbar";
import ProfileModal from "@/components/ProfileModal";

interface Item {
    _id: string;
    name: string;
    description: string;
    price: string;
    imageUrl: string[];
    createdAt: string;
    updatedAt: string;
}

interface CartItem {
    itemId: string;
    quantity: number;
    price: number;
    name: string;
    description: string;
    imageUrl: string[];
}

export default function ShowItemsPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "admin" || session?.user?.role === "super_admin";
    const [profileOpen, setProfileOpen] = useState(false);

    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeImageIndexes, setActiveImageIndexes] = useState<Record<string, number>>({});
    
    // Cart States
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [cartLoading, setCartLoading] = useState(false);
    
    // Toast Notification State
    const [toast, setToast] = useState<{ message: string; type: "success" | "info" | null }>({
        message: "",
        type: null,
    });

    useEffect(() => {
        fetchItems();
        fetchCart();

        // Listen for toggle-cart and cart-updated events
        const handleToggleCart = () => {
            setCartOpen((prev) => !prev);
        };
        const handleCartUpdate = () => {
            fetchCart();
        };

        window.addEventListener("toggle-cart", handleToggleCart);
        window.addEventListener("cart-updated", handleCartUpdate);

        // Check query parameters to see if cart should start open
        const params = new URLSearchParams(window.location.search);
        if (params.get("cart") === "open") {
            setCartOpen(true);
            // Clean up url
            const newUrl = window.location.pathname;
            window.history.replaceState({}, "", newUrl);
        }

        return () => {
            window.removeEventListener("toggle-cart", handleToggleCart);
            window.removeEventListener("cart-updated", handleCartUpdate);
        };
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/addItem");
            if (!res.ok) {
                throw new Error("Failed to fetch items from server");
            }
            const data = await res.json();
            setItems(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to load catalog. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchCart = async () => {
        setCartLoading(true);
        try {
            const res = await fetch("/api/addCart");
            if (res.ok) {
                const data = await res.json();
                setCart(data.items || []);
            }
        } catch (err) {
            console.error("Failed to load cart:", err);
        } finally {
            setCartLoading(false);
        }
    };

    const getActiveIndex = (itemId: string) => {
        return activeImageIndexes[itemId] ?? 0;
    };

    const nextImage = (itemId: string, maxImages: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveImageIndexes((prev) => ({
            ...prev,
            [itemId]: (getActiveIndex(itemId) + 1) % maxImages,
        }));
    };

    const prevImage = (itemId: string, maxImages: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveImageIndexes((prev) => ({
            ...prev,
            [itemId]: (getActiveIndex(itemId) - 1 + maxImages) % maxImages,
        }));
    };

    const selectImageIndex = (itemId: string, idx: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveImageIndexes((prev) => ({
            ...prev,
            [itemId]: idx,
        }));
    };

    const triggerToast = (message: string, type: "success" | "info") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast({ message: "", type: null });
        }, 3000);
    };

    // Cart Handlers
    const handleAddToCart = async (item: Item, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const res = await fetch("/api/addCart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    itemId: item._id,
                    quantity: 1,
                    price: Number(item.price),
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to add to cart");
            }

            triggerToast(`"${item.name}" added to cart!`, "success");
            fetchCart(); // refresh cart state
            window.dispatchEvent(new Event("cart-updated"));
        } catch (err: any) {
            console.error(err);
            triggerToast(err.message || "Could not add to cart", "info");
        }
    };

    const updateCartQuantity = async (itemId: string, newQty: number) => {
        try {
            const res = await fetch("/api/addCart", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    itemId,
                    quantity: newQty,
                }),
            });

            if (res.ok) {
                fetchCart();
                window.dispatchEvent(new Event("cart-updated"));
            } else {
                throw new Error("Failed to update quantity");
            }
        } catch (err: any) {
            console.error(err);
            triggerToast("Error updating cart quantity", "info");
        }
    };

    const removeCartItem = async (itemId: string) => {
        try {
            const res = await fetch("/api/addCart", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    itemId,
                }),
            });

            if (res.ok) {
                triggerToast("Item removed from cart", "success");
                fetchCart();
                window.dispatchEvent(new Event("cart-updated"));
            } else {
                throw new Error("Failed to remove item");
            }
        } catch (err: any) {
            console.error(err);
            triggerToast("Error removing item", "info");
        }
    };

    const handleBuyNow = (item: Item, e: React.MouseEvent) => {
        e.preventDefault();
        triggerToast(`Initiating checkout for "${item.name}"...`, "info");
    };

    const handleCheckout = () => {
        triggerToast("Checkout functionality is not yet implemented.", "info");
    };

    // Filter items based on search query
    const filteredItems = items.filter(
        (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Cart stats
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2);

    return (
        <>
            <Navbar />
            <div className="min-h-screen relative flex flex-col bg-slate-950 text-slate-100 px-4 py-12 select-none overflow-x-hidden">
            {/* Background radial gradient overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/15 via-slate-950 to-slate-950 pointer-events-none" />

            {/* Decorative ambient background glows */}
            <div className="absolute top-10 left-1/4 -translate-x-1/2 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-20 right-1/4 translate-x-1/2 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Toast Notification */}
            {toast.type && (
                <div className="fixed top-5 right-5 z-50 animate-slide-in flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border border-white/10 glass bg-white/95 text-slate-900 max-w-sm">
                    {toast.type === "success" ? (
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        </div>
                    ) : (
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    )}
                    <span className="text-sm font-semibold leading-tight">{toast.message}</span>
                </div>
            )}

            {/* Cart Drawer Backdrop */}
            <div 
                onClick={() => setCartOpen(false)}
                className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ${
                    cartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
            />

            {/* Cart Slide-Over Drawer */}
            <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white text-slate-800 shadow-2xl flex flex-col border-l border-slate-200 transition-transform duration-300 ease-in-out ${
                cartOpen ? "translate-x-0" : "translate-x-full"
            }`}>
                {/* Cart Header */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                            Your Cart ({cartCount})
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Manage your selected items</p>
                    </div>
                    <button 
                        onClick={() => setCartOpen(false)}
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Cart Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cartLoading && cart.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                    ) : cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 text-slate-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-slate-700 text-sm">Cart is empty</h3>
                            <p className="text-xs text-slate-400 max-w-[200px] mt-1 leading-normal">
                                Browse items in the store and add them to your cart.
                            </p>
                        </div>
                    ) : (
                        cart.map((cartItem) => (
                            <div key={cartItem.itemId} className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                {/* Thumbnail */}
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex-shrink-0">
                                    <img 
                                        src={cartItem.imageUrl[0] || "/placeholder.jpg"} 
                                        alt={cartItem.name} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Details */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-bold text-slate-800 text-sm leading-snug truncate">
                                            {cartItem.name}
                                        </h4>
                                        <button 
                                            onClick={() => removeCartItem(cartItem.itemId)}
                                            className="text-slate-400 hover:text-red-500 transition"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-slate-900 text-sm">
                                            ${cartItem.price}
                                        </span>
                                        {/* Modifiers */}
                                        <div className="flex items-center gap-2 border border-slate-200 rounded-lg bg-white p-0.5">
                                            <button 
                                                onClick={() => updateCartQuantity(cartItem.itemId, cartItem.quantity - 1)}
                                                className="w-5 h-5 rounded hover:bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs"
                                            >
                                                -
                                            </button>
                                            <span className="text-xs font-bold text-slate-800 w-4 text-center">
                                                {cartItem.quantity}
                                            </span>
                                            <button 
                                                onClick={() => updateCartQuantity(cartItem.itemId, cartItem.quantity + 1)}
                                                className="w-5 h-5 rounded hover:bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Cart Footer */}
                {cart.length > 0 && (
                    <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
                        <div className="flex items-center justify-between text-slate-700">
                            <span className="text-sm font-semibold">Subtotal</span>
                            <span className="font-black text-slate-900 text-xl">${cartTotal}</span>
                        </div>
                        <button 
                            onClick={handleCheckout}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/10 transition active:scale-98"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-6 border-b border-slate-800/80">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Store Catalog</h1>
                        <p className="text-slate-400 text-sm mt-1">Explore our premium selection of goods</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                        {/* Search Input */}
                        <div className="relative flex-1 sm:w-80">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search catalog name or specs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-2xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition"
                            />
                        </div>

                        {/* Shopper Controls (Only for non-admins) */}
                        {!isAdmin && (
                            <div className="flex items-center gap-4">
                                {/* Cart Trigger */}
                                <button
                                    onClick={() => setCartOpen(true)}
                                    className="relative flex items-center justify-center p-2.5 bg-slate-900 border border-slate-800 text-slate-200 rounded-2xl hover:bg-slate-800 transition gap-2 font-bold text-sm"
                                    title="Open shopping cart"
                                >
                                    <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                    </svg>
                                    <span className="hidden sm:inline">Cart</span>
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-slate-950">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>

                                {/* Profile Trigger */}
                                <button
                                    onClick={() => setProfileOpen(true)}
                                    className="flex items-center focus:outline-none transition hover:scale-105 active:scale-95"
                                    title="View & Edit Profile"
                                >
                                    {session?.user?.image ? (
                                        <img
                                            src={session.user.image}
                                            alt={session.user.name || "User profile"}
                                            className="w-9.5 h-9.5 rounded-full border border-slate-800 object-cover"
                                        />
                                    ) : (
                                        <div className="w-9.5 h-9.5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm border border-blue-500 shadow-md">
                                            {session?.user?.name ? session.user.name[0].toUpperCase() : "U"}
                                        </div>
                                    )}
                                </button>

                                {/* Logout Action */}
                                <button
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="relative flex items-center justify-center p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-900/30 hover:bg-red-950/10 rounded-2xl transition gap-2 font-bold text-sm"
                                    title="Sign out of account"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                    </svg>
                                    <span className="hidden sm:inline">Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Error State Banner */}
                {error && (
                    <div className="mb-8 flex items-center justify-between gap-3 p-4 rounded-2xl border border-red-900/40 bg-red-950/20 text-red-400">
                        <div className="flex items-center gap-3">
                            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                            </svg>
                            <span className="text-sm font-semibold">{error}</span>
                        </div>
                        <button
                            onClick={fetchItems}
                            className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 rounded-lg text-xs font-bold transition"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Content Section */}
                {loading ? (
                    /* Skeleton Grid Loader */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="glass border border-white/5 rounded-3xl overflow-hidden shadow-xl flex flex-col animate-pulse">
                                <div className="aspect-square bg-slate-900/90 w-full" />
                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        <div className="h-4 bg-slate-800 rounded-md w-3/4" />
                                        <div className="h-3 bg-slate-800 rounded-md w-full" />
                                        <div className="h-3 bg-slate-800 rounded-md w-5/6" />
                                    </div>
                                    <div className="space-y-3 pt-2">
                                        <div className="h-5 bg-slate-800 rounded-md w-1/3" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="h-9 bg-slate-800 rounded-xl" />
                                            <div className="h-9 bg-slate-800 rounded-xl" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    /* Empty State View */
                    <div className="flex-1 flex flex-col items-center justify-center p-12 glass border border-white/10 rounded-3xl max-w-xl mx-auto w-full text-center my-8">
                        <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mb-4 border border-slate-800 text-slate-500">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18a2.25 2.25 0 012.25 2.25v4.25A2.25 2.25 0 0118 22.5H6a2.25 2.25 0 01-2.25-2.25V15.75a2.25 2.25 0 012.25-2.25zm0-10.5h18A2.25 2.25 0 0122.5 5.25v4.25A2.25 2.25 0 0120 11.75H4a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 014 3h18z" />
                            </svg>
                        </div>
                        <h3 className="text-slate-900 font-extrabold text-xl">No products found</h3>
                        <p className="text-slate-500 text-sm mt-2 max-w-xs leading-relaxed">
                            {searchQuery
                                ? "We couldn't find matches for your search. Try typing another name or keyword."
                                : "Your inventory is currently empty. Get started by uploading your first listing."}
                        </p>
                    </div>
                ) : (
                    /* Active Product Card Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredItems.map((item) => {
                            const currentIdx = getActiveIndex(item._id);
                            const totalImages = item.imageUrl.length;

                            return (
                                <div
                                    key={item._id}
                                    className="glass border border-white/20 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:scale-[1.02] hover:shadow-blue-500/5 transition-all duration-300 flex flex-col group bg-white/95"
                                >
                                    {/* Card Image Container */}
                                    <div className="relative aspect-square w-full bg-slate-950 overflow-hidden select-none">
                                        <img
                                            src={item.imageUrl[currentIdx] || "/placeholder.jpg"}
                                            alt={item.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />

                                        {/* Image navigation arrows (overlay on hover if multiple images exist) */}
                                        {totalImages > 1 && (
                                            <>
                                                <button
                                                    onClick={(e) => prevImage(item._id, totalImages, e)}
                                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/45 hover:bg-black/70 text-white transition opacity-0 group-hover:opacity-100 z-10 hover:scale-110"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => nextImage(item._id, totalImages, e)}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/45 hover:bg-black/70 text-white transition opacity-0 group-hover:opacity-100 z-10 hover:scale-110"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                    </svg>
                                                </button>

                                                {/* Navigation dots */}
                                                <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
                                                    {item.imageUrl.map((_, dotIdx) => (
                                                        <button
                                                            key={dotIdx}
                                                            onClick={(e) => selectImageIndex(item._id, dotIdx, e)}
                                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${currentIdx === dotIdx ? "bg-white w-4" : "bg-white/50 hover:bg-white/80"
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {/* Badges */}
                                        {totalImages > 1 && (
                                            <div className="absolute top-3 right-3 bg-black/45 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                                                1 of {totalImages}
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Details */}
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            {/* Name & Title */}
                                            <h3 className="text-slate-900 font-extrabold text-lg tracking-tight line-clamp-1 hover:text-blue-600 transition-colors">
                                                {item.name}
                                            </h3>

                                            {/* Short Description */}
                                            <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed h-8">
                                                {item.description}
                                            </p>
                                        </div>

                                        {/* Pricing & CTA Action panel */}
                                        <div className="mt-5 pt-3 border-t border-slate-200/60">
                                            <div className="flex items-baseline mb-4">
                                                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mr-1">$</span>
                                                <span className="text-slate-900 text-xl font-black">{item.price}</span>
                                            </div>

                                            {/* Buy / Add Cart buttons */}
                                            <div className="grid grid-cols-2 gap-2.5">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleAddToCart(item, e)}
                                                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition active:scale-98"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                                    </svg>
                                                    Add to Cart
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleBuyNow(item, e)}
                                                    className="flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/10 transition active:scale-98"
                                                >
                                                    Buy Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
        <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
        </>
    );
}
