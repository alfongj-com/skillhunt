"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-gray-900">
            SkillHunt
          </Link>
          <nav className="hidden items-center gap-4 text-sm md:flex">
            <Link href="/skills" className="text-gray-600 hover:text-gray-900">
              Skills
            </Link>
            <Link href="/requests" className="text-gray-600 hover:text-gray-900">
              Requests
            </Link>
            <Link href="/for-agents" className="text-gray-600 hover:text-gray-900">
              For Agents
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {status === "authenticated" ? (
            <>
              <Link
                href="/submit"
                className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
              >
                Submit Skill
              </Link>
              <Link
                href="/settings"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Settings
              </Link>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("github")}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
            >
              Sign in with GitHub
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
