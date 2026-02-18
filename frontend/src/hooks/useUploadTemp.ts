// /var/www/frontend/src/hooks/useUploadTemp.ts
import { useMutation } from "@tanstack/react-query";
import api from "@/services/api";

export type UploadTempResult = {
  success: boolean;
  files: Array<{
    name: string;
    path: string;
    mime: string;
    size_kb: number;
    public_url: string;
  }>;
  errors: Array<{
    file: string;
    reason: string;
  }>;
  message?: string;
};

export function useUploadTemp() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const fd = new FormData();
      for (const f of files) fd.append("files[]", f);

      const { data } = await api.post("/v1/upload-temp", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return data as UploadTempResult;
    },
  });
}
