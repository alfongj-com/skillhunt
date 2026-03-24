import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skills, skillVersions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function GET(_req: NextRequest, { params }: Props) {
  const { slug } = await params;

  const [skill] = await db
    .select({ id: skills.id })
    .from(skills)
    .where(and(eq(skills.slug, slug), eq(skills.status, "active")))
    .limit(1);

  if (!skill) {
    return NextResponse.json(
      { success: false, error: { message: "Skill not found" } },
      { status: 404 }
    );
  }

  const versions = await db
    .select({
      versionLabel: skillVersions.versionLabel,
      changelog: skillVersions.changelog,
      hasScripts: skillVersions.hasScripts,
      isInstructionOnly: skillVersions.isInstructionOnly,
      createdAt: skillVersions.createdAt,
    })
    .from(skillVersions)
    .where(eq(skillVersions.skillId, skill.id))
    .orderBy(desc(skillVersions.createdAt));

  return NextResponse.json({
    success: true,
    data: { versions },
  });
}
