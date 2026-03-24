import { SkillCard } from "@/components/ui/skill-card";
import { searchSkills } from "@/lib/queries/skills";
import { getAllCategories } from "@/lib/queries/categories";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    type?: string;
    tag?: string;
    sort?: string;
    page?: string;
  }>;
};

const sortOptions = [
  { value: "trending", label: "Trending" },
  { value: "top-reviewed", label: "Top Reviewed" },
  { value: "newest", label: "Newest" },
  { value: "recently-updated", label: "Recently Updated" },
  { value: "most-upvoted", label: "Most Upvoted" },
];

export default async function SkillsPage({ searchParams }: Props) {
  const params = await searchParams;
  const sort = params.sort || "trending";
  const page = parseInt(params.page || "1");

  const [{ items: skills, total }, categories] = await Promise.all([
    searchSkills({
      q: params.q,
      category: params.category,
      type: params.type,
      tag: params.tag,
      sort,
      page,
    }),
    getAllCategories(),
  ]);

  const totalPages = Math.ceil(total / 12);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Skills Catalog</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse and search {total} skills
        </p>
      </div>

      {/* Filters bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Sort */}
        <div className="flex items-center gap-2">
          {sortOptions.map((opt) => (
            <Link
              key={opt.value}
              href={`/skills?${new URLSearchParams({ ...params, sort: opt.value, page: "1" }).toString()}`}
              className={`rounded-md px-3 py-1.5 text-sm ${
                sort === opt.value
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={`/skills?${new URLSearchParams({ ...params, category: "", page: "1" }).toString()}`}
              className={`rounded-full px-2.5 py-0.5 text-xs ${
                !params.category
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/skills?${new URLSearchParams({ ...params, category: cat.slug, page: "1" }).toString()}`}
                className={`rounded-full px-2.5 py-0.5 text-xs ${
                  params.category === cat.slug
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {skills.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-gray-500">No skills found matching your filters.</p>
          <Link
            href="/skills"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <SkillCard key={skill.slug} skill={skill} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/skills?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
              className="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-100"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/skills?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
              className="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-100"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
