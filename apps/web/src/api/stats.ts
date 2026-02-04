import { api } from './client';

export interface DashboardStats {
    counts: {
        total: number;
        completed: number;
        failed: number;
        in_progress: number;
    };
    metrics: {
        yield_rate: number;
    };
    recent_activity: Array<{
        id: string;
        serial_number: string;
        status: string;
        platform: string;
        model: string;
        updated_at: string;
    }>;
}

export interface DefectStat {
    model: string;
    test_step: string;
    count: number;
}

export interface TechnicianStat {
    name: string;
    jobs_completed: number;
}

export const stats = {
    getDashboard: async (): Promise<DashboardStats> => {
        return api.get<DashboardStats>('/stats/dashboard');
    },

    getFloor: async (): Promise<any[]> => {
        return api.get<any[]>('/stats/floor');
    },

    getDefects: async (): Promise<DefectStat[]> => {
        return api.get<DefectStat[]>('/stats/defects');
    },

    getTechnicians: async (days: number = 7): Promise<TechnicianStat[]> => {
        return api.get<TechnicianStat[]>(`/stats/technicians?days=${days}`);
    }
};
