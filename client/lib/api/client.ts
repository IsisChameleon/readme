import createClient, { type Middleware } from "openapi-fetch";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

import type { paths } from "./schema";

/** Get the current user's access token for API calls. */
export const getAccessToken = async (): Promise<string | undefined> => {
  const supabase = createSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
};

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = await getAccessToken();
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }
    return request;
  },
};

export const apiClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
});

apiClient.use(authMiddleware);
