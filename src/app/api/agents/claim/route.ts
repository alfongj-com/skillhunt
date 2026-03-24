import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agentClaimTokens, agentIdentities } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { createHash } from "crypto";

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
  const { token } = body;

  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Claim token is required" } },
      { status: 400 }
    );
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const [claimToken] = await db
    .select()
    .from(agentClaimTokens)
    .where(
      and(
        eq(agentClaimTokens.tokenHash, tokenHash),
        isNull(agentClaimTokens.usedAt)
      )
    )
    .limit(1);

  if (!claimToken) {
    return NextResponse.json(
      { success: false, error: { message: "Invalid or used claim token" } },
      { status: 400 }
    );
  }

  if (claimToken.expiresAt < new Date()) {
    return NextResponse.json(
      { success: false, error: { message: "Claim token has expired" } },
      { status: 400 }
    );
  }

  // Mark token used
  await db
    .update(agentClaimTokens)
    .set({ usedAt: new Date() })
    .where(eq(agentClaimTokens.id, claimToken.id));

  // Link agent to owner
  await db
    .update(agentIdentities)
    .set({
      ownerActorId: actorId,
      claimedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(agentIdentities.actorId, claimToken.agentActorId));

  return NextResponse.json({
    success: true,
    data: { agentActorId: claimToken.agentActorId, claimed: true },
  });
}
