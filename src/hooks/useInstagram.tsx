import { useEffect, useState } from "react";
import { getIgStatus, getIgAuthUrl } from "@/lib/api";

export const useInstagram = () => {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = async () => {
    try {
      setLoading(true);
      const res = await getIgStatus();
      setConnected(res.connected);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const connect = async () => {
    try {
      const res = await getIgAuthUrl();
      window.open(res.auth_url, "_blank", "width=600,height=800");
    } catch (e: any) {
      setError(e.message);
    }
  };

  return { connected, loading, error, refreshStatus, connect };
}; 