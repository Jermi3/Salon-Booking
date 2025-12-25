'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, DbService } from '@/lib/supabase';
import { Service, ServiceCategory } from '@/config/services.config';

// Types
export interface CustomService extends Service {
    categoryId: string;
    isCustom: true;
}

export interface DbCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    image: string;
    color: string;
    sort_order: number;
    created_at: string;
}

interface ServicesContextType {
    categories: ServiceCategory[];
    addService: (categoryId: string, service: Omit<Service, 'id'>) => Promise<void>;
    updateService: (serviceId: string, updates: Partial<Service>) => Promise<void>;
    deleteService: (serviceId: string) => Promise<void>;
    getServiceById: (id: string) => (Service & { categoryId: string; categoryName: string }) | null;
    addCategory: (category: Omit<ServiceCategory, 'id' | 'services'>) => Promise<void>;
    updateCategory: (categoryId: string, updates: Partial<Omit<ServiceCategory, 'services'>>) => Promise<void>;
    deleteCategory: (categoryId: string) => Promise<void>;

    isLoading: boolean;
    refreshServices: () => Promise<void>;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export function ServicesProvider({ children }: { children: ReactNode }) {
    const [customServices, setCustomServices] = useState<CustomService[]>([]);
    const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch services from Supabase
    const fetchServices = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching services:', error);
                return;
            }

            const services: CustomService[] = (data || []).map((dbService: DbService) => ({
                id: dbService.id,
                name: dbService.name,
                description: dbService.description,
                shortDescription: dbService.short_description,
                price: dbService.price,
                duration: dbService.duration,
                image: dbService.image || '/images/placeholder-service.png',
                steps: dbService.steps || [],
                popular: dbService.popular,
                categoryId: dbService.category_id,
                isCustom: true as const,
            }));

            setCustomServices(services);
        } catch (error) {
            console.error('Failed to fetch services:', error);
        }
    }, []);

    // Fetch categories from Supabase
    const fetchCategories = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) {
                console.error('Error fetching categories:', error);
                return;
            }

            setDbCategories(data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    }, []);

    // Load on mount
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await Promise.all([fetchServices(), fetchCategories()]);
            setIsLoading(false);
        };
        init();
    }, [fetchServices, fetchCategories]);

    // Build categories from database with their services
    const categories: ServiceCategory[] = dbCategories.map(cat => {
        const categoryServices = customServices.filter(s => s.categoryId === cat.id);
        return {
            id: cat.id,
            name: cat.name,
            description: cat.description || '',
            icon: cat.icon || '',
            image: cat.image || '',
            color: cat.color || '#E8B4B8',
            services: categoryServices.map(({ categoryId: _categoryId, isCustom: _isCustom, ...service }) => service),
        };
    });

    // Add service
    const addService = useCallback(async (categoryId: string, serviceData: Omit<Service, 'id'>) => {
        const { data, error } = await supabase
            .from('services')
            .insert({
                category_id: categoryId,
                name: serviceData.name,
                description: serviceData.description,
                short_description: serviceData.shortDescription,
                price: serviceData.price,
                duration: serviceData.duration,
                image: serviceData.image || '',
                steps: serviceData.steps || [],
                popular: serviceData.popular || false,
            })
            .select()
            .single();

        if (error) throw error;

        const newService: CustomService = {
            id: data.id,
            name: data.name,
            description: data.description,
            shortDescription: data.short_description,
            price: data.price,
            duration: data.duration,
            image: data.image || '/images/placeholder-service.png',
            steps: data.steps || [],
            popular: data.popular,
            categoryId: data.category_id,
            isCustom: true,
        };

        setCustomServices(prev => [newService, ...prev]);
    }, []);

    // Update service
    const updateService = useCallback(async (serviceId: string, updates: Partial<Service>) => {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.shortDescription !== undefined) dbUpdates.short_description = updates.shortDescription;
        if (updates.price !== undefined) dbUpdates.price = updates.price;
        if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
        if (updates.image !== undefined) dbUpdates.image = updates.image;
        if (updates.steps !== undefined) dbUpdates.steps = updates.steps;
        if (updates.popular !== undefined) dbUpdates.popular = updates.popular;

        const { error } = await supabase
            .from('services')
            .update(dbUpdates)
            .eq('id', serviceId);

        if (error) throw error;

        setCustomServices(prev =>
            prev.map(service =>
                service.id === serviceId ? { ...service, ...updates } : service
            )
        );
    }, []);

    // Delete service
    const deleteService = useCallback(async (serviceId: string) => {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', serviceId);

        if (error) throw error;

        setCustomServices(prev => prev.filter(service => service.id !== serviceId));
    }, []);

    // Add category
    const addCategory = useCallback(async (categoryData: Omit<ServiceCategory, 'id' | 'services'>) => {
        const { data, error } = await supabase
            .from('categories')
            .insert({
                name: categoryData.name,
                description: categoryData.description,
                icon: categoryData.icon,
                image: categoryData.image,
                color: categoryData.color,
                sort_order: dbCategories.length,
            })
            .select()
            .single();

        if (error) throw error;

        setDbCategories(prev => [...prev, data]);
    }, [dbCategories.length]);

    // Update category
    const updateCategory = useCallback(async (categoryId: string, updates: Partial<Omit<ServiceCategory, 'services'>>) => {
        const { error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', categoryId);

        if (error) throw error;

        setDbCategories(prev =>
            prev.map(cat =>
                cat.id === categoryId ? { ...cat, ...updates } : cat
            )
        );
    }, []);

    // Delete category
    const deleteCategory = useCallback(async (categoryId: string) => {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', categoryId);

        if (error) throw error;

        setDbCategories(prev => prev.filter(cat => cat.id !== categoryId));
    }, []);

    // Get service by ID
    const getServiceById = useCallback((id: string) => {
        for (const category of categories) {
            const service = category.services.find(s => s.id === id);
            if (service) {
                return { ...service, categoryId: category.id, categoryName: category.name };
            }
        }
        return null;
    }, [categories]);

    // Refresh
    const refreshServices = useCallback(async () => {
        await Promise.all([fetchServices(), fetchCategories()]);
    }, [fetchServices, fetchCategories]);

    return (
        <ServicesContext.Provider
            value={{
                categories,
                addService,
                updateService,
                deleteService,
                getServiceById,
                addCategory,
                updateCategory,
                deleteCategory,
                isLoading,
                refreshServices,
            }}
        >
            {children}
        </ServicesContext.Provider>
    );
}

export function useServices() {
    const context = useContext(ServicesContext);
    if (context === undefined) {
        throw new Error('useServices must be used within a ServicesProvider');
    }
    return context;
}
