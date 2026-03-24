import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skillRequests, skillRequestVotes } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(_req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session || !(session as any).actorId) {
    return NextResponse.json(
      { success: false, error: { message: "Authentication required" } },
      { status: 401 }
    );
  }

  const actorId = (session as any).actorId as string;
  const { id } = await params;

  const [request] = await db
    .select()
    .from(skillRequests)
    .where(eq(skillRequests.id, id))
    .limit(1);

  if (!request) {
    return NextResponse.json(
      { success: false, error: { message: "Request not found" } },
      { status: 404 }
    );
  }

  // Check existing
  const existing = await db
    .select()
    .from(skillRequestVotes)
    .where(
      and(
        eq(skillRequestVotes.requestId, id),
        eq(skillRequestVotes.actorId, actorId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(skillRequestVotes)
      .where(
        and(
          eq(skillRequestVotes.requestId, id),
          eq(skillRequestVotes.actorId, actorId)
        )
      );
    await db
      .update(skillRequests)
      .set({ interestCount: sql`${skillRequests.interestCount} - 1` })
      .where(eq(skillRequests.id, id));
    return NextResponse.json({ success: true, data: { voted: false } });
  }

  await db.insert(skillRequestVotes).values({ requestId: id, actorId });
  await db
    .update(skillRequests)
    .set({ interestCount: sql`${skillRequests.interestCount} + 1` })
    .where(eq(skillRequests.id, id));

  return NextResponse.json({ success: true, data: { voted: true } });
}
