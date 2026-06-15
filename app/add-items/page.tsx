"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function AddItemsPage() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [images, setImages] = useState<(string | null)[]>([null, null, null, null, null]);
    const [uploading, setUploading] = useState<boolean[]>([false, false, false, false, false]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file is an image
        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image file.");
            return;
        }

        setUploading((prev) => {
            const next = [...prev];
            next[index] = true;
            return next;
        });
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
                setImages((prev) => {
                    const next = [...prev];
                    next[index] = data.imageUrl;
                    return next;
                });
            } else {
                throw new Error(data.message || "Cloudinary upload failed");
            }
        } catch (err: any) {
            console.error(err);
            setError(`Failed to upload image ${index + 1}: ${err.message || "Please try again"}`);
        } finally {
            setUploading((prev) => {
                const next = [...prev];
                next[index] = false;
                return next;
            });
        }
    };

    const removeImage = (index: number) => {
        setImages((prev) => {
            const next = [...prev];
            next[index] = null;
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !description.trim() || !price.trim()) {
            setError("Please fill in the Name, Description, and Price fields.");
            return;
        }

        const filteredImages = images.filter(Boolean) as string[];
        if (filteredImages.length === 0) {
            setError("Please upload at least one product image.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/addItem", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim(),
                    price: price.trim(),
                    imageUrl: filteredImages,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to add the product item");
            }

            setSuccess("Product listing created successfully!");
            // Reset form on success
            setName("");
            setDescription("");
            setPrice("");
            setImages([null, null, null, null, null]);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen relative flex flex-col items-center justify-center bg-slate-950 px-4 py-12">
                {/* Background radial gradient overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />

                {/* Decorative ambient background glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 w-full max-w-5xl">

                {/* Card Container */}
                <div className="glass border border-white/20 rounded-3xl p-6 sm:p-10 shadow-2xl">
                    <div className="mb-8 pb-4 border-b border-slate-200/50">
                        <h2 className="text-slate-900 font-extrabold text-2xl">Product Details 👋</h2>
                        <p className="text-slate-500 text-sm mt-1">Provide information and media for your item</p>
                    </div>

                    {/* Form and Alerts */}
                    {error && (
                        <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl border border-red-100 bg-red-50 text-red-700">
                            <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                            </svg>
                            <p className="text-sm font-semibold leading-tight">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 animate-slide-in">
                            <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            <p className="text-sm font-semibold leading-tight">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left side: Images (5 slots) */}
                        <div className="lg:col-span-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Product Media</label>
                                <p className="text-slate-400 text-xs mb-3">Upload up to 5 photos. First image will serve as the listing's primary image.</p>
                            </div>

                            {/* Primary Image Slot */}
                            <div className="relative aspect-video sm:aspect-square w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 overflow-hidden group transition-all duration-300 hover:border-blue-500 hover:bg-slate-100/50">
                                {uploading[0] ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs">
                                        <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span className="text-xs font-bold text-slate-600">Uploading Primary...</span>
                                    </div>
                                ) : images[0] ? (
                                    <div className="relative w-full h-full">
                                        <img src={images[0]} alt="Primary product preview" className="w-full h-full object-cover" />
                                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                                            Primary Image
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeImage(0)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-md hover:scale-105"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-4 select-none">
                                        <svg className="w-10 h-10 text-slate-400 mb-2 group-hover:text-blue-500 group-hover:scale-105 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors">Add Main Image</span>
                                        <span className="text-[10px] text-slate-400 mt-1">Drag & drop or browse</span>
                                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 0)} className="hidden" />
                                    </label>
                                )}
                            </div>

                            {/* 4 Secondary Images Grid */}
                            <div className="grid grid-cols-4 gap-3">
                                {[1, 2, 3, 4].map((index) => (
                                    <div key={index} className="relative aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 overflow-hidden group transition-all duration-300 hover:border-blue-500 hover:bg-slate-100/50">
                                        {uploading[index] ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs">
                                                <svg className="animate-spin h-5 w-5 text-blue-600 mb-1" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                <span className="text-[8px] font-bold text-slate-500 text-center">Uploading...</span>
                                            </div>
                                        ) : images[index] ? (
                                            <div className="relative w-full h-full">
                                                <img src={images[index]!} alt={`Detail ${index} preview`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-md hover:scale-105"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-1 select-none">
                                                <svg className="w-5 h-5 text-slate-400 mb-0.5 group-hover:text-blue-500 group-hover:scale-105 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                </svg>
                                                <span className="text-[9px] font-bold text-slate-500 group-hover:text-blue-600 transition-colors">Add Photo</span>
                                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, index)} className="hidden" />
                                            </label>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right side: Form Fields */}
                        <div className="lg:col-span-7 space-y-5">
                            <div>
                                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">Item Name</label>
                                <div className="relative">
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={loading}
                                        className="input-field px-4"
                                        placeholder="e.g. Wireless Noise-Cancelling Headphones"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="price" className="block text-sm font-semibold text-slate-700 mb-2">Price ($ USD)</label>
                                    <div className="relative">
                                        <input
                                            id="price"
                                            type="text"
                                            required
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            disabled={loading}
                                            className="input-field px-4"
                                            placeholder="e.g. 299.99"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">Product Description</label>
                                <div className="relative">
                                    <textarea
                                        id="description"
                                        required
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        disabled={loading}
                                        rows={6}
                                        className="input-field px-4 py-3 min-h-[150px] resize-y"
                                        placeholder="Provide a detailed description of the product features, specs, and condition..."
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || uploading.some(Boolean)}
                                    className="btn-primary"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Creating Listing...
                                        </span>
                                    ) : uploading.some(Boolean) ? (
                                        "Waiting for image uploads..."
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
                                            </svg>
                                            Save Item Listing
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        </>
    );
}