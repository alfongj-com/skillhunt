import Link from "next/link";
import type { SkillCard as SkillCardType } from "@/lib/queries/skills";
import { formatRating, timeAgo } from "@/lib/utils/format";

export function SkillCard({ skill }: { skill: SkillCardType }) {
  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm"
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-gray-900">
            {skill.displayName}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">
            {skill.summary}
          </p>
        </div>
        <div className="ml-3 flex flex-col items-center rounded border border-gray-200 px-2 py-1 text-center">
          <span className="text-xs font-medium text-gray-900">
            &#9650; {skill.upvoteCount}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
          {skill.categoryName}
        </span>
        {skill.typeLabels.slice(0, 3).map((label) => (
          <span
            key={label}
            className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span>@{skill.makerHandle}</span>
          {skill.reviewCount > 0 && (
            <span>
              &#9733; {formatRating(skill.averageRating)} ({skill.reviewCount})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>v{skill.latestVersion}</span>
          <span>{timeAgo(skill.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
