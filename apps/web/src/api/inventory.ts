/**
 * Inventory API — Brands, Gadget Types, Devices
 */
import { api } from './client'
import { useAuthStore } from '@/stores/authStore'

const API_BASE = '/api/v1'

export interface Brand {
    id: string
    name: string
    logo_url?: string | null
}

export interface GadgetType {
    id: string
    name: string
}

export interface DeviceItem {
    id: string
    brand_id: string
    type_id: string
    model: string
    model_number?: string | null
    colour?: string | null
    storage?: string | null
    brand: Brand
    gadget_type: GadgetType
}

export interface DeviceCreate {
    brand_id: string
    type_id: string
    model: string
    model_number?: string | null
    colour?: string | null
    storage?: string | null
}

export const inventory = {
    // Brands
    getBrands: () => api.get<Brand[]>('/admin/brands'),
    createBrand: (data: { name: string; logo_url?: string }) => api.post<Brand>('/admin/brands', data),
    updateBrand: (id: string, data: { name?: string; logo_url?: string }) => api.put<Brand>(`/admin/brands/${id}`, data),
    deleteBrand: (id: string) => api.delete<void>(`/admin/brands/${id}`),

    // Gadget Types
    getTypes: () => api.get<GadgetType[]>('/admin/gadget-types'),
    createType: (data: { name: string }) => api.post<GadgetType>('/admin/gadget-types', data),
    updateType: (id: string, data: { name?: string }) => api.put<GadgetType>(`/admin/gadget-types/${id}`, data),
    deleteType: (id: string) => api.delete<void>(`/admin/gadget-types/${id}`),

    // Devices
    getDevices: () => api.get<DeviceItem[]>('/admin/devices'),
    createDevice: (data: DeviceCreate) => api.post<DeviceItem>('/admin/devices', data),
    updateDevice: (id: string, data: Partial<DeviceCreate>) => api.put<DeviceItem>(`/admin/devices/${id}`, data),
    deleteDevice: (id: string) => api.delete<void>(`/admin/devices/${id}`),

    // Excel
    exportExcel: () => {
        const token = useAuthStore.getState().accessToken
        const link = document.createElement('a')
        link.href = `${API_BASE}/admin/devices/export/excel`
        link.setAttribute('download', 'device_catalog.xlsx')
        // Trigger download via fetch so we can pass auth header
        fetch(`${API_BASE}/admin/devices/export/excel`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then(r => r.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob)
                link.href = url
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
            })
    },

    importExcel: async (file: File): Promise<{ created: number; errors: string[] }> => {
        const token = useAuthStore.getState().accessToken
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch(`${API_BASE}/admin/devices/import/excel`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        })
        if (!response.ok) throw new Error('Import failed')
        return response.json()
    },
}
