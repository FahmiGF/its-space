import { ZodError } from "zod";

export class HttpError extends Error {
  status: number;
  extra?: Record<string, unknown>;

  constructor(status: number, message: string, extra?: Record<string, unknown>) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.extra = extra;
  }
}

export function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return json({ error: error.message, ...error.extra }, error.status);
  }
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return json(
      {
        error: first?.message ?? "Data tidak valid.",
        field: first?.path.join("."),
      },
      422,
    );
  }
  console.error("Unhandled API error", error);
  return json({ error: "Terjadi kesalahan pada server. Coba lagi." }, 500);
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return;
  try {
    if (new URL(origin).host !== host) {
      throw new HttpError(403, "Permintaan lintas-origin ditolak.");
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(403, "Origin permintaan tidak valid.");
  }
}

export function requestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function getBaseUrl(request?: Request): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (request) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") ?? "http";
    if (host) return `${protocol}://${host}`;
  }
  return "http://localhost:3200";
}
