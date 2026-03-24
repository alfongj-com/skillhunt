import { NextRequest, NextResponse } from "next/server";
import { getProfileByHandle } from "@/lib/queries/profiles";

type Props = {
  params: Promise<{ handle: string }>;
};

export async function GET(_req: NextRequest, { params }: Props) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);

  if (!profile) {
    return NextResponse.json(
      { success: false, error: { message: "Profile not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: profile });
}
