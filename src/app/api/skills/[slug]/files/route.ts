import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skills, skillVersions, skillFiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function GET(_req: NextRequest, { params }: Props) {
  const { slug } = await params;

  const [skill] = await db
    .select({ id: skills.id, currentVersionId: skills.currentVersionId })
    .from(skills)
    .where(and(eq(skills.slug, slug), eq(skills.status, "active")))
    .limit(1);

  if (!skill || !skill.currentVersionId) {
    return NextResponse.json(
      { success: false, error: { message: "Skill not found" } },
      { status: 404 }
    );
  }

  const files = await db
    .select({
      path: skillFiles.path,
      content: skillFiles.content,
      contentType: skillFiles.contentType,
      sizeBytes: skillFiles.sizeBytes,
    })
    .from(skillFiles)
    .where(eq(skillFiles.skillVersionId, skill.currentVersionId))
    .orderBy(skillFiles.sortOrder);

  return NextResponse.json({
    success: true,
    data: { files },
  });
}
