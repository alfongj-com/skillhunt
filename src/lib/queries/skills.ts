import { db } from "@/lib/db";
import {
  skills,
  skillVersions,
  skillFiles,
  skillVotes,
  skillReviews,
  skillToTypeLabels,
  skillTypeLabels,
  skillToTags,
  skillTags,
  actors,
  categories,
  agentIdentities,
  skillRequestLinks,
} from "@/lib/db/schema";
import { eq, desc, sql, and, gte, count, avg, inArray } from "drizzle-orm";

export type SkillCard = {
  id: string;
  slug: string;
  displayName: string;
  summary: string;
  categorySlug: string;
  categoryName: string;
  typeLabels: string[];
  tags: string[];
  makerHandle: string;
  makerType: "human" | "agent";
  makerAvatarUrl: string | null;
  averageRating: number;
  reviewCount: number;
  upvoteCount: number;
  latestVersion: string;
  updatedAt: string;
  publishedAt: string;
};

export type SkillDetail = SkillCard & {
  creatorActorId: string;
  repoUrl: string | null;
  homepageUrl: string | null;
  isClaimedCreator: boolean;
  skillMdRaw: string;
  parsedDescription: string | null;
  changelog: string | null;
  hasScripts: boolean;
  isInstructionOnly: boolean;
  files: { path: string; content: string; contentType: string; sizeBytes: number }[];
  versions: { versionLabel: string; createdAt: string; changelog: string | null }[];
  reviews: {
    id: string;
    rating: number;
    headline: string | null;
    body: string;
    actorHandle: string;
    actorDisplayName: string;
    actorAvatarUrl: string | null;
    actorType: string;
    versionLabelUsed: string | null;
    createdAt: string;
  }[];
};

async function enrichSkillCards(
  rawSkills: {
    id: string;
    slug: string;
    displayName: string;
    summary: string;
    upvoteCount: number;
    reviewCount: number;
    averageRating: number;
    updatedAt: Date;
    publishedAt: Date;
    categorySlug: string;
    categoryName: string;
    makerHandle: string;
    makerType: "human" | "agent";
    makerAvatarUrl: string | null;
    latestVersion: string | null;
  }[]
): Promise<SkillCard[]> {
  if (rawSkills.length === 0) return [];

  const skillIds = rawSkills.map((s) => s.id);

  // Get type labels for all skills
  const typeLabelsResult = await db
    .select({
      skillId: skillToTypeLabels.skillId,
      name: skillTypeLabels.name,
    })
    .from(skillToTypeLabels)
    .innerJoin(skillTypeLabels, eq(skillToTypeLabels.typeLabelId, skillTypeLabels.id))
    .where(inArray(skillToTypeLabels.skillId, skillIds));

  // Get tags for all skills
  const tagsResult = await db
    .select({
      skillId: skillToTags.skillId,
      name: skillTags.name,
    })
    .from(skillToTags)
    .innerJoin(skillTags, eq(skillToTags.tagId, skillTags.id))
    .where(inArray(skillToTags.skillId, skillIds));

  const typeMap = new Map<string, string[]>();
  for (const row of typeLabelsResult) {
    if (!typeMap.has(row.skillId)) typeMap.set(row.skillId, []);
    typeMap.get(row.skillId)!.push(row.name);
  }

  const tagMap = new Map<string, string[]>();
  for (const row of tagsResult) {
    if (!tagMap.has(row.skillId)) tagMap.set(row.skillId, []);
    tagMap.get(row.skillId)!.push(row.name);
  }

  return rawSkills.map((s) => ({
    id: s.id,
    slug: s.slug,
    displayName: s.displayName,
    summary: s.summary,
    categorySlug: s.categorySlug,
    categoryName: s.categoryName,
    typeLabels: typeMap.get(s.id) || [],
    tags: tagMap.get(s.id) || [],
    makerHandle: s.makerHandle,
    makerType: s.makerType,
    makerAvatarUrl: s.makerAvatarUrl,
    averageRating: s.averageRating,
    reviewCount: s.reviewCount,
    upvoteCount: s.upvoteCount,
    latestVersion: s.latestVersion || "1.0.0",
    updatedAt: s.updatedAt.toISOString(),
    publishedAt: s.publishedAt.toISOString(),
  }));
}

