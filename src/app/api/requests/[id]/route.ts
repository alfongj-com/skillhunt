import { NextRequest, NextResponse } from "next/server";
import { getRequestById } from "@/lib/queries/requests";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const request = await getRequestById(id);

  if (!request) {
    return NextResponse.json(
      { success: false, error: { message: "Request not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: request });
}
