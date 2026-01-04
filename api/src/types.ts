/**
 * Shared Types for CMS API
 */

import type { Context } from 'hono';

export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  ADMIN_ORIGIN: string;
  SITE_ORIGIN: string;
  AI: any;
}

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  exp: number;
}

export interface TenantContext {
  siteId: string;
  organizationId: string;
  userRole: string;
}

export interface AppVariables {
  user: JWTPayload;
  tenant: TenantContext;
}

export type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;
