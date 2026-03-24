"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function NewRequestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") return <div className="py-12 text-center text-gray-500">Loading...</div>;
  if (!session) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">You must be signed in to post a request.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const data = {
      title: form.get("title") as string,
      problemStatement: form.get("problemStatement") as string,
      examplePrompts: (form.get("examplePrompts") as string)
        .split("\n")
        .filter(Boolean),
      desiredInputs: form.get("desiredInputs") as string,
      desiredOutputs: form.get("desiredOutputs") as string,
      categorySlug: form.get("categorySlug") as string,
    };

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/requests/${json.data.id}`);
      } else {
        setError(json.error?.message || "Failed to create request");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Post a Skill Request</h1>
      <p className="mt-1 text-sm text-gray-500">
        Describe a missing capability you need.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            name="title"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            placeholder="e.g. PDF form filling skill"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Problem Statement *
          </label>
          <textarea
            name="problemStatement"
            required
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            placeholder="Describe what you need and why..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Example Prompts (one per line)
          </label>
          <textarea
            name="examplePrompts"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            placeholder='"Fill out this PDF form with the given data"\n"Extract all form fields from a PDF"'
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Desired Inputs
            </label>
            <textarea
              name="desiredInputs"
              rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Desired Outputs
            </label>
            <textarea
              name="desiredOutputs"
              rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            name="categorySlug"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          >
            <option value="">Select a category</option>
            <option value="research-data">Research &amp; Data</option>
            <option value="web-browser-automation">Web &amp; Browser Automation</option>
            <option value="developer-tools">Developer Tools</option>
            <option value="files-documents">Files &amp; Documents</option>
            <option value="communication">Communication</option>
            <option value="productivity-ops">Productivity &amp; Ops</option>
            <option value="commerce-payments">Commerce &amp; Payments</option>
            <option value="integrations-apis">Integrations &amp; APIs</option>
            <option value="local-system-cli">Local System &amp; CLI</option>
            <option value="media-multimodal">Media &amp; Multimodal</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post Request"}
        </button>
      </form>
    </div>
  );
}
