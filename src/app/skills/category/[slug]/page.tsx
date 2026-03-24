import { notFound } from "next/navigation";
import Link from "next/link";
import { SkillCard } from "@/components/ui/skill-card";
import { getSkillsByCategory } from "@/lib/queries/skills";
import { getAllCategories } from "@/lib/queries/categories";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const categories = await getAllCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) notFound();

  const [trending, topReviewed, newest] = await Promise.all([
    getSkillsByCategory(slug, "trending", 6),
    getSkillsByCategory(slug, "top-reviewed", 6),
    getSkillsByCategory(slug, "newest", 6),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
        {category.description && (
          <p className="mt-1 text-gray-500">{category.description}</p>
        )}
        <Link
          href={`/skills?category=${slug}`}
          className="mt-2 inline-block text-sm text-blue-600 hover:underline"
        >
          View all skills in this category &rarr;
        </Link>
      </div>

      {trending.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Trending</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((skill) => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        </section>
      )}

      {topReviewed.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Top Reviewed</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topReviewed.map((skill) => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        </section>
      )}

      {newest.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Newest</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {newest.map((skill) => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        </section>
      )}

      {trending.length === 0 && topReviewed.length === 0 && newest.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-gray-500">No skills in this category yet.</p>
          <Link href="/submit" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
            Be the first to submit one &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