function baseSkillQuery() {
  return db
    .select({
      id: skills.id,
      slug: skills.slug,
      displayName: skills.displayName,
      summary: skills.summary,
      upvoteCount: skills.upvoteCount,
      reviewCount: skills.reviewCount,
      averageRating: skills.averageRating,
      updatedAt: skills.updatedAt,
      publishedAt: skills.publishedAt,
      categorySlug: categories.slug,
      categoryName: categories.name,
      makerHandle: actors.handle,
      makerType: actors.type,
      makerAvatarUrl: actors.avatarUrl,
      latestVersion: skillVersions.versionLabel,
    })
    .from(skills)
    .innerJoin(categories, eq(skills.primaryCategoryId, categories.id))
    .innerJoin(actors, eq(skills.creatorActorId, actors.id))
    .leftJoin(skillVersions, eq(skills.currentVersionId, skillVersions.id))
    .where(eq(skills.status, "active"));
}

export async function getTrendingSkills(limit = 6): Promise<SkillCard[]> {
  const raw = await baseSkillQuery()
    .orderBy(
      sql`(${skills.upvoteCount} * 2 + ${skills.reviewCount} * 4) / power(extract(epoch from now() - ${skills.publishedAt}) / 3600 + 12, 0.8) desc`
    )
    .limit(limit);
  return enrichSkillCards(raw);
}

export async function getTopReviewedSkills(limit = 6): Promise<SkillCard[]> {
  const raw = await baseSkillQuery()
    .orderBy(
      sql`(${skills.averageRating} * ${skills.reviewCount} + 300 * 5) / (${skills.reviewCount} + 5) desc`
    )
    .limit(limit);
  return enrichSkillCards(raw);
}

export async function getNewestSkills(limit = 6): Promise<SkillCard[]> {
  const raw = await baseSkillQuery()
    .orderBy(desc(skills.publishedAt))
    .limit(limit);
  return enrichSkillCards(raw);
}

export async function getMostUpvotedSkills(limit = 6): Promise<SkillCard[]> {
  const raw = await baseSkillQuery()
    .orderBy(desc(skills.upvoteCount))
    .limit(limit);
  return enrichSkillCards(raw);
}

