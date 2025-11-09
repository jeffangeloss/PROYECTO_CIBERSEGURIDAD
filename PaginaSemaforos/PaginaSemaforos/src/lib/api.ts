const rawBase = import.meta.env.VITE_API_BASE_URL?.trim();

const normalizedBase = rawBase
  ? rawBase.replace(/\/+$/, "")
  : typeof window !== "undefined"
    ? window.location.origin
    : "";

export const API_BASE_URL = normalizedBase || "";

export interface ApiRequestOptions extends RequestInit {
  /**
   * When true (default), a 502 status code is treated as a network error.
   * This ayuda a identificar cuando el proxy local no llega al ESP32.
   */
  failOnBadGateway?: boolean;
}

export async function requestEsp32<T = unknown>(
  path: string,
  { failOnBadGateway = true, headers, ...init }: ApiRequestOptions = {}
): Promise<{ data: T | null; response: Response }> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const mergedHeaders: HeadersInit = {
    Accept: "application/json",
    ...headers,
  };

  const response = await fetch(url, {
    ...init,
    headers: mergedHeaders,
  });

  if (failOnBadGateway && response.status === 502) {
    const text = await response.text();
    const error = new Error(text || "Bad Gateway");
    throw Object.assign(error, { response });
  }

  let data: T | null = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = (await response.json()) as T;
    } catch (error) {
      console.warn("No se pudo parsear JSON de", url, error);
    }
  }

  return { data, response };
}

export function describeApiError(error: unknown): string {
  if (error instanceof Error) {
    if (typeof (error as any)?.response?.status === "number") {
      const status = (error as any).response.status;
      if (status === 502) {
        return "Sin respuesta del ESP32. Verifica que el servidor proxy y el microcontrolador estén encendidos.";
      }
      return `Error HTTP ${status}`;
    }
    return error.message;
  }
  return "Error desconocido";
}
