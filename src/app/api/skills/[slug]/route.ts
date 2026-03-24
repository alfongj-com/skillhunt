import { NextRequest, NextResponse } from "next/server";
import { getSkillBySlug } from "@/lib/queries/skills";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function GET(_req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const skill = await getSkillBySlug(slug);

  if (!skill) {
    return NextResponse.json(
      { success: false, error: { message: "Skill not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: skill,
  });
}
