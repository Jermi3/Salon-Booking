'use client';

import { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import ServiceGrid from '@/components/admin/ServiceGrid';
import { useServices } from '@/context/ServicesContext';
import { Service } from '@/config/services.config';
import styles from '../admin.module.css';

// Type for cropped area
interface CroppedArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Form state type
interface ServiceStep {
    title: string;
    description: string;
}

interface ServiceFormData {
    id?: string;
    name: string;
    categoryId: string;
    price: string;
    duration: string;
    description: string;
    steps: ServiceStep[];
    popular: boolean;
}

const defaultSteps: ServiceStep[] = [
    { title: 'Consultation', description: 'Initial consultation and assessment' },
    { title: 'Treatment', description: 'Main service treatment' },
    { title: 'Finishing', description: 'Final touches and care instructions' },
];

const initialFormData: ServiceFormData = {
    name: '',
    categoryId: '',
    price: '',
    duration: '60',
    description: '',
    steps: [...defaultSteps],
    popular: false,
};

export default function ServicesPage() {
    const { categories, addService, updateService, deleteService, isLoading } = useServices();

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [formData, setFormData] = useState<ServiceFormData>(initialFormData);

    // Image state
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);

    // Submit state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setShowCropper(true);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
            };
            reader.readAsDataURL(file);
        }
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

        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCroppedImage(croppedDataUrl);
        setShowCropper(false);
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

    const handleRemoveImage = () => {
        setImagePreview(null);
        setCroppedImage(null);
        setShowCropper(false);
    };

    const handleAddClick = () => {
        setModalMode('add');
        setFormData(initialFormData);
        setShowModal(true);
    };

    const handleEditClick = (service: Service & { categoryId: string }) => {
        setModalMode('edit');
        setFormData({
            id: service.id,
            name: service.name,
            categoryId: service.categoryId,
            price: String(service.price),
            duration: service.duration.replace(' mins', ''),
            description: service.description,
            steps: service.steps && service.steps.length > 0 ? service.steps : [...defaultSteps],
            popular: service.popular || false,
        });
        if (service.image && !service.image.includes('placeholder')) {
            setCroppedImage(service.image);
        }
        setShowModal(true);
    };

    const handleStepChange = (index: number, field: 'title' | 'description', value: string) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.map((step, i) => i === index ? { ...step, [field]: value } : step),
        }));
    };

    const handleAddStep = () => {
        setFormData(prev => ({
            ...prev,
            steps: [...prev.steps, { title: '', description: '' }],
        }));
    };

    const handleRemoveStep = (index: number) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index),
        }));
    };

    const handleDeleteClick = (serviceId: string, serviceName: string) => {
        setDeleteTarget({ id: serviceId, name: serviceName });
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await deleteService(deleteTarget.id);
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
        } catch {
            alert('Failed to delete service. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async () => {
        // Validation - required fields
        if (!formData.name.trim()) {
            alert('Please enter a service name');
            return;
        }
        if (!formData.categoryId) {
            alert('Please select a category');
            return;
        }
        if (!formData.price || isNaN(Number(formData.price))) {
            alert('Please enter a valid price');
            return;
        }
        if (!formData.description.trim()) {
            alert('Please enter a description');
            return;
        }
        // Check if image is being cropped but not applied - this blocks submission
        if (showCropper && imagePreview) {
            alert('Please click "Apply Crop" to confirm your image, or cancel the crop.');
            return;
        }
        // Warn about missing image but allow proceeding
        if (!croppedImage) {
            const proceed = confirm('No image has been added. The service will use a placeholder image. Do you want to continue?');
            if (!proceed) {
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const serviceData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                shortDescription: formData.description.trim().slice(0, 50) + '...',
                price: Number(formData.price),
                duration: `${formData.duration} mins`,
                image: croppedImage || '/images/placeholder-service.png',
                steps: formData.steps.filter(s => s.title.trim() !== ''),
                popular: formData.popular,
            };

            if (modalMode === 'edit' && formData.id) {
                await updateService(formData.id, serviceData);
                setSuccessMessage(`"${formData.name}" has been updated successfully!`);
            } else {
                await addService(formData.categoryId, serviceData);
                setSuccessMessage(`"${formData.name}" has been added successfully!`);
            }

            setTimeout(() => {
                handleCloseModal();
            }, 1500);
        } catch {
            alert(`Failed to ${modalMode} service. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Lock body scroll when modal is open
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
                <p style={{ color: 'var(--text-secondary)' }}>Loading services...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className={styles.headerTitle} style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Services</h1>
                    <p className={styles.headerSubtitle} style={{ margin: 0 }}>View and manage available services and prices.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <a
                        href="/admin/categories"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem',
                            background: 'rgba(255,255,255,0.7)',
                            color: 'var(--charcoal-warm)',
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '12px',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                            <path d="M7 7h.01" />
                        </svg>
                        Manage Categories
                    </a>
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
                            boxShadow: '0 4px 12px rgba(196, 92, 53, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" />
                        </svg>
                        Add New Service
                    </button>
                </div>
            </div>

            <ServiceGrid
                categories={categories}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
            />

            {/* Add/Edit Service Modal */}
            {showModal && (
                <div className={styles.modalBackdrop} onClick={handleCloseModal}>
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
                    >
                        <button className={styles.modalClose} onClick={handleCloseModal}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                            </svg>
                        </button>

                        <h2 className={styles.modalTitle}>{modalMode === 'edit' ? 'Edit Service' : 'Add New Service'}</h2>
                        <p className={styles.modalSubtitle} style={{ marginBottom: '1.5rem' }}>
                            {modalMode === 'edit' ? 'Update the service details below.' : 'Create a new service for your salon.'}
                        </p>

                        {successMessage && (
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '10px',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
                                </svg>
                                <span style={{ color: '#22c55e', fontWeight: 500 }}>{successMessage}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Service Name */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal-warm)', marginBottom: '0.5rem' }}>
                                    Service Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Premium Facial"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        borderRadius: '10px',
                                        fontSize: '0.95rem',
                                        background: 'rgba(255,255,255,0.8)',
                                        outline: 'none',
                                    }}
                                />
                            </div>

                            {/* Category Selector */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal-warm)', marginBottom: '0.5rem' }}>
                                    Category *
                                </label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleInputChange}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        borderRadius: '10px',
                                        fontSize: '0.95rem',
                                        background: 'rgba(255,255,255,0.8)',
                                        outline: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Price & Duration */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal-warm)', marginBottom: '0.5rem' }}>
                                        Price (₱) *
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="2500"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            borderRadius: '10px',
                                            fontSize: '0.95rem',
                                            background: 'rgba(255,255,255,0.8)',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal-warm)', marginBottom: '0.5rem' }}>
                                        Duration (mins)
                                    </label>
                                    <select
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            borderRadius: '10px',
                                            fontSize: '0.95rem',
                                            background: 'rgba(255,255,255,0.8)',
                                            outline: 'none',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <option value="30">30 mins</option>
                                        <option value="45">45 mins</option>
                                        <option value="60">60 mins</option>
                                        <option value="75">75 mins</option>
                                        <option value="90">90 mins</option>
                                        <option value="120">120 mins</option>
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal-warm)', marginBottom: '0.5rem' }}>
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe the service..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        borderRadius: '10px',
                                        fontSize: '0.95rem',
                                        background: 'rgba(255,255,255,0.8)',
                                        outline: 'none',
                                        resize: 'vertical',
                                    }}
                                />
                            </div>

                            {/* Popular Toggle */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1rem',
                                background: formData.popular ? 'rgba(196, 151, 66, 0.1)' : 'rgba(255,255,255,0.6)',
                                borderRadius: '12px',
                                border: formData.popular ? '1px solid rgba(196, 151, 66, 0.3)' : '1px solid rgba(0,0,0,0.05)',
                                transition: 'all 0.2s ease',
                            }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--charcoal-warm)' }}>
                                        Mark as Popular
                                    </label>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                                        Popular services are highlighted and shown in suggestions
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, popular: !prev.popular }))}
                                    style={{
                                        width: '52px',
                                        height: '28px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        background: formData.popular
                                            ? 'linear-gradient(135deg, var(--accent-gold), #C49742)'
                                            : 'rgba(0,0,0,0.15)',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: 'all 0.2s ease',
                                        flexShrink: 0,
                                    }}
                                >
                                    <span style={{
                                        position: 'absolute',
                                        top: '3px',
                                        left: formData.popular ? '26px' : '3px',
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '50%',
                                        background: 'white',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        transition: 'left 0.2s ease',
                                    }} />
                                </button>
                            </div>

                            {/* What's Included Steps */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal-warm)', marginBottom: '0.5rem' }}>
                                    What&apos;s Included (Steps)
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {formData.steps.map((step, index) => (
                                        <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--terracotta-base)', color: 'white', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '4px' }}>
                                                {index + 1}
                                            </span>
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    value={step.title}
                                                    onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                                                    placeholder="Step title"
                                                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500, background: 'rgba(255,255,255,0.9)', outline: 'none' }}
                                                />
                                                <input
                                                    type="text"
                                                    value={step.description}
                                                    onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                                                    placeholder="Step description"
                                                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.9)', outline: 'none' }}
                                                />
                                            </div>
                                            {formData.steps.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveStep(index)}
                                                    style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '4px' }}
                                                    title="Remove step"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={handleAddStep}
                                        style={{ padding: '0.6rem 1rem', background: 'transparent', border: '1px dashed rgba(196, 92, 53, 0.4)', borderRadius: '8px', color: 'var(--terracotta-base)', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" />
                                        </svg>
                                        Add Step
                                    </button>
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal-warm)', marginBottom: '0.5rem' }}>
                                    Service Image (optional)
                                </label>

                                {showCropper && imagePreview && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ position: 'relative', height: '250px', borderRadius: '12px', overflow: 'hidden', background: '#1a1a1a' }}>
                                            <Cropper
                                                image={imagePreview}
                                                crop={crop}
                                                zoom={zoom}
                                                aspect={16 / 9}
                                                onCropChange={setCrop}
                                                onZoomChange={setZoom}
                                                onCropComplete={onCropComplete}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Zoom</span>
                                            <input
                                                type="range"
                                                min={1}
                                                max={3}
                                                step={0.1}
                                                value={zoom}
                                                onChange={(e) => setZoom(Number(e.target.value))}
                                                style={{ flex: 1, accentColor: 'var(--terracotta-base)' }}
                                            />
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '35px' }}>{zoom.toFixed(1)}x</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <button type="button" onClick={handleRemoveImage} style={{ flex: 1, padding: '0.6rem 1rem', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancel</button>
                                            <button type="button" onClick={createCroppedImage} style={{ flex: 1, padding: '0.6rem 1rem', background: 'var(--terracotta-base)', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: 'white' }}>Apply Crop</button>
                                        </div>
                                    </div>
                                )}

                                {croppedImage && !showCropper && (
                                    <div style={{ position: 'relative' }}>
                                        <img src={croppedImage} alt="Preview" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)' }} />
                                        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px' }}>
                                            <button type="button" onClick={() => setShowCropper(true)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit crop">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                            </button>
                                            <button type="button" onClick={handleRemoveImage} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Remove image">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!imagePreview && !croppedImage && (
                                    <label htmlFor="service-image-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', border: '2px dashed rgba(196, 92, 53, 0.3)', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--terracotta-base)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.75rem', opacity: 0.7 }}>
                                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                        </svg>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--charcoal-warm)', marginBottom: '0.25rem' }}>Click to upload image</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PNG, JPG up to 5MB</span>
                                    </label>
                                )}

                                <input id="service-image-upload" type="file" accept="image/png, image/jpeg, image/webp" style={{ display: 'none' }} onChange={handleImageChange} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={handleCloseModal} disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 500, cursor: isSubmitting ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)', opacity: isSubmitting ? 0.5 : 1 }}>
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={isSubmitting || !!successMessage} style={{ padding: '0.75rem 1.5rem', background: successMessage ? 'rgba(34, 197, 94, 0.8)' : 'linear-gradient(135deg, var(--terracotta-base), var(--terracotta-dark))', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: isSubmitting || successMessage ? 'not-allowed' : 'pointer', color: 'white', boxShadow: successMessage ? '0 4px 12px rgba(34, 197, 94, 0.3)' : '0 4px 12px rgba(196, 92, 53, 0.3)', opacity: isSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {isSubmitting ? 'Saving...' : successMessage ? 'Saved!' : modalMode === 'edit' ? 'Update Service' : 'Add Service'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && deleteTarget && (
                <div className={styles.modalBackdrop} onClick={() => setShowDeleteConfirm(false)}>
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '400px', textAlign: 'center' }}
                    >
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                        </div>
                        <h2 className={styles.modalTitle} style={{ marginBottom: '0.5rem' }}>Delete Service?</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Are you sure you want to delete <strong>&quot;{deleteTarget.name}&quot;</strong>? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', color: 'var(--text-secondary)' }}>
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
