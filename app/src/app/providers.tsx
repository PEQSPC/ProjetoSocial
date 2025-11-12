// src/app/providers.tsx
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/auth-context";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <AuthProvider>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </AuthProvider>
  );
}
