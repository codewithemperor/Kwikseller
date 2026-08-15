/**
 * API Proxy — forwards all /api/v1/* requests to the NestJS backend.
 *
 * NO business logic, NO dummy data, NO hardcoded responses.
 * Every request is proxied to the real NestJS API at http://localhost:4000/api/v1.
 *
 * The proxy handles:
 *  - Query string passthrough
 *  - Request body passthrough (POST/PUT/PATCH/DELETE)
 *  - Authorization header passthrough
 *  - Content-Type passthrough
 *  - 502 error when backend is unreachable
 */

import { NextRequest } from "next/server";

function backendBase(): string {
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    `${process.env.API_URL || "http://localhost:4000"}/api/v1`;
  return apiBase.endsWith("/api/v1")
    ? apiBase
    : `${apiBase.replace(/\/$/, "")}/api/v1`;
}

async function proxy(req: NextRequest, segments: string[]): Promise<Response> {
  const base = backendBase();
  const url = `${base}/${segments.join("/")}${req.nextUrl.search}`;

  // Forward relevant headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const auth = req.headers.get("authorization");
  if (auth) headers["authorization"] = auth;

  const cookie = req.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie;

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  // Pass body for non-GET requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const upstream = await fetch(url, init);
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return Response.json(
      {
        success: false,
        message: "Backend unreachable. Is the API running on port 4000?",
        statusCode: 502,
      },
      { status: 502 },
    );
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}
