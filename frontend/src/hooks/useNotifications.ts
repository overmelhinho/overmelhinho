import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export type AppNotification = {
    id: string;
    type: string;
    notifiable_type: string;
    notifiable_id: number;
    data: {
        ticket_id: number;
        title: string;
        action: string;
        ticket_title: string;
    };
    read_at: string | null;
    created_at: string;
    updated_at: string;
};

type NotificationsResponse = {
    success: boolean;
    data: AppNotification[];
    unread_count: number;
};

export function useNotifications() {
    return useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            const { data } = await api.get("/v1/notifications");
            return data as NotificationsResponse;
        },
        staleTime: 1000 * 60, // 1 min
    });
}

export function useMarkNotificationAsRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/v1/notifications/${id}/read`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

export function useMarkAllNotificationsAsRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            await api.post("/v1/notifications/read-all");
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}
