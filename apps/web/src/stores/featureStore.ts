import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/api/client'

export type FeatureKey = 'sla_management' | 'customer_portal' | 'inventory_sync' | 'automations'

interface FeatureState {
    features: Record<FeatureKey, boolean>
    isLoading: boolean
    fetchFeatures: () => Promise<void>
    toggleFeature: (key: FeatureKey) => Promise<void>
    setFeature: (key: FeatureKey, enabled: boolean) => void
}

export const useFeatureStore = create<FeatureState>()(
    persist(
        (set, get) => ({
            features: {
                sla_management: true,
                customer_portal: true,
                inventory_sync: true,
                automations: false,
            },
            isLoading: false,
            fetchFeatures: async () => {
                set({ isLoading: true })
                try {
                    const data = await api.get<{ key: string, value: boolean }[]>('/settings')
                    const features = get().features
                    data.forEach(item => {
                        if (item.key.startsWith('feature:')) {
                            const key = item.key.replace('feature:', '') as FeatureKey
                            features[key] = item.value
                        }
                    })
                    set({ features: { ...features } })
                } catch (error) {
                    console.error('Failed to fetch features', error)
                } finally {
                    set({ isLoading: false })
                }
            },
            toggleFeature: async (key) => {
                const newValue = !get().features[key]
                set((state) => ({
                    features: { ...state.features, [key]: newValue },
                }))
                try {
                    await api.put(`/settings/feature:${key}`, { value: newValue })
                } catch (error) {
                    console.error('Failed to update feature', error)
                    // Rollback on failure
                    set((state) => ({
                        features: { ...state.features, [key]: !newValue },
                    }))
                }
            },
            setFeature: (key, enabled) =>
                set((state) => ({
                    features: { ...state.features, [key]: enabled },
                })),
        }),
        {
            name: 'veriqko-features',
        }
    )
)
