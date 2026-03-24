import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skillRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

  if (request.requesterActorId !== actorId) {
    return NextResponse.json(
      { success: false, error: { message: "Only the request author can resolve" } },
      { status: 403 }
    );
  }

  await db
    .update(skillRequests)
    .set({ status: "resolved", resolvedAt: new Date(), updatedAt: new Date() })
    .where(eq(skillRequests.id, id));

  return NextResponse.json({ success: true, data: { status: "resolved" } });
}
