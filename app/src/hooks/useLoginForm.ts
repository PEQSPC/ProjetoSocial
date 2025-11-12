import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function useLoginForm(initialEmail = "admin@sas.local") {
  const { login } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      setLoading(true);
      setError(null);
      await login(email, password);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha de autenticação";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { email, setEmail, password, setPassword, error, loading, submit };
}
