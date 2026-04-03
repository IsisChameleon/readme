import createClient from "openapi-fetch";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

import type { paths } from "./schema";

export const apiClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
});

/** Get the current user's access token for API calls. */
export const getAccessToken = async (): Promise<string | undefined> => {
  const supabase = createSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
};

/** Get Authorization header object for raw fetch calls. */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};
