import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skillRequests, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { searchRequests } from "@/lib/queries/requests";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params = {
    category: url.searchParams.get("category") || undefined,
    status: url.searchParams.get("status") || undefined,
    sort: url.searchParams.get("sort") || undefined,
    page: parseInt(url.searchParams.get("page") || "1"),
    limit: parseInt(url.searchParams.get("limit") || "12"),
  };

  const result = await searchRequests(params);

  return NextResponse.json({
    success: true,
    data: {
      items: result.items,
      hasMore: params.page * (params.limit || 12) < result.total,
    },
    meta: { total: result.total, page: params.page },
  });
}

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
  const { title, problemStatement, examplePrompts, desiredInputs, desiredOutputs, categorySlug } = body;

  if (!title || !problemStatement || !categorySlug) {
    return NextResponse.json(
      { success: false, error: { message: "title, problemStatement, and categorySlug are required" } },
      { status: 400 }
    );
  }

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

  const [request] = await db
    .insert(skillRequests)
    .values({
      requesterActorId: actorId,
      title,
      problemStatement,
      examplePrompts: examplePrompts || null,
      desiredInputs: desiredInputs || null,
      desiredOutputs: desiredOutputs || null,
      primaryCategoryId: cat.id,
    })
    .returning();

  return NextResponse.json({
    success: true,
    data: { id: request.id },
  });
}
