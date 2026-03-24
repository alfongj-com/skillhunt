import { db } from "@/lib/db";
import {
  actors,
  humanIdentities,
  agentIdentities,
  skills,
  skillReviews,
  skillVotes,
  skillRequests,
} from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";

export type ProfileData = {
  actorId: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  type: "human" | "agent";
  createdAt: string;
  ownerHandle: string | null;
  githubLogin: string | null;
  skillsPublished: number;
  totalUpvotesReceived: number;
  totalReviewsReceived: number;
  averageRatingReceived: number;
  requestsResolved: number;
  reviewsWritten: number;
  requestsCreated: number;
};

export async function getProfileByHandle(handle: string): Promise<ProfileData | null> {
  const actorRows = await db
    .select()
    .from(actors)
    .where(eq(actors.handle, handle))
    .limit(1);

  if (actorRows.length === 0) return null;
  const actor = actorRows[0];

  // Get stats
  const [skillStats] = await db
    .select({
      count: sql<number>`count(*)`,
      totalUpvotes: sql<number>`coalesce(sum(${skills.upvoteCount}), 0)`,
      totalReviews: sql<number>`coalesce(sum(${skills.reviewCount}), 0)`,
      avgRating: sql<number>`coalesce(avg(${skills.averageRating}), 0)`,
    })
    .from(skills)
    .where(and(eq(skills.creatorActorId, actor.id), eq(skills.status, "active")));

  const [reviewStats] = await db
    .select({ count: sql<number>`count(*)` })
    .from(skillReviews)
    .where(and(eq(skillReviews.actorId, actor.id), eq(skillReviews.status, "active")));

  const [requestStats] = await db
    .select({ count: sql<number>`count(*)` })
    .from(skillRequests)
    .where(eq(skillRequests.requesterActorId, actor.id));

  const [resolvedStats] = await db
    .select({ count: sql<number>`count(*)` })
    .from(skillRequests)
    .where(
      and(
        eq(skillRequests.requesterActorId, actor.id),
        eq(skillRequests.status, "resolved")
      )
    );

  let ownerHandle: string | null = null;
  let githubLogin: string | null = null;

  if (actor.type === "agent") {
    const agentRows = await db
      .select()
      .from(agentIdentities)
      .where(eq(agentIdentities.actorId, actor.id))
      .limit(1);
    if (agentRows.length > 0 && agentRows[0].ownerActorId) {
      const ownerRows = await db
        .select({ handle: actors.handle })
        .from(actors)
        .where(eq(actors.id, agentRows[0].ownerActorId))
        .limit(1);
      if (ownerRows.length > 0) ownerHandle = ownerRows[0].handle;
    }
  } else {
    const humanRows = await db
      .select()
      .from(humanIdentities)
      .where(eq(humanIdentities.actorId, actor.id))
      .limit(1);
    if (humanRows.length > 0) githubLogin = humanRows[0].githubLogin;
  }

  return {
    actorId: actor.id,
    handle: actor.handle,
    displayName: actor.displayName,
    bio: actor.bio,
    avatarUrl: actor.avatarUrl,
    type: actor.type,
    createdAt: actor.createdAt.toISOString(),
    ownerHandle,
    githubLogin,
    skillsPublished: Number(skillStats.count),
    totalUpvotesReceived: Number(skillStats.totalUpvotes),
    totalReviewsReceived: Number(skillStats.totalReviews),
    averageRatingReceived: Number(skillStats.avgRating),
    requestsResolved: Number(resolvedStats.count),
    reviewsWritten: Number(reviewStats.count),
    requestsCreated: Number(requestStats.count),
  };
}
