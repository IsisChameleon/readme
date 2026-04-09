"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, getAccessToken } from "@/lib/api/client";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const token = await getAccessToken();
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const { response } = await apiClient.GET("/admin/is-admin");
      if (!response.ok) {
        router.replace("/");
        return;
      }
      setAuthorized(true);
    };
    check();
  }, [router]);

  if (!authorized) return null;

  return <>{children}</>;
};

export default AdminLayout;
