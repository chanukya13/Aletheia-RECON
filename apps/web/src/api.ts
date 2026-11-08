import { z } from "zod";
import { EditorSession, ErrorResponse } from "@recon/contracts";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public requestId: string,
    public code = "UNKNOWN",
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...(signal ? { signal } : {}),
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    const parsed = ErrorResponse.safeParse(data);
    throw new ApiError(
      response.status,
      parsed.success
        ? parsed.data.error.message
        : "An unexpected response was received.",
      parsed.success ? parsed.data.error.requestId : "unavailable",
      parsed.success ? parsed.data.error.code : "UNKNOWN",
    );
  }
  return schema.parse(data);
}
let editorSession: Promise<z.infer<typeof EditorSession>> | null = null;
export async function mutateApi<T>(
  path: string,
  body: unknown,
  schema: z.ZodType<T>,
  refreshed = false,
  signal?: AbortSignal,
): Promise<T> {
  editorSession ??= api("/editor-session", EditorSession).catch((error) => {
    editorSession = null;
    throw error;
  });
  const session = await editorSession;
  const response = await fetch(`/api/v1${path}`, {
    method: "POST",
    ...(signal ? { signal } : {}),
    headers: {
      "Content-Type": "application/json",
      "X-Recon-CSRF": session.csrfToken,
    },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    const parsed = ErrorResponse.safeParse(data);
    if (
      !refreshed &&
      parsed.success &&
      parsed.data.error.code === "ORIGIN_REJECTED"
    ) {
      editorSession = null;
      return mutateApi(path, body, schema, true, signal);
    }
    throw new ApiError(
      response.status,
      parsed.success
        ? parsed.data.error.message
        : "The edit could not be saved.",
      parsed.success ? parsed.data.error.requestId : "unavailable",
      parsed.success ? parsed.data.error.code : "UNKNOWN",
    );
  }
  return schema.parse(data);
}
