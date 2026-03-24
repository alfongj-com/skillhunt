import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skills, skillVotes } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

type Props = {
  params: Promise<{ slug: string }>;
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
  const { slug } = await params;

  const [skill] = await db
    .select()
    .from(skills)
    .where(and(eq(skills.slug, slug), eq(skills.status, "active")))
    .limit(1);

  if (!skill) {
    return NextResponse.json(
      { success: false, error: { message: "Skill not found" } },
      { status: 404 }
    );
  }

  // Block self-upvote
  if (skill.creatorActorId === actorId) {
    return NextResponse.json(
      { success: false, error: { message: "Cannot upvote your own skill" } },
      { status: 403 }
    );
  }

  // Check existing vote
  const existing = await db
    .select()
    .from(skillVotes)
    .where(and(eq(skillVotes.skillId, skill.id), eq(skillVotes.actorId, actorId)))
    .limit(1);

  if (existing.length > 0) {
    // Remove vote (toggle)
    await db
      .delete(skillVotes)
      .where(and(eq(skillVotes.skillId, skill.id), eq(skillVotes.actorId, actorId)));

    await db
      .update(skills)
      .set({ upvoteCount: sql`${skills.upvoteCount} - 1` })
      .where(eq(skills.id, skill.id));

    return NextResponse.json({
      success: true,
      data: { voted: false },
    });
  }

  // Add vote
  await db.insert(skillVotes).values({
    skillId: skill.id,
    actorId,
  });

  await db
    .update(skills)
    .set({ upvoteCount: sql`${skills.upvoteCount} + 1` })
    .where(eq(skills.id, skill.id));

  return NextResponse.json({
    success: true,
    data: { voted: true },
  });
}
