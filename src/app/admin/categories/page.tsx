'use client';

import { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useServices } from '@/context/ServicesContext';
import { ServiceCategory } from '@/config/services.config';
import styles from '../admin.module.css';

interface CroppedArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface CategoryFormData {
    id?: string;
    name: string;
    description: string;
    icon: string;
    image: string;
    color: string;
}

const initialFormData: CategoryFormData = {
    name: '',
    description: '',
    icon: '',
    image: '',
    color: '#E8B4B8',
};

const colorPresets = [
    '#E8B4B8', '#D4A5A5', '#C9B8A8', '#B8A9C9', '#A8C9B8', '#C9A8B8',
    '#F0D9B5', '#BFD4DB', '#E5C1C1', '#C2D9C4', '#D9C4E5', '#D9D4C4',
];

export default function CategoriesPage() {
    const { categories, addCategory, updateCategory, deleteCategory, isLoading } = useServices();

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Image cropping state
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const onCropComplete = useCallback((croppedArea: CroppedArea, croppedAreaPixels: CroppedArea) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createCroppedImage = async () => {
        if (!imagePreview || !croppedAreaPixels) return;

        const image = new Image();
        image.src = imagePreview;

        await new Promise((resolve) => {
            image.onload = resolve;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        ctx.drawImage(
            image,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
        );

        const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9);
        setCroppedImage(croppedBase64);
        setFormData(prev => ({ ...prev, image: croppedBase64 }));
        setShowCropper(false);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setImagePreview(base64);
                setShowCropper(true);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setCroppedImage(null);
        setShowCropper(false);
        setFormData(prev => ({ ...prev, image: '' }));
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setModalMode('add');
        setFormData(initialFormData);
        setImagePreview(null);
        setCroppedImage(null);
        setShowCropper(false);
        setSuccessMessage('');
    };

    const handleAddClick = () => {
        setModalMode('add');
        setFormData(initialFormData);
        setImagePreview(null);
        setCroppedImage(null);
        setShowCropper(false);
        setShowModal(true);
    };

    const handleEditClick = (category: ServiceCategory) => {
        setModalMode('edit');
        setFormData({
            id: category.id,
            name: category.name,
            description: category.description,
            icon: category.icon,
            image: category.image,
            color: category.color,
        });
        // Set image preview if category has an image
        if (category.image && !category.image.includes('placeholder')) {
            setCroppedImage(category.image);
            setImagePreview(null);
            setShowCropper(false);
        } else {
            setCroppedImage(null);
            setImagePreview(null);
            setShowCropper(false);
        }
        setShowModal(true);
    };

    const handleDeleteClick = (categoryId: string, categoryName: string) => {
        setDeleteTarget({ id: categoryId, name: categoryName });
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await deleteCategory(deleteTarget.id);
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
        } catch (error) {
            alert('Failed to delete category. Make sure all services are removed first.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async () => {
        // Validation - required fields
        if (!formData.name.trim()) {
            alert('Please enter a category name');
            return;
        }
        // Check if image is being cropped but not applied - this blocks submission
        if (showCropper && imagePreview) {
            alert('Please click "Apply Crop" to confirm your image, or cancel the crop.');
            return;
        }
        // Warn about missing image but allow proceeding
        if (!croppedImage && !formData.image) {
            const proceed = confirm('No image has been added for this category. Do you want to continue?');
            if (!proceed) {
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const categoryData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                icon: formData.icon,
                image: formData.image,
                color: formData.color,
            };

            if (modalMode === 'edit' && formData.id) {
                await updateCategory(formData.id, categoryData);
                setSuccessMessage(`"${formData.name}" has been updated!`);
            } else {
                await addCategory(categoryData);
                setSuccessMessage(`"${formData.name}" has been created!`);
            }

            setTimeout(() => {
                handleCloseModal();
            }, 1500);
        } catch (error) {
            alert(`Failed to ${modalMode} category. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (showModal || showDeleteConfirm) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showModal, showDeleteConfirm]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Loading categories...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className={styles.headerTitle} style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Categories</h1>
                    <p className={styles.headerSubtitle} style={{ margin: 0 }}>Manage service categories.</p>
                </div>
                <button
                    onClick={handleAddClick}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.25rem',
                        background: 'linear-gradient(135deg, var(--terracotta-base), var(--terracotta-dark))',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(196, 92, 53, 0.3)',
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" />
                    </svg>
                    Add Category
                </button>
            </div>

            {/* Categories Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {categories.map((category) => (
                    <div key={category.id} className={styles.glassCard} style={{ padding: '1.5rem', position: 'relative' }}>
                        {/* Action buttons */}
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => handleEditClick(category)}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    background: 'rgba(255,255,255,0.8)',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                title="Edit category"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--charcoal-warm)" strokeWidth="2">
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleDeleteClick(category.id, category.name)}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                title="Delete category"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                </svg>
                            </button>
                        </div>

                        {/* Color indicator */}
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: category.color, marginBottom: '1rem' }} />

                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--charcoal-warm)', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
                            {category.name}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--bronze-light)', marginBottom: '1rem', lineHeight: 1.5 }}>
                            {category.description || 'No description'}
                        </p>
                        <div style={{ fontSize: '0.75rem', color: 'var(--bronze-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600 }}>{category.services.length}</span> services
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Category Modal */}
            {showModal && (
                <div className={styles.modalBackdrop} onClick={handleCloseModal}>
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '500px' }}
                    >
                        <button className={styles.modalClose} onClick={handleCloseModal}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                            </svg>
                        </button>

                        <h2 className={styles.modalTitle}>{modalMode === 'edit' ? 'Edit Category' : 'Add New Category'}</h2>

                        {successMessage && (
                            <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '10px', marginBottom: '1rem' }}>
                                <span style={{ color: '#22c55e', fontWeight: 500 }}>✓ {successMessage}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Name */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal-warm)', marginBottom: '0.5rem' }}>
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Facials"
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '0.95rem', background: 'rgba(255,255,255,0.8)', outline: 'none' }}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal-warm)', marginBottom: '0.5rem' }}>
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Brief description of the category"
                                    rows={2}
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '0.95rem', background: 'rgba(255,255,255,0.8)', outline: 'none', resize: 'vertical' }}
                                />
                            </div>

                            {/* Color */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal-warm)', marginBottom: '0.5rem' }}>
                                    Accent Color
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {colorPresets.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                background: color,
                                                border: formData.color === color ? '3px solid var(--charcoal-warm)' : '2px solid rgba(0,0,0,0.1)',
                                                cursor: 'pointer',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Category Image */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal-warm)', marginBottom: '0.5rem' }}>
                                    Category Image
                                </label>

                                {/* Cropper View */}
                                {showCropper && imagePreview && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ position: 'relative', height: '200px', background: '#f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>
                                            <Cropper
                                                image={imagePreview}
                                                crop={crop}
                                                zoom={zoom}
                                                aspect={16 / 9}
                                                onCropChange={setCrop}
                                                onCropComplete={onCropComplete}
                                                onZoomChange={setZoom}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--bronze-light)' }}>Zoom:</span>
                                            <input
                                                type="range"
                                                value={zoom}
                                                min={1}
                                                max={3}
                                                step={0.1}
                                                onChange={(e) => setZoom(Number(e.target.value))}
                                                style={{ flex: 1, accentColor: 'var(--terracotta-base)' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                            <button
                                                type="button"
                                                onClick={createCroppedImage}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.5rem',
                                                    background: 'linear-gradient(135deg, var(--terracotta-base), var(--terracotta-dark))',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                ✓ Apply Crop
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    color: '#ef4444',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Cropped image preview */}
                                {!showCropper && croppedImage && (
                                    <div style={{ position: 'relative' }}>
                                        <img
                                            src={croppedImage}
                                            alt="Preview"
                                            style={{
                                                width: '100%',
                                                height: '120px',
                                                objectFit: 'cover',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                background: 'rgba(0,0,0,0.6)',
                                                border: 'none',
                                                color: 'white',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="Remove image"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                {/* Upload button (shown when no image) */}
                                {!showCropper && !croppedImage && (
                                    <label
                                        htmlFor="category-image-upload"
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '1.5rem 1rem',
                                            border: '2px dashed rgba(196, 92, 53, 0.3)',
                                            borderRadius: '12px',
                                            background: 'rgba(255, 255, 255, 0.5)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--terracotta-base)" strokeWidth="1.5" style={{ marginBottom: '0.5rem', opacity: 0.7 }}>
                                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                        </svg>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--charcoal-warm)' }}>Click to upload image</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>PNG, JPG up to 5MB</span>
                                    </label>
                                )}

                                <input
                                    id="category-image-upload"
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    style={{ display: 'none' }}
                                    onChange={handleImageChange}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={handleCloseModal} disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={isSubmitting || !!successMessage} style={{ padding: '0.75rem 1.5rem', background: successMessage ? 'rgba(34, 197, 94, 0.8)' : 'linear-gradient(135deg, var(--terracotta-base), var(--terracotta-dark))', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', color: 'white', opacity: isSubmitting ? 0.7 : 1 }}>
                                {isSubmitting ? 'Saving...' : successMessage ? 'Saved!' : modalMode === 'edit' ? 'Update Category' : 'Add Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && deleteTarget && (
                <div className={styles.modalBackdrop} onClick={() => setShowDeleteConfirm(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            </svg>
                        </div>
                        <h2 className={styles.modalTitle}>Delete Category?</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>? All services in this category will need to be moved first.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleConfirmDelete} disabled={isDeleting} style={{ padding: '0.75rem 1.5rem', background: '#ef4444', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', color: 'white', opacity: isDeleting ? 0.7 : 1 }}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
