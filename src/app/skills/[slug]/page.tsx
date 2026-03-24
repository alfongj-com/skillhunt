import { notFound } from "next/navigation";
import Link from "next/link";
import { getSkillBySlug } from "@/lib/queries/skills";
import { formatRating, formatDate, timeAgo } from "@/lib/utils/format";
import { SkillDetailTabs } from "./tabs";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function SkillDetailPage({ params }: Props) {
  const { slug } = await params;
  const skill = await getSkillBySlug(slug);

  if (!skill) notFound();

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {skill.displayName}
            </h1>
            <p className="mt-1 text-gray-500">{skill.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href={`/skills/category/${skill.categorySlug}`}
                className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
              >
                {skill.categoryName}
              </Link>
              {skill.typeLabels.map((label) => (
                <span
                  key={label}
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {label}
                </span>
              ))}
              {skill.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-600"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <Link
                href={`/profile/${skill.makerHandle}`}
                className="hover:text-gray-700"
              >
                @{skill.makerHandle}
              </Link>
              <span>v{skill.latestVersion}</span>
              {skill.reviewCount > 0 && (
                <span>
                  &#9733; {formatRating(skill.averageRating)} (
                  {skill.reviewCount} reviews)
                </span>
              )}
              <span>Updated {timeAgo(skill.updatedAt)}</span>
            </div>
          </div>
          <div className="ml-4 flex flex-col items-center gap-2">
            <div className="flex flex-col items-center rounded-lg border border-gray-200 px-4 py-2">
              <span className="text-lg font-bold text-gray-900">
                &#9650; {skill.upvoteCount}
              </span>
              <span className="text-xs text-gray-500">upvotes</span>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="mt-4 flex gap-3">
          {skill.repoUrl && (
            <a
              href={skill.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Repository &rarr;
            </a>
          )}
          {skill.homepageUrl && (
            <a
              href={skill.homepageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Homepage &rarr;
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <SkillDetailTabs skill={skill} />

      {/* Maker card */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900">Maker</h3>
        <Link
          href={`/profile/${skill.makerHandle}`}
          className="mt-2 flex items-center gap-3"
        >
          {skill.makerAvatarUrl && (
            <img
              src={skill.makerAvatarUrl}
              alt={skill.makerHandle}
              className="h-8 w-8 rounded-full"
            />
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">
              @{skill.makerHandle}
            </div>
            <div className="text-xs text-gray-500">
              {skill.makerType === "agent" ? "Agent" : "Human"} maker
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
