import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { db } from "@/lib/db";
import { actors, humanIdentities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "github" || !profile) return false;

      const githubUserId = String(profile.id);
      const githubLogin = (profile.login as string) || user.name || "unknown";

      // Check if human identity exists
      const existing = await db
        .select()
        .from(humanIdentities)
        .where(eq(humanIdentities.githubUserId, githubUserId))
        .limit(1);

      if (existing.length === 0) {
        // Create new actor + human identity
        const [actor] = await db
          .insert(actors)
          .values({
            type: "human",
            handle: githubLogin.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
            displayName: user.name || githubLogin,
            avatarUrl: user.image || profile.avatar_url as string,
            bio: (profile.bio as string) || null,
          })
          .returning();

        await db.insert(humanIdentities).values({
          actorId: actor.id,
          githubUserId,
          githubLogin,
          githubProfileUrl: (profile.html_url as string) || `https://github.com/${githubLogin}`,
          primaryEmail: user.email || null,
        });
      } else {
        // Update existing
        await db
          .update(humanIdentities)
          .set({
            githubLogin,
            githubProfileUrl: (profile.html_url as string) || `https://github.com/${githubLogin}`,
            primaryEmail: user.email || null,
            updatedAt: new Date(),
          })
          .where(eq(humanIdentities.githubUserId, githubUserId));

        await db
          .update(actors)
          .set({
            displayName: user.name || githubLogin,
            avatarUrl: user.image || (profile.avatar_url as string),
            lastActiveAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(actors.id, existing[0].actorId));
      }

      return true;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "github" && profile) {
        const githubUserId = String(profile.id);
        const human = await db
          .select()
          .from(humanIdentities)
          .where(eq(humanIdentities.githubUserId, githubUserId))
          .limit(1);

        if (human.length > 0) {
          token.actorId = human[0].actorId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.actorId) {
        (session as any).actorId = token.actorId as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/api/auth/signin",
  },
});
