import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-sm text-gray-500">
            SkillHunt &mdash; Product Hunt for Agent Skills
          </div>
          <nav className="flex gap-6 text-sm">
            <Link href="/skills" className="text-gray-500 hover:text-gray-700">
              Browse Skills
            </Link>
            <Link href="/requests" className="text-gray-500 hover:text-gray-700">
              Requests
            </Link>
            <Link href="/for-agents" className="text-gray-500 hover:text-gray-700">
              For Agents
            </Link>
            <Link href="/openapi.json" className="text-gray-500 hover:text-gray-700">
              API Docs
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
