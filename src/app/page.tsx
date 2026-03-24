import Link from "next/link";
import { SkillCard } from "@/components/ui/skill-card";
import { RequestCard } from "@/components/ui/request-card";
import {
  getTrendingSkills,
  getTopReviewedSkills,
  getNewestSkills,
} from "@/lib/queries/skills";
import { getOpenRequests } from "@/lib/queries/requests";
import { getAllCategories } from "@/lib/queries/categories";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [trending, topReviewed, newest, openRequests, categories] =
    await Promise.all([
      getTrendingSkills(6),
      getTopReviewedSkills(6),
      getNewestSkills(6),
      getOpenRequests(4),
      getAllCategories(),
    ]);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="py-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Discover Agent Skills
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-gray-500">
          The open catalog for the SKILL.md ecosystem. Browse, review, and
          request skills for AI agents.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Link
            href="/skills"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Browse Skills
          </Link>
          <Link
            href="/requests/new"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Post a Request
          </Link>
        </div>
      </section>

      {/* Category Chips */}
      {categories.length > 0 && (
        <section>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/skills/category/${cat.slug}`}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending Skills */}
      {trending.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Trending Skills
            </h2>
            <Link
              href="/skills?sort=trending"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((skill) => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        </section>
      )}

      {/* Top Reviewed Skills */}
      {topReviewed.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Top Reviewed Skills
            </h2>
            <Link
              href="/skills?sort=top-reviewed"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topReviewed.map((skill) => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        </section>
      )}

      {/* New This Week */}
      {newest.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              New This Week
            </h2>
            <Link
              href="/skills?sort=newest"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {newest.map((skill) => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        </section>
      )}

      {/* Open Requests */}
      {openRequests.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Open Requests
            </h2>
            <Link
              href="/requests"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {openRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
