import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skillTags } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const tags = await db.select().from(skillTags).orderBy(asc(skillTags.name));
  return NextResponse.json({ success: true, data: { tags } });
}