export async function searchSkills(params: {
  q?: string;
  category?: string;
  type?: string;
  tag?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: SkillCard[]; total: number }> {
  const pageSize = params.limit || 12;
  const page = params.page || 1;
  const offset = (page - 1) * pageSize;

  const conditions = [eq(skills.status, "active")];

  if (params.category) {
    conditions.push(eq(categories.slug, params.category));
  }

  let query = db
    .select({
      id: skills.id,
      slug: skills.slug,
      displayName: skills.displayName,
      summary: skills.summary,
      upvoteCount: skills.upvoteCount,
      reviewCount: skills.reviewCount,
      averageRating: skills.averageRating,
      updatedAt: skills.updatedAt,
      publishedAt: skills.publishedAt,
      categorySlug: categories.slug,
      categoryName: categories.name,
      makerHandle: actors.handle,
      makerType: actors.type,
      makerAvatarUrl: actors.avatarUrl,
      latestVersion: skillVersions.versionLabel,
    })
    .from(skills)
    .innerJoin(categories, eq(skills.primaryCategoryId, categories.id))
    .innerJoin(actors, eq(skills.creatorActorId, actors.id))
    .leftJoin(skillVersions, eq(skills.currentVersionId, skillVersions.id))
    .where(and(...conditions))
    .limit(pageSize)
    .offset(offset);

  // Apply sort
  const sort = params.sort || "trending";
  let orderedQuery;
  switch (sort) {
    case "top-reviewed":
      orderedQuery = query.orderBy(
        sql`(${skills.averageRating} * ${skills.reviewCount} + 300 * 5) / (${skills.reviewCount} + 5) desc`
      );
      break;
    case "newest":
      orderedQuery = query.orderBy(desc(skills.publishedAt));
      break;
    case "recently-updated":
      orderedQuery = query.orderBy(desc(skills.updatedAt));
      break;
    case "most-upvoted":
      orderedQuery = query.orderBy(desc(skills.upvoteCount));
      break;
    default: // trending
      orderedQuery = query.orderBy(
        sql`(${skills.upvoteCount} * 2 + ${skills.reviewCount} * 4) / power(extract(epoch from now() - ${skills.publishedAt}) / 3600 + 12, 0.8) desc`
      );
  }

  const raw = await orderedQuery;

  // Get total count
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(skills)
    .innerJoin(categories, eq(skills.primaryCategoryId, categories.id))
    .where(and(...conditions));

  return {
    items: await enrichSkillCards(raw),
    total: Number(total),
  };
}

export async function getSkillBySlug(slug: string): Promise<SkillDetail | null> {
  const raw = await db
    .select({
      id: skills.id,
      slug: skills.slug,
      displayName: skills.displayName,
      summary: skills.summary,
      upvoteCount: skills.upvoteCount,
      reviewCount: skills.reviewCount,
      averageRating: skills.averageRating,
      updatedAt: skills.updatedAt,
      publishedAt: skills.publishedAt,
      creatorActorId: skills.creatorActorId,
      repoUrl: skills.repoUrl,
      homepageUrl: skills.homepageUrl,
      isClaimedCreator: skills.isClaimedCreator,
      categorySlug: categories.slug,
      categoryName: categories.name,
      makerHandle: actors.handle,
      makerType: actors.type,
      makerAvatarUrl: actors.avatarUrl,
      latestVersion: skillVersions.versionLabel,
      skillMdRaw: skillVersions.skillMdRaw,
      parsedDescription: skillVersions.parsedDescription,
      changelog: skillVersions.changelog,
      hasScripts: skillVersions.hasScripts,
      isInstructionOnly: skillVersions.isInstructionOnly,
    })
    .from(skills)
    .innerJoin(categories, eq(skills.primaryCategoryId, categories.id))
    .innerJoin(actors, eq(skills.creatorActorId, actors.id))
    .leftJoin(skillVersions, eq(skills.currentVersionId, skillVersions.id))
    .where(and(eq(skills.slug, slug), eq(skills.status, "active")))
    .limit(1);

  if (raw.length === 0) return null;
  const s = raw[0];

  // Get files for current version
  const files = s.latestVersion
    ? await db
        .select({
          path: skillFiles.path,
          content: skillFiles.content,
          contentType: skillFiles.contentType,
          sizeBytes: skillFiles.sizeBytes,
        })
        .from(skillFiles)
        .innerJoin(skillVersions, eq(skillFiles.skillVersionId, skillVersions.id))
        .where(eq(skillVersions.skillId, s.id))
        .orderBy(skillFiles.sortOrder)
    : [];

  // Get all versions
  const versions = await db
    .select({
      versionLabel: skillVersions.versionLabel,
      createdAt: skillVersions.createdAt,
      changelog: skillVersions.changelog,
    })
    .from(skillVersions)
    .where(eq(skillVersions.skillId, s.id))
    .orderBy(desc(skillVersions.createdAt));

  // Get reviews
  const reviews = await db
    .select({
      id: skillReviews.id,
      rating: skillReviews.rating,
      headline: skillReviews.headline,
      body: skillReviews.body,
      actorHandle: actors.handle,
      actorDisplayName: actors.displayName,
      actorAvatarUrl: actors.avatarUrl,
      actorType: actors.type,
      versionLabelUsed: skillReviews.versionLabelUsed,
      createdAt: skillReviews.createdAt,
    })
    .from(skillReviews)
    .innerJoin(actors, eq(skillReviews.actorId, actors.id))
    .where(and(eq(skillReviews.skillId, s.id), eq(skillReviews.status, "active")))
    .orderBy(desc(skillReviews.createdAt));

  // Get type labels and tags
  const typeLabelsResult = await db
    .select({ name: skillTypeLabels.name })
    .from(skillToTypeLabels)
    .innerJoin(skillTypeLabels, eq(skillToTypeLabels.typeLabelId, skillTypeLabels.id))
    .where(eq(skillToTypeLabels.skillId, s.id));

  const tagsResult = await db
    .select({ name: skillTags.name })
    .from(skillToTags)
    .innerJoin(skillTags, eq(skillToTags.tagId, skillTags.id))
    .where(eq(skillToTags.skillId, s.id));

  return {
    id: s.id,
    slug: s.slug,
    displayName: s.displayName,
    summary: s.summary,
    categorySlug: s.categorySlug,
    categoryName: s.categoryName,
    typeLabels: typeLabelsResult.map((t) => t.name),
    tags: tagsResult.map((t) => t.name),
    makerHandle: s.makerHandle,
    makerType: s.makerType,
    makerAvatarUrl: s.makerAvatarUrl,
    averageRating: s.averageRating,
    reviewCount: s.reviewCount,
    upvoteCount: s.upvoteCount,
    latestVersion: s.latestVersion || "1.0.0",
    updatedAt: s.updatedAt.toISOString(),
    publishedAt: s.publishedAt.toISOString(),
    creatorActorId: s.creatorActorId,
    repoUrl: s.repoUrl,
    homepageUrl: s.homepageUrl,
    isClaimedCreator: s.isClaimedCreator,
    skillMdRaw: s.skillMdRaw || "",
    parsedDescription: s.parsedDescription,
    changelog: s.changelog,
    hasScripts: s.hasScripts ?? false,
    isInstructionOnly: s.isInstructionOnly ?? true,
    files: files.map((f) => ({
      path: f.path,
      content: f.content,
      contentType: f.contentType,
      sizeBytes: f.sizeBytes,
    })),
    versions: versions.map((v) => ({
      versionLabel: v.versionLabel,
      createdAt: v.createdAt.toISOString(),
      changelog: v.changelog,
    })),
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      headline: r.headline,
      body: r.body,
      actorHandle: r.actorHandle,
      actorDisplayName: r.actorDisplayName,
      actorAvatarUrl: r.actorAvatarUrl,
      actorType: r.actorType,
      versionLabelUsed: r.versionLabelUsed,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function getSkillsByCategory(
  categorySlug: string,
  sort = "trending",
  limit = 12
): Promise<SkillCard[]> {
  return (await searchSkills({ category: categorySlug, sort, limit })).items;
}

export async function getSkillsByActor(actorId: string): Promise<SkillCard[]> {
  const raw = await db
    .select({
      id: skills.id,
      slug: skills.slug,
      displayName: skills.displayName,
      summary: skills.summary,
      upvoteCount: skills.upvoteCount,
      reviewCount: skills.reviewCount,
      averageRating: skills.averageRating,
      updatedAt: skills.updatedAt,
      publishedAt: skills.publishedAt,
      categorySlug: categories.slug,
      categoryName: categories.name,
      makerHandle: actors.handle,
      makerType: actors.type,
      makerAvatarUrl: actors.avatarUrl,
      latestVersion: skillVersions.versionLabel,
    })
    .from(skills)
    .innerJoin(categories, eq(skills.primaryCategoryId, categories.id))
    .innerJoin(actors, eq(skills.creatorActorId, actors.id))
    .leftJoin(skillVersions, eq(skills.currentVersionId, skillVersions.id))
    .where(and(eq(skills.creatorActorId, actorId), eq(skills.status, "active")))
    .orderBy(desc(skills.publishedAt));
  return enrichSkillCards(raw);
}
