// src/hooks/usePermission.ts
import { useAuth } from "../contexts/AuthContext";

export function usePermission(requiredPerms: string[]) {
  const { user } = useAuth();
  // user.permissions é array de strings
  return requiredPerms.some(perm => user?.permissions?.includes(perm));
}
