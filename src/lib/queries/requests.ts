import { db } from "@/lib/db";
import {
  skillRequests,
  skillRequestLinks,
  categories,
  actors,
  skills,
} from "@/lib/db/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

export type RequestCard = {
  id: string;
  title: string;
  problemStatement: string;
  requesterHandle: string;
  requesterAvatarUrl: string | null;
  categorySlug: string;
  categoryName: string;
  interestCount: number;
  status: string;
  linkedSkillsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type RequestDetail = RequestCard & {
  requesterActorId: string;
  examplePrompts: string[] | null;
  desiredInputs: string | null;
  desiredOutputs: string | null;
  linkedSkills: {
    skillSlug: string;
    skillName: string;
    linkedByHandle: string;
    note: string | null;
    createdAt: string;
  }[];
};

export async function getOpenRequests(limit = 6): Promise<RequestCard[]> {
  const raw = await db
    .select({
      id: skillRequests.id,
      title: skillRequests.title,
      problemStatement: skillRequests.problemStatement,
      requesterHandle: actors.handle,
      requesterAvatarUrl: actors.avatarUrl,
      categorySlug: categories.slug,
      categoryName: categories.name,
      interestCount: skillRequests.interestCount,
      status: skillRequests.status,
      createdAt: skillRequests.createdAt,
      updatedAt: skillRequests.updatedAt,
    })
    .from(skillRequests)
    .innerJoin(actors, eq(skillRequests.requesterActorId, actors.id))
    .innerJoin(categories, eq(skillRequests.primaryCategoryId, categories.id))
    .where(eq(skillRequests.status, "open"))
    .orderBy(desc(skillRequests.interestCount))
    .limit(limit);

  // Get linked skills count for each request
  const requestIds = raw.map((r) => r.id);
  const linkedCounts =
    requestIds.length > 0
      ? await db
          .select({
            requestId: skillRequestLinks.requestId,
            count: sql<number>`count(*)`,
          })
          .from(skillRequestLinks)
          .where(inArray(skillRequestLinks.requestId, requestIds))
          .groupBy(skillRequestLinks.requestId)
      : [];

  const countMap = new Map(linkedCounts.map((c) => [c.requestId, Number(c.count)]));

  return raw.map((r) => ({
    id: r.id,
    title: r.title,
    problemStatement: r.problemStatement,
    requesterHandle: r.requesterHandle,
    requesterAvatarUrl: r.requesterAvatarUrl,
    categorySlug: r.categorySlug,
    categoryName: r.categoryName,
    interestCount: r.interestCount,
    status: r.status,
    linkedSkillsCount: countMap.get(r.id) || 0,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function searchRequests(params: {
  category?: string;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: RequestCard[]; total: number }> {
  const pageSize = params.limit || 12;
  const page = params.page || 1;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (params.status) {
    conditions.push(eq(skillRequests.status, params.status as any));
  }
  if (params.category) {
    conditions.push(eq(categories.slug, params.category));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let query = db
    .select({
      id: skillRequests.id,
      title: skillRequests.title,
      problemStatement: skillRequests.problemStatement,
      requesterHandle: actors.handle,
      requesterAvatarUrl: actors.avatarUrl,
      categorySlug: categories.slug,
      categoryName: categories.name,
      interestCount: skillRequests.interestCount,
      status: skillRequests.status,
      createdAt: skillRequests.createdAt,
      updatedAt: skillRequests.updatedAt,
    })
    .from(skillRequests)
    .innerJoin(actors, eq(skillRequests.requesterActorId, actors.id))
    .innerJoin(categories, eq(skillRequests.primaryCategoryId, categories.id));

  if (whereClause) {
    query = query.where(whereClause) as typeof query;
  }

  const sort = params.sort || "most-wanted";
  let orderedQuery;
  switch (sort) {
    case "newest":
      orderedQuery = query.orderBy(desc(skillRequests.createdAt));
      break;
    case "recently-updated":
      orderedQuery = query.orderBy(desc(skillRequests.updatedAt));
      break;
    default: // most-wanted
      orderedQuery = query.orderBy(desc(skillRequests.interestCount));
  }

  const raw = await orderedQuery.limit(pageSize).offset(offset);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(skillRequests)
    .innerJoin(categories, eq(skillRequests.primaryCategoryId, categories.id))
    .where(whereClause);

  const requestIds = raw.map((r) => r.id);
  const linkedCounts =
    requestIds.length > 0
      ? await db
          .select({
            requestId: skillRequestLinks.requestId,
            count: sql<number>`count(*)`,
          })
          .from(skillRequestLinks)
          .where(inArray(skillRequestLinks.requestId, requestIds))
          .groupBy(skillRequestLinks.requestId)
      : [];
  const countMap = new Map(linkedCounts.map((c) => [c.requestId, Number(c.count)]));

  return {
    items: raw.map((r) => ({
      id: r.id,
      title: r.title,
      problemStatement: r.problemStatement,
      requesterHandle: r.requesterHandle,
      requesterAvatarUrl: r.requesterAvatarUrl,
      categorySlug: r.categorySlug,
      categoryName: r.categoryName,
      interestCount: r.interestCount,
      status: r.status,
      linkedSkillsCount: countMap.get(r.id) || 0,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    total: Number(total),
  };
}

export async function getRequestById(id: string): Promise<RequestDetail | null> {
  const raw = await db
    .select({
      id: skillRequests.id,
      title: skillRequests.title,
      problemStatement: skillRequests.problemStatement,
      requesterActorId: skillRequests.requesterActorId,
      requesterHandle: actors.handle,
      requesterAvatarUrl: actors.avatarUrl,
      categorySlug: categories.slug,
      categoryName: categories.name,
      interestCount: skillRequests.interestCount,
      status: skillRequests.status,
      examplePrompts: skillRequests.examplePrompts,
      desiredInputs: skillRequests.desiredInputs,
      desiredOutputs: skillRequests.desiredOutputs,
      createdAt: skillRequests.createdAt,
      updatedAt: skillRequests.updatedAt,
    })
    .from(skillRequests)
    .innerJoin(actors, eq(skillRequests.requesterActorId, actors.id))
    .innerJoin(categories, eq(skillRequests.primaryCategoryId, categories.id))
    .where(eq(skillRequests.id, id))
    .limit(1);

  if (raw.length === 0) return null;
  const r = raw[0];

  // Get linked skills
  const linked = await db
    .select({
      skillSlug: skills.slug,
      skillName: skills.displayName,
      linkedByHandle: actors.handle,
      note: skillRequestLinks.note,
      createdAt: skillRequestLinks.createdAt,
    })
    .from(skillRequestLinks)
    .innerJoin(skills, eq(skillRequestLinks.skillId, skills.id))
    .innerJoin(actors, eq(skillRequestLinks.linkedByActorId, actors.id))
    .where(eq(skillRequestLinks.requestId, id));

  const linkedSkillsCount = linked.length;

  return {
    id: r.id,
    title: r.title,
    problemStatement: r.problemStatement,
    requesterActorId: r.requesterActorId,
    requesterHandle: r.requesterHandle,
    requesterAvatarUrl: r.requesterAvatarUrl,
    categorySlug: r.categorySlug,
    categoryName: r.categoryName,
    interestCount: r.interestCount,
    status: r.status,
    linkedSkillsCount,
    examplePrompts: r.examplePrompts as string[] | null,
    desiredInputs: r.desiredInputs,
    desiredOutputs: r.desiredOutputs,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    linkedSkills: linked.map((l) => ({
      skillSlug: l.skillSlug,
      skillName: l.skillName,
      linkedByHandle: l.linkedByHandle,
      note: l.note,
      createdAt: l.createdAt.toISOString(),
    })),
  };
}
