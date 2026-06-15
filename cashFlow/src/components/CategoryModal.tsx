"use client";

import React, { useState, useEffect } from 'react';

import { buildCategoryTree, flattenCategoryTree, type Category } from "@/utils/categories";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  category?: Category | null;
  categories: Category[]; // Top level categories or all categories for parent selection
  defaultParentId?: string;
}

export default function CategoryModal({ isOpen, onClose, onSave, onDelete, category, categories, defaultParentId }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setParentId(category.parentId || '');
    } else {
      setName('');
      setParentId(defaultParentId || '');
    }
  }, [category, defaultParentId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave({ id: category?.id, name, parentId: parentId || null });
    setLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!category?.id || !onDelete) return;
    if (!confirm("Are you sure you want to delete this category? Subcategories and transactions might be affected.")) return;
    
    setLoading(true);
    await onDelete(category.id);
    setLoading(false);
    onClose();
  };

  // Prevent selecting itself or its children as parent (simple check: just prevent selecting itself for now)
  const availableParents = categories.filter(c => c.id !== category?.id);
  const parentTree = buildCategoryTree(availableParents);
  const flatParents = flattenCategoryTree(parentTree);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', width: '100%', maxWidth: '400px', padding: '24px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{category ? 'Edit Category' : 'New Category'}</h2>
          <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Category Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              placeholder="e.g. Groceries"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '1rem' }}
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Parent Category</label>
            <select 
              value={parentId} 
              onChange={e => setParentId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '1rem' }}
            >
              <option value="">-- None (Main Category) --</option>
              {flatParents.map(c => (
                <option key={c.id} value={c.id}>
                  {'\u00A0\u00A0'.repeat(c.depth)}{c.depth > 0 ? '└ ' : ''}{c.name}
                </option>
              ))}
            </select>
            <small style={{ display: 'block', marginTop: '8px', color: 'var(--text-muted)' }}>Select a parent to make this a subcategory.</small>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <div>
              {category && onDelete && (
                <button type="button" onClick={handleDelete} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e11d48', color: '#e11d48', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600 }}>Cancel</button>
              <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--unique-blue)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }} disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
