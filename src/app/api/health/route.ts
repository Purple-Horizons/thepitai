import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
    checks: {
      database: 'unknown',
      ably: process.env.ABLY_API_KEY ? 'configured' : 'not_configured',
    },
  };

  try {
    // Test database connection
    await db.execute(sql`SELECT 1`);
    checks.checks.database = 'connected';
  } catch (error) {
    checks.checks.database = 'error';
    checks.status = 'degraded';
  }

  return NextResponse.json(checks, {
    status: checks.status === 'healthy' ? 200 : 503,
  });
}
