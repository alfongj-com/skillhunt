import { NextRequest, NextResponse } from "next/server";
import matter from "gray-matter";

const MAX_BUNDLE_SIZE = 500 * 1024; // 500 KB
const MAX_FILE_SIZE = 100 * 1024; // 100 KB

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { skillMd } = body;

  if (!skillMd) {
    return NextResponse.json(
      { success: false, error: { message: "skillMd is required" } },
      { status: 400 }
    );
  }

  const sizeBytes = Buffer.byteLength(skillMd, "utf-8");
  if (sizeBytes > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        success: false,
        error: { message: `SKILL.md exceeds max file size of ${MAX_FILE_SIZE / 1024} KB` },
      },
      { status: 400 }
    );
  }

  // Parse frontmatter
  let parsed;
  try {
    parsed = matter(skillMd);
  } catch (e) {
    return NextResponse.json(
      { success: false, error: { message: "Invalid YAML frontmatter" } },
      { status: 400 }
    );
  }

  const { data } = parsed;

  if (!data.name) {
    return NextResponse.json(
      { success: false, error: { message: "Frontmatter must include 'name'" } },
      { status: 400 }
    );
  }

  if (!data.description) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Frontmatter must include 'description'" },
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      name: data.name,
      description: data.description,
      tags: data.tags || [],
      hasScripts: /```(bash|sh|python|shell)/i.test(skillMd),
      isInstructionOnly: !/```(bash|sh|python|shell)/i.test(skillMd),
      sizeBytes,
    },
  });
}
