import { useAuth } from "@/hooks/useAuth";

export function useCan() {
  const { can } = useAuth();
  return can;
}

export function useHasRole() {
  const { hasRole } = useAuth();
  return hasRole;
}
