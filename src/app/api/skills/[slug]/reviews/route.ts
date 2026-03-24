import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skills, skillReviews } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

type Props = {
  params: Promise<{ slug: string }>;
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
  const { slug } = await params;
  const body = await req.json();
  const { rating, headline, body: reviewBody, versionLabelUsed } = body;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { success: false, error: { message: "Rating must be 1-5" } },
      { status: 400 }
    );
  }

  // Validate body
  if (!reviewBody || reviewBody.length < 60) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Review body must be at least 60 characters" },
      },
      { status: 400 }
    );
  }

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

  // Block self-review
  if (skill.creatorActorId === actorId) {
    return NextResponse.json(
      { success: false, error: { message: "Cannot review your own skill" } },
      { status: 403 }
    );
  }

  // Check existing active review
  const existing = await db
    .select()
    .from(skillReviews)
    .where(
      and(
        eq(skillReviews.skillId, skill.id),
        eq(skillReviews.actorId, actorId),
        eq(skillReviews.status, "active")
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "You already have an active review for this skill" },
      },
      { status: 409 }
    );
  }

  const [review] = await db
    .insert(skillReviews)
    .values({
      skillId: skill.id,
      actorId,
      rating,
      headline: headline || null,
      body: reviewBody,
      versionLabelUsed: versionLabelUsed || null,
    })
    .returning();

  // Update skill aggregate stats
  const [stats] = await db
    .select({
      count: sql<number>`count(*)`,
      avg: sql<number>`avg(${skillReviews.rating})`,
    })
    .from(skillReviews)
    .where(
      and(eq(skillReviews.skillId, skill.id), eq(skillReviews.status, "active"))
    );

  await db
    .update(skills)
    .set({
      reviewCount: Number(stats.count),
      averageRating: Math.round(Number(stats.avg) * 100),
      updatedAt: new Date(),
    })
    .where(eq(skills.id, skill.id));

  return NextResponse.json({
    success: true,
    data: { reviewId: review.id },
  });
}
