export function getSafeClientRedirectPath(
  callbackUrl: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!callbackUrl) {
    return fallback;
  }

  if (callbackUrl.startsWith("/")) {
    return callbackUrl;
  }

  if (typeof window !== "undefined") {
    try {
      const parsed = new URL(callbackUrl);
      if (parsed.origin === window.location.origin) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}

export function getSafeServerRedirectUrl(url: string, baseUrl: string): string {
  if (url.startsWith("/")) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    const parsedBaseUrl = new URL(baseUrl);

    if (parsedUrl.origin === parsedBaseUrl.origin) {
      return url;
    }
  } catch {
    return baseUrl;
  }

  return baseUrl;
}