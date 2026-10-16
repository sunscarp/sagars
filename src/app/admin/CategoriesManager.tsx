"use client";

import React, { useState, useRef } from "react";
import { useCategories, Category, MAIN_TEXT_SIZES } from "@/hooks/useCategories";
import { uploadCategoryImage } from "@/utils/uploadImage";

// Uniform presentation values used across every category.
const UNIFORM_BG_COLOR = "#F1EEE7";
const UNIFORM_FONT = "var(--font-cormorant)";
const UNIFORM_TEXT_SIZE = 4;

export default function CategoriesManager() {
  const { categories, loading, addCategory, removeCategory, updateCategory, addSubcategory, removeSubcategory, updateSubcategory } = useCategories();
  const [error, setError] = useState<string | null>(null);

  // Add form
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editOrder, setEditOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subcategory state
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState("");
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newName.trim()) {
      setError("Category name is required");
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === newName.trim().toLowerCase())) {
      setError("Category already exists");
      return;
    }
    try {
      await addCategory(newName.trim(), newImage.trim());
      setNewName("");
      setNewImage("");
    } catch (err: any) {
      setError(err.message || "Failed to add category");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Products in this category will keep their category label.`)) return;
    try {
      await removeCategory(id);
      if (editingId === id) setEditingId(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete category");
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditImage(cat.image || "");
    setEditOrder(cat.order);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setUploadingImg(false);
  };

  const handleSave = async () => {
    if (!editingId) return;
    setError(null);
    if (!editName.trim()) {
      setError("Category name is required");
      return;
    }
    setSaving(true);
    try {
      const updates: Record<string, any> = {
        name: editName.trim(),
        image: editImage.trim(),
        bgColor: UNIFORM_BG_COLOR,
        mainTextFont: UNIFORM_FONT,
        mainTextSize: UNIFORM_TEXT_SIZE,
        order: editOrder,
      };
      await updateCategory(editingId, updates);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || "Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImg(true);
    try {
      const url = await uploadCategoryImage(file);
      setEditImage(url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingImg(false);
    }
  };

  const handleAddSubcategory = async (categoryId: string) => {
    if (!newSubName.trim()) {
      setError("Subcategory name is required");
      return;
    }
    const cat = categories.find(c => c.id === categoryId);
    if (cat?.subcategories?.some(s => s.name.toLowerCase() === newSubName.trim().toLowerCase())) {
      setError("Subcategory already exists in this category");
      return;
    }
    try {
      await addSubcategory(categoryId, newSubName.trim());
      setNewSubName("");
    } catch (err: any) {
      setError(err.message || "Failed to add subcategory");
    }
  };

  const handleDeleteSubcategory = async (categoryId: string, subIndex: number, name: string) => {
    if (!confirm(`Delete subcategory "${name}"?`)) return;
    try {
      await removeSubcategory(categoryId, subIndex);
      if (editingSubId === `${categoryId}-${subIndex}`) setEditingSubId(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete subcategory");
    }
  };

  const handleSaveSubcategory = async (categoryId: string, subIndex: number) => {
    if (!editingSubId) return;
    setError(null);
    if (!editSubName.trim()) {
      setError("Subcategory name is required");
      return;
    }
    try {
      await updateSubcategory(categoryId, subIndex, editSubName.trim());
      setEditingSubId(null);
    } catch (err: any) {
      setError(err.message || "Failed to update subcategory");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
        </div>
      )}

      {/* Add form */}
      <div className="bg-white rounded-xl border border-[#E1DFDC] p-6">
        <h3 className="text-sm font-semibold text-[#171813] mb-4">Add New Category</h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            className="flex-1 rounded-lg border border-[#E1DFDC] bg-[#F1EEE7]/50 px-4 py-2.5 text-sm text-[#171813] placeholder-[#9B998F] focus:outline-none focus:ring-2 focus:ring-[#595B53]/40 focus:border-[#595B53] transition-all"
          />
          <input
            type="text"
            value={newImage}
            onChange={(e) => setNewImage(e.target.value)}
            placeholder="Image URL (optional)"
            className="flex-1 rounded-lg border border-[#E1DFDC] bg-[#F1EEE7]/50 px-4 py-2.5 text-sm text-[#171813] placeholder-[#9B998F] focus:outline-none focus:ring-2 focus:ring-[#595B53]/40 focus:border-[#595B53] transition-all"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-[#171813] text-white text-sm font-semibold hover:bg-[#171813] shadow-sm transition-all active:scale-[0.98] whitespace-nowrap"
          >
            Add Category
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-[#E1DFDC] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F1EEE7]">
          <h3 className="text-sm font-semibold text-[#171813]">
            Categories
            <span className="ml-2 text-xs font-normal text-[#9B998F]">({categories.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#171813] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-sm text-[#9B998F]">No categories yet.</div>
        ) : (
          <ul className="divide-y divide-[#F1EEE7]">
            {categories.map((cat) => {
              const isEditing = editingId === cat.id;

              if (isEditing) {
                return (
                  <li key={cat.id} className="px-6 py-5 bg-[#FFFFFF]/30">

                      {/* Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-[#595B53] uppercase tracking-wider mb-1.5">Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-lg border border-[#E1DFDC] bg-white px-3.5 py-2.5 text-sm text-[#171813] focus:outline-none focus:ring-2 focus:ring-[#595B53]/40 focus:border-[#595B53] transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#595B53] uppercase tracking-wider mb-1.5">Order</label>
                          <input
                            type="number"
                            value={editOrder}
                            onChange={(e) => setEditOrder(Number(e.target.value))}
                            className="w-full rounded-lg border border-[#E1DFDC] bg-white px-3.5 py-2.5 text-sm text-[#171813] focus:outline-none focus:ring-2 focus:ring-[#595B53]/40 focus:border-[#595B53] transition-all"
                          />
                        </div>

                      </div>

                    {/* Image */}
                    <div className="mt-4">
                      <label className="block text-[10px] font-semibold text-[#595B53] uppercase tracking-wider mb-2">Image</label>
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-32 rounded-lg border border-[#E1DFDC] bg-[#F1EEE7] overflow-hidden flex items-center justify-center shrink-0">
                          {editImage ? (
                            <img src={editImage} alt="Category preview" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-7 h-7 text-[#C4C1B9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0021.75 19.5V4.5A1.5 1.5 0 0020.25 3H3.75A1.5 1.5 0 002.25 4.5v15A1.5 1.5 0 003.75 21zm10.5-11.25h.008v.008h-.008V9.75z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <input
                            ref={fileInputRef}
                            id="category-image-input"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingImg}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file);
                              e.target.value = "";
                            }}
                          />
                          <label
                            htmlFor="category-image-input"
                            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#E1DFDC] text-sm font-medium text-[#171813] transition-colors ${uploadingImg ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-[#F1EEE7]"}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v12m0-12l-4.5 4.5M12 3l4.5 4.5M4.5 20.25h15" />
                            </svg>
                            {uploadingImg ? "Uploading..." : editImage ? "Change image" : "Choose file"}
                          </label>
                          {editImage && !uploadingImg && (
                            <button
                              type="button"
                              onClick={() => setEditImage("")}
                              className="text-xs text-red-500 hover:text-red-700 transition-colors self-start"
                            >
                              Remove image
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 rounded-lg border border-[#E1DFDC] text-sm font-medium text-[#595B53] hover:bg-[#F1EEE7] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving || uploadingImg}
                        className="px-5 py-2 rounded-lg bg-[#171813] text-white text-sm font-semibold hover:bg-[#171813] shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </li>
                );
              }

              const catSubs = (cat.subcategories || []).sort((a: any, b: any) => a.order - b.order);
              const isExpanded = expandedCategoryId === cat.id;

              return (
                <li key={cat.id} className="group">
                  <div className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#F1EEE7]/50 transition-colors">
                    <span className="text-xs text-[#D8D5CD] font-mono w-4 text-center flex-shrink-0">{cat.order}</span>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-[#E1DFDC]" style={{ backgroundColor: cat.bgColor || '#F1EEE7' }}>
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <span style={{ fontFamily: cat.mainTextFont || "var(--font-cormorant)", wordBreak: 'keep-all' }} className={"text-[#171813] tracking-wide font-bold leading-tight px-1 " + (MAIN_TEXT_SIZES[cat.mainTextSize || 4] || MAIN_TEXT_SIZES[4])}>
                          {cat.name.split(' ')[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#171813] truncate">{cat.name}</p>
                      {catSubs.length > 0 && (
                        <p className="text-[11px] text-[#9B998F] mt-0.5">{catSubs.length} subcategories</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setExpandedCategoryId(isExpanded ? null : cat.id)}
                        className="p-2 rounded-lg text-[#9B998F] hover:text-[#595B53] hover:bg-[#FFFFFF] transition-colors"
                        title={isExpanded ? "Hide subcategories" : "Manage subcategories"}
                      >
                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-2 rounded-lg text-[#9B998F] hover:text-[#171813] hover:bg-[#FFFFFF] transition-colors"
                        title="Edit category"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete category"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded subcategory panel */}
                  {isExpanded && (
                    <div className="px-6 py-4 bg-[#F1EEE7] border-t border-[#F1EEE7]">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="text"
                          value={newSubName}
                          onChange={(e) => setNewSubName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSubcategory(cat.id); } }}
                          placeholder="New subcategory name"
                          className="flex-1 rounded-lg border border-[#E1DFDC] bg-white px-3 py-2 text-sm text-[#171813] placeholder-[#9B998F] focus:outline-none focus:ring-2 focus:ring-[#595B53]/40 focus:border-[#595B53] transition-all"
                        />
                        <button
                          onClick={() => handleAddSubcategory(cat.id)}
                          className="px-4 py-2 rounded-lg bg-[#595B53] text-white text-sm font-semibold hover:bg-[#595B53] shadow-sm transition-all active:scale-[0.98] whitespace-nowrap"
                        >
                          Add
                        </button>
                      </div>

                      {catSubs.length === 0 ? (
                        <p className="text-xs text-[#9B998F] py-2">No subcategories yet.</p>
                      ) : (
                        <ul className="space-y-1">
                          {catSubs.map((sub: any, subIdx: number) => (
                            <li key={subIdx} className="flex items-center gap-2 py-1.5">
                              {editingSubId === `${cat.id}-${subIdx}` ? (
                                <>
                                  <input
                                    type="text"
                                    value={editSubName}
                                    onChange={(e) => setEditSubName(e.target.value)}
                                    className="flex-1 rounded border border-[#E1DFDC] bg-white px-2 py-1 text-sm text-[#171813] focus:outline-none focus:ring-1 focus:ring-[#595B53]/40"
                                  />
                                  <button onClick={() => handleSaveSubcategory(cat.id, subIdx)} className="text-xs text-[#171813] font-semibold hover:underline">Save</button>
                                  <button onClick={() => setEditingSubId(null)} className="text-xs text-[#9B998F] hover:underline">Cancel</button>
                                </>
                              ) : (
                                <>
                                  <span className="flex-1 text-sm text-[#595B53]">{sub.name}</span>
                                  <button
                                    onClick={() => { setEditingSubId(`${cat.id}-${subIdx}`); setEditSubName(sub.name); }}
                                    className="text-xs text-[#9B998F] hover:text-[#171813] transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubcategory(cat.id, subIdx, sub.name)}
                                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
