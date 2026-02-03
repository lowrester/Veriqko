import { api } from './client';

export interface SystemVersion {
    current_version: string;
    latest_version: string;
    is_update_available: boolean;
    last_checked: string;
}

export interface UpdateStatus {
    is_updating: boolean;
    current_step: string;
    progress_percent: number;
    last_log: string;
    error?: string;
}

export const system = {
    getVersion: async (): Promise<SystemVersion> => {
        return api.get<SystemVersion>('/system/version');
    },

    update: async (targetVersion = 'main'): Promise<{ message: string }> => {
        return api.post<{ message: string }>(`/system/update?target_version=${targetVersion}`);
    },

    getStatus: async (): Promise<UpdateStatus> => {
        return api.get<UpdateStatus>('/system/status');
    },
};
