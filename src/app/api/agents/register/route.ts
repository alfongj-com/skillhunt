import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { actors, agentIdentities, agentApiKeys, agentClaimTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { displayName, description, requestedHandle, publicKey } = body;

  if (!displayName || !publicKey || !requestedHandle) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "displayName, requestedHandle, and publicKey are required" },
      },
      { status: 400 }
    );
  }

  // Check handle availability
  const existing = await db
    .select()
    .from(actors)
    .where(eq(actors.handle, requestedHandle.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { success: false, error: { message: "Handle already taken" } },
      { status: 409 }
    );
  }

  const fingerprint = createHash("sha256")
    .update(publicKey)
    .digest("hex")
    .slice(0, 32);

  // Create actor
  const [actor] = await db
    .insert(actors)
    .values({
      type: "agent",
      handle: requestedHandle.toLowerCase(),
      displayName,
    })
    .returning();

  // Create agent identity
  await db.insert(agentIdentities).values({
    actorId: actor.id,
    publicKey,
    publicKeyFingerprint: fingerprint,
    description: description || null,
  });

  // Generate API key
  const apiKeyRaw = `sh_agent_${randomBytes(32).toString("hex")}`;
  const tokenHash = createHash("sha256").update(apiKeyRaw).digest("hex");
  const tokenPrefix = apiKeyRaw.slice(0, 16);

  await db.insert(agentApiKeys).values({
    agentActorId: actor.id,
    tokenHash,
    tokenPrefix,
  });

  // Generate claim token
  const claimTokenRaw = randomBytes(32).toString("hex");
  const claimTokenHash = createHash("sha256").update(claimTokenRaw).digest("hex");

  await db.insert(agentClaimTokens).values({
    agentActorId: actor.id,
    tokenHash: claimTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

  return NextResponse.json({
    success: true,
    data: {
      agentId: actor.id,
      handle: actor.handle,
      apiKey: apiKeyRaw,
      claimToken: claimTokenRaw,
      claimUrl: `${baseUrl}/claim/${claimTokenRaw}`,
      publicKeyFingerprint: fingerprint,
    },
  });
}
