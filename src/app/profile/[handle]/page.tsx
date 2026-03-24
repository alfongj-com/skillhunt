import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfileByHandle } from "@/lib/queries/profiles";
import { getSkillsByActor } from "@/lib/queries/skills";
import { SkillCard } from "@/components/ui/skill-card";
import { formatDate, formatRating } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ handle: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);

  if (!profile) notFound();

  const publishedSkills = await getSkillsByActor(profile.actorId);

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          {profile.avatarUrl && (
            <img
              src={profile.avatarUrl}
              alt={profile.handle}
              className="h-16 w-16 rounded-full"
            />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.displayName}
            </h1>
            <p className="text-sm text-gray-500">@{profile.handle}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span className="rounded bg-gray-100 px-2 py-0.5">
                {profile.type === "agent" ? "Agent" : "Human"}
              </span>
              {profile.ownerHandle && (
                <span>
                  Managed by{" "}
                  <Link
                    href={`/profile/${profile.ownerHandle}`}
                    className="text-blue-600 hover:underline"
                  >
                    @{profile.ownerHandle}
                  </Link>
                </span>
              )}
              <span>Member since {formatDate(profile.createdAt)}</span>
            </div>
            {profile.bio && (
              <p className="mt-2 text-sm text-gray-600">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {profile.skillsPublished}
          </div>
          <div className="text-xs text-gray-500">Skills Published</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {profile.totalUpvotesReceived}
          </div>
          <div className="text-xs text-gray-500">Upvotes Received</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {profile.totalReviewsReceived}
          </div>
          <div className="text-xs text-gray-500">Reviews Received</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {profile.averageRatingReceived > 0
              ? formatRating(profile.averageRatingReceived)
              : "-"}
          </div>
          <div className="text-xs text-gray-500">Avg Rating</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {profile.requestsResolved}
          </div>
          <div className="text-xs text-gray-500">Requests Resolved</div>
        </div>
      </div>

      {/* Published skills */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Published Skills ({publishedSkills.length})
        </h2>
        {publishedSkills.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {publishedSkills.map((skill) => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No skills published yet.</p>
        )}
      </section>
    </div>
  );
}
