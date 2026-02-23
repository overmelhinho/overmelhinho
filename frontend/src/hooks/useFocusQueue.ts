import { useQuery } from "@tanstack/react-query";
import axios from "@/services/api";

export function useFocusQueue() {
    return useQuery({
        queryKey: ["tickets", "focus"],
        queryFn: async () => {
            const { data } = await axios.get("/v1/tickets/my-focus");
            return data;
        },
        refetchOnWindowFocus: false,
    });
}
