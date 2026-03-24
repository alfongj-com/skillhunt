import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skills, skillRequests, skillRequestLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session || !(session as any).actorId) {
    return NextResponse.json(
      { success: false, error: { message: "Authentication required" } },
      { status: 401 }
    );
  }

  const actorId = (session as any).actorId as string;
  const { id } = await params;
  const body = await req.json();
  const { skillSlug, note } = body;

  if (!skillSlug) {
    return NextResponse.json(
      { success: false, error: { message: "skillSlug is required" } },
      { status: 400 }
    );
  }

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

  const [skill] = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, skillSlug))
    .limit(1);

  if (!skill) {
    return NextResponse.json(
      { success: false, error: { message: "Skill not found" } },
      { status: 404 }
    );
  }

  const [link] = await db
    .insert(skillRequestLinks)
    .values({
      requestId: id,
      skillId: skill.id,
      linkedByActorId: actorId,
      note: note || null,
    })
    .returning();

  return NextResponse.json({ success: true, data: { linkId: link.id } });
}
