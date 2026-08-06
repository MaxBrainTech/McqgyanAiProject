import type { Request } from "express";
import {
  PRODUCTION_APP_URL,
  buildAppUrl,
  resolveAppUrl,
} from "@shared/appUrl";

function getRequestOrigin(req: Request): string {
  const forwardedHost = String(req.headers["x-forwarded-host"] ?? "").trim();
  const host = forwardedHost || String(req.get("host") ?? "").trim();
  const forwardedProto = String(req.headers["x-forwarded-proto"] ?? "").trim();
  const protocol = forwardedProto || req.protocol || "https";

  if (!host) {
    return "";
  }

  return `${protocol}://${host}`;
}

export function getServerAppUrl(req?: Request): string {
  return resolveAppUrl(
    process.env.APP_URL,
    process.env.BASE_URL,
    req ? getRequestOrigin(req) : "",
    req ? req.get("origin") : "",
    req ? req.get("referer") : "",
    process.env.NODE_ENV === "production" ? PRODUCTION_APP_URL : "",
  );
}

export function buildServerAppUrl(req: Request | undefined, path: string): string {
  return buildAppUrl(getServerAppUrl(req), path);
}
