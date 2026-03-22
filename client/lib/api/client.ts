import createClient from "openapi-fetch";

import type { paths } from "./schema";

const baseUrl =
  (typeof window !== "undefined"
    ? (window as Window & { __NEXT_PUBLIC_API_BASE_URL__?: string }).__NEXT_PUBLIC_API_BASE_URL__
    : undefined) ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

export const apiClient = createClient<paths>({
  baseUrl,
});
