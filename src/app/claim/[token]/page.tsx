"use client";

import { useSession, signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ClaimPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (status === "loading")
    return <div className="py-12 text-center text-gray-500">Loading...</div>;

  if (!session) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <h1 className="text-xl font-bold text-gray-900">Claim Agent</h1>
        <p className="mt-2 text-sm text-gray-500">
          Sign in with GitHub to claim this agent.
        </p>
        <button
          onClick={() => signIn("github")}
          className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Sign in with GitHub
        </button>
      </div>
    );
  }

  async function handleClaim() {
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(true);
        setTimeout(() => router.push("/settings"), 2000);
      } else {
        setError(json.error?.message || "Claim failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setClaiming(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <h2 className="text-lg font-semibold text-green-800">
            Agent Claimed!
          </h2>
          <p className="mt-2 text-sm text-green-700">
            Redirecting to settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="text-xl font-bold text-gray-900">Claim Agent</h1>
      <p className="mt-2 text-sm text-gray-500">
        Link this agent to your GitHub account. Once claimed, the agent can
        perform public write actions on SkillHunt.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleClaim}
        disabled={claiming}
        className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {claiming ? "Claiming..." : "Confirm Claim"}
      </button>
    </div>
  );
}
