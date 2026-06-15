"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Item {
  _id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string[];
  createdAt: string;
  updatedAt: string;
}

export default function EditDetailsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | null }>({
    message: "",
    type: null,
  });

  // Modal / Interaction State
  const [editingProduct, setEditingProduct] = useState<Item | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Item | null>(null);

  // Edit Form State
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editImages, setEditImages] = useState<(string | null)[]>([null, null, null, null, null]);
  const [editUploading, setEditUploading] = useState<boolean[]>([false, false, false, false, false]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/addItem");
      if (!res.ok) {
        throw new Error("Failed to load catalog items");
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

  const triggerToast = (message: string, type: "success" | "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: null });
    }, 3000);
  };

  // Setup product in edit form state
  const handleEditClick = (item: Item) => {
    setEditingProduct(item);
    setEditName(item.name);
    setEditDescription(item.description);
    setEditPrice(item.price);

    const initialImages: (string | null)[] = [null, null, null, null, null];
    item.imageUrl.forEach((url, i) => {
      if (i < 5) initialImages[i] = url;
    });
    setEditImages(initialImages);
    setEditUploading([false, false, false, false, false]);
  };

  // Image Upload helper in Modal
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      triggerToast("Please select a valid image file.", "info");
      return;
    }

    setEditUploading((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Upload failed");
      }

      const data = await res.json();
      if (data.success && data.imageUrl) {
        setEditImages((prev) => {
          const next = [...prev];
          next[index] = data.imageUrl;
          return next;
        });
      } else {
        throw new Error(data.message || "Cloudinary upload failed");
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(`Upload failed for slot ${index + 1}: ${err.message}`, "info");
    } finally {
      setEditUploading((prev) => {
        const next = [...prev];
        next[index] = false;
        return next;
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setEditImages((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  // Submit edits
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct) return;

    if (!editName.trim() || !editDescription.trim() || !editPrice.trim()) {
      triggerToast("Please fill in Name, Description, and Price.", "info");
      return;
    }

    const filteredImages = editImages.filter(Boolean) as string[];
    if (filteredImages.length === 0) {
      triggerToast("Please upload at least one product image.", "info");
      return;
    }

    setSaveLoading(true);

    try {
      const res = await fetch("/api/addItem", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: editingProduct._id,
          name: editName.trim(),
          description: editDescription.trim(),
          price: editPrice.trim(),
          imageUrl: filteredImages,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update item");
      }

      triggerToast("Product updated successfully!", "success");
      setEditingProduct(null);
      fetchItems(); // Reload list
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "Failed to update product.", "info");
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;

    setDeleteLoading(true);

    try {
      const res = await fetch("/api/addItem", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: deletingProduct._id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete item");
      }

      triggerToast("Product deleted successfully!", "success");
      setDeletingProduct(null);
      fetchItems(); // Reload list
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "Failed to delete product.", "info");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter items by name or description
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen relative flex flex-col bg-slate-950 text-slate-100 px-4 py-12 select-none overflow-x-hidden">
      {/* Background radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/15 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

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

      <div className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-6 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Manage Inventory</h1>
            <p className="text-slate-400 text-sm mt-1">Update product listings or delete them from the catalog</p>
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
                placeholder="Filter catalog list..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-2xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition"
              />
            </div>
          </div>
        </header>

        {/* Error State Banner */}
        {error && (
          <div className="mb-8 flex items-center justify-between gap-3 p-4 rounded-2xl border border-red-900/40 bg-red-950/20 text-red-400 animate-slide-in">
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
          /* Table Skeletons */
          <div className="glass border border-white/20 rounded-3xl p-6 shadow-xl animate-pulse">
            <div className="space-y-4">
              <div className="h-10 bg-slate-900 rounded-lg w-full" />
              <div className="h-16 bg-slate-900 rounded-xl w-full" />
              <div className="h-16 bg-slate-900 rounded-xl w-full" />
              <div className="h-16 bg-slate-900 rounded-xl w-full" />
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty Catalog view */
          <div className="flex-1 flex flex-col items-center justify-center p-12 glass border border-white/10 rounded-3xl max-w-xl mx-auto w-full text-center my-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mb-4 border border-slate-800 text-slate-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <h3 className="text-slate-900 font-extrabold text-xl">No products found</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-xs leading-relaxed">
              {searchQuery
                ? "No items match your active search filter. Clear the text input and try again."
                : "You have not listed any items yet. Add details of your first product."}
            </p>
            <Link
              href="/add-items"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-md transition active:scale-98"
            >
              Add Product
            </Link>
          </div>
        ) : (
          /* Products Management Catalog */
          <div className="glass border border-white/20 rounded-3xl overflow-hidden shadow-2xl bg-white/95 text-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-600 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Image</th>
                    <th className="py-4 px-6">Product Info</th>
                    <th className="py-4 px-6">Price</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Image Thumbnail */}
                      <td className="py-4 px-6">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
                          <img
                            src={item.imageUrl[0] || "/placeholder.jpg"}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      {/* Info */}
                      <td className="py-4 px-6 max-w-md">
                        <span className="block font-bold text-slate-900 text-base leading-tight">
                          {item.name}
                        </span>
                        <span className="block text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                          {item.description}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6">
                        <div className="flex items-center text-slate-900 font-extrabold text-base">
                          <span className="text-slate-400 text-xs mr-0.5 font-bold">$</span>
                          {item.price}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
                            title="Edit Listing"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeletingProduct(item)}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
                            title="Delete Listing"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal Overlay */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-xl text-slate-900">Edit Product</h3>
                <p className="text-xs text-slate-400 mt-0.5">Modify information and update listing media</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body / Edit Form */}
            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Image Editor (5 Slots) */}
              <div className="md:col-span-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Listing Media (Max 5)
                  </label>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Change alternate angles. Slot 1 is listing thumbnail.
                  </p>
                </div>

                {/* Main/Primary Slot */}
                <div className="relative aspect-square w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden group hover:border-blue-500 transition-colors">
                  {editUploading[0] ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xs">
                      <svg className="animate-spin h-6 w-6 text-blue-600 mb-1" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-[9px] font-bold text-slate-500">Uploading...</span>
                    </div>
                  ) : editImages[0] ? (
                    <div className="relative w-full h-full">
                      <img src={editImages[0]} alt="Primary preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(0)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-md"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <div className="absolute bottom-1.5 left-1.5 bg-blue-600 text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow">
                        Primary
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-4 select-none">
                      <svg className="w-8 h-8 text-slate-400 mb-1 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-500 transition-colors">Add Photo</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 0)} className="hidden" />
                    </label>
                  )}
                </div>

                {/* Sub grid */}
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((index) => (
                    <div key={index} className="relative aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden group hover:border-blue-500 transition-colors">
                      {editUploading[index] ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xs">
                          <svg className="animate-spin h-4 w-4 text-blue-600 mb-0.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                      ) : editImages[index] ? (
                        <div className="relative w-full h-full">
                          <img src={editImages[index]!} alt={`Detail ${index} preview`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 p-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-0.5 select-none">
                          <svg className="w-4 h-4 text-slate-400 mb-0.5 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, index)} className="hidden" />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Input fields */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-semibold text-slate-700 mb-1">
                    Item Name
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={saveLoading}
                    className="input-field px-4"
                    placeholder="Wireless Headphones"
                  />
                </div>

                <div>
                  <label htmlFor="edit-price" className="block text-sm font-semibold text-slate-700 mb-1">
                    Price ($ USD)
                  </label>
                  <input
                    id="edit-price"
                    type="text"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    disabled={saveLoading}
                    className="input-field px-4"
                    placeholder="299.99"
                  />
                </div>

                <div>
                  <label htmlFor="edit-description" className="block text-sm font-semibold text-slate-700 mb-1">
                    Product Description
                  </label>
                  <textarea
                    id="edit-description"
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    disabled={saveLoading}
                    rows={5}
                    className="input-field px-4 py-3 min-h-[120px] resize-y"
                    placeholder="Detailed specs..."
                  />
                </div>

                {/* Form actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    disabled={saveLoading}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading || editUploading.some(Boolean)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-md transition"
                  >
                    {saveLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center animate-fade-in-up">
            
            {/* Warning Icon */}
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="font-extrabold text-xl text-slate-900 mb-2">Delete Product listing?</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Are you sure you want to permanently delete **"{deletingProduct.name}"** from the store collection? This action is irreversible.
            </p>

            {/* Confirm Actions */}
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm shadow-md transition"
              >
                {deleteLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
