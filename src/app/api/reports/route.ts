import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !(session as any).actorId) {
    return NextResponse.json(
      { success: false, error: { message: "Authentication required" } },
      { status: 401 }
    );
  }

  const actorId = (session as any).actorId as string;
  const body = await req.json();
  const { targetType, targetId, reason, details } = body;

  if (!targetType || !targetId || !reason) {
    return NextResponse.json(
      { success: false, error: { message: "targetType, targetId, and reason are required" } },
      { status: 400 }
    );
  }

  const [report] = await db
    .insert(reports)
    .values({
      reporterActorId: actorId,
      targetType,
      targetId,
      reason,
      details: details || null,
    })
    .returning();

  return NextResponse.json({ success: true, data: { reportId: report.id } });
}
