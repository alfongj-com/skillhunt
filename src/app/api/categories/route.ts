import { NextResponse } from "next/server";
import { getAllCategories } from "@/lib/queries/categories";

export async function GET() {
  const categories = await getAllCategories();
  return NextResponse.json({ success: true, data: { categories } });
}
