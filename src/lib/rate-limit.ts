import { NextResponse } from "next/server";
import { RateLimiterMemory, type RateLimiterRes } from "rate-limiter-flexible";

const authLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60,
  blockDuration: 60,
});

const uploadLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
  blockDuration: 60,
});

type LimiterType = "auth" | "upload";

const limiters: Record<LimiterType, RateLimiterMemory> = {
  auth: authLimiter,
  upload: uploadLimiter,
};

function getClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return "unknown";
}

export async function rateLimit(
  request: Request,
  type: LimiterType
): Promise<NextResponse | null> {
  const ip = getClientIp(request);

  try {
    await limiters[type].consume(`${type}:${ip}`);
    return null;
  } catch (error) {
    const retryAfter = Math.max(
      1,
      Math.ceil(((error as RateLimiterRes).msBeforeNext ?? 1000) / 1000)
    );

    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
        },
      }
    );
  }
}