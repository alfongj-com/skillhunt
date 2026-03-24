import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  skills,
  skillVersions,
  skillFiles,
  categories,
  actors,
  humanIdentities,
  skillToTypeLabels,
  skillTypeLabels,
  skillToTags,
  skillTags,
} from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils/slugify";
import { searchSkills } from "@/lib/queries/skills";
import matter from "gray-matter";
import { createHash } from "crypto";

// GET /api/skills - search/browse
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params = {
    q: url.searchParams.get("q") || undefined,
    category: url.searchParams.get("category") || undefined,
    type: url.searchParams.get("type") || undefined,
    tag: url.searchParams.get("tag") || undefined,
    sort: url.searchParams.get("sort") || undefined,
    page: parseInt(url.searchParams.get("page") || "1"),
    limit: parseInt(url.searchParams.get("limit") || "12"),
  };

  const result = await searchSkills(params);

  return NextResponse.json({
    success: true,
    data: {
      items: result.items,
      hasMore: params.page * (params.limit || 12) < result.total,
      nextCursor: null,
    },
    meta: {
      total: result.total,
      page: params.page,
    },
  });
}

// POST /api/skills - publish a skill (human auth)
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
  const {
    skillMd,
    displayName,
    summary,
    categorySlug,
    version = "1.0.0",
    changelog,
    repoUrl,
    homepageUrl,
    typeLabels: typeLabelSlugs,
    tags: tagNames,
  } = body;

  if (!skillMd || !displayName || !summary || !categorySlug) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Missing required fields: skillMd, displayName, summary, categorySlug" },
      },
      { status: 400 }
    );
  }

  // Parse frontmatter
  let parsed;
  try {
    parsed = matter(skillMd);
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Invalid SKILL.md frontmatter" } },
      { status: 400 }
    );
  }

  // Find category
  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);

  if (!cat) {
    return NextResponse.json(
      { success: false, error: { message: "Invalid category" } },
      { status: 400 }
    );
  }

  const slug = slugify(displayName);

  // Check for existing skill by same creator
  const existing = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, slug))
    .limit(1);

  if (existing.length > 0 && existing[0].creatorActorId !== actorId) {
    return NextResponse.json(
      { success: false, error: { message: "Slug already taken by another creator" } },
      { status: 409 }
    );
  }

  const bundleHash = createHash("sha256").update(skillMd).digest("hex").slice(0, 32);
  const hasScripts = /```(bash|sh|python|shell)/i.test(skillMd);
  const isInstructionOnly = !hasScripts;

  if (existing.length > 0) {
    // New version of existing skill
    const skill = existing[0];
    const [newVersion] = await db
      .insert(skillVersions)
      .values({
        skillId: skill.id,
        versionLabel: version,
        parsedName: parsed.data.name || displayName,
        parsedDescription: parsed.data.description || summary,
        skillMdRaw: skillMd,
        changelog,
        bundleHash,
        hasScripts,
        isInstructionOnly,
        publishedByActorId: actorId,
      })
      .returning();

    // Store file
    await db.insert(skillFiles).values({
      skillVersionId: newVersion.id,
      path: "SKILL.md",
      content: skillMd,
      contentType: "text/markdown",
      sizeBytes: Buffer.byteLength(skillMd, "utf-8"),
      sortOrder: 0,
    });

    // Update skill
    await db
      .update(skills)
      .set({
        currentVersionId: newVersion.id,
        displayName,
        summary,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, skill.id));

    return NextResponse.json({
      success: true,
      data: { slug: skill.slug, versionLabel: version, isNewVersion: true },
    });
  }

  // New skill
  const [skill] = await db
    .insert(skills)
    .values({
      slug,
      creatorActorId: actorId,
      displayName,
      summary,
      primaryCategoryId: cat.id,
      repoUrl: repoUrl || null,
      homepageUrl: homepageUrl || null,
      isClaimedCreator: true,
    })
    .returning();

  const [newVersion] = await db
    .insert(skillVersions)
    .values({
      skillId: skill.id,
      versionLabel: version,
      parsedName: parsed.data.name || displayName,
      parsedDescription: parsed.data.description || summary,
      skillMdRaw: skillMd,
      changelog,
      bundleHash,
      hasScripts,
      isInstructionOnly,
      publishedByActorId: actorId,
    })
    .returning();

  await db.insert(skillFiles).values({
    skillVersionId: newVersion.id,
    path: "SKILL.md",
    content: skillMd,
    contentType: "text/markdown",
    sizeBytes: Buffer.byteLength(skillMd, "utf-8"),
    sortOrder: 0,
  });

  await db
    .update(skills)
    .set({ currentVersionId: newVersion.id })
    .where(eq(skills.id, skill.id));

  return NextResponse.json({
    success: true,
    data: { slug: skill.slug, versionLabel: version, isNewVersion: false },
  });
}
