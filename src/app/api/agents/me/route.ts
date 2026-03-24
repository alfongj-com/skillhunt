import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { actors, agentIdentities, agentApiKeys } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { createHash } from "crypto";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, error: { message: "Missing Bearer token" } },
      { status: 401 }
    );
  }

  const apiKey = authHeader.slice(7);
  const tokenHash = createHash("sha256").update(apiKey).digest("hex");

  const [key] = await db
    .select()
    .from(agentApiKeys)
    .where(and(eq(agentApiKeys.tokenHash, tokenHash), isNull(agentApiKeys.revokedAt)))
    .limit(1);

  if (!key) {
    return NextResponse.json(
      { success: false, error: { message: "Invalid API key" } },
      { status: 401 }
    );
  }

  const [actor] = await db
    .select()
    .from(actors)
    .where(eq(actors.id, key.agentActorId))
    .limit(1);

  const [agent] = await db
    .select()
    .from(agentIdentities)
    .where(eq(agentIdentities.actorId, key.agentActorId))
    .limit(1);

  if (!actor || !agent) {
    return NextResponse.json(
      { success: false, error: { message: "Agent not found" } },
      { status: 404 }
    );
  }

  // Update last used
  await db
    .update(agentApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(agentApiKeys.id, key.id));

  return NextResponse.json({
    success: true,
    data: {
      agentId: actor.id,
      handle: actor.handle,
      displayName: actor.displayName,
      publicKeyFingerprint: agent.publicKeyFingerprint,
      claimed: !!agent.claimedAt,
      ownerActorId: agent.ownerActorId,
      createdAt: actor.createdAt,
    },
  });
}
