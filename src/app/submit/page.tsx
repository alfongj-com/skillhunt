"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Step = "source" | "validate" | "metadata" | "success";

export default function SubmitPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>("source");
  const [mode, setMode] = useState<"paste" | "upload" | "github">("paste");
  const [skillMd, setSkillMd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  // Metadata fields
  const [displayName, setDisplayName] = useState("");
  const [summary, setSummary] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [changelog, setChangelog] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [homepageUrl, setHomepageUrl] = useState("");

  if (status === "loading")
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  if (!session) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">
          You must be signed in to submit a skill.
        </p>
      </div>
    );
  }

  async function handleValidate() {
    setError(null);
    if (!skillMd.trim()) {
      setError("SKILL.md content is required");
      return;
    }

    try {
      const res = await fetch("/api/skills/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillMd }),
      });
      const json = await res.json();
      if (json.success) {
        setDisplayName(json.data.name || "");
        setSummary(json.data.description || "");
        setStep("metadata");
      } else {
        setError(json.error?.message || "Validation failed");
      }
    } catch {
      setError("Network error");
    }
  }

  async function handlePublish() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillMd,
          displayName,
          summary,
          categorySlug,
          version,
          changelog,
          repoUrl: repoUrl || undefined,
          homepageUrl: homepageUrl || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPublishedSlug(json.data.slug);
        setStep("success");
      } else {
        setError(json.error?.message || "Publish failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Submit a Skill</h1>

      {/* Step indicator */}
      <div className="mt-4 flex items-center gap-2 text-sm">
        {["source", "validate", "metadata", "success"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <span className="text-gray-300">&rarr;</span>}
            <span
              className={`rounded-full px-3 py-1 ${
                step === s
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step: Source */}
      {step === "source" && (
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            {(["paste", "upload", "github"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  mode === m
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {m === "paste"
                  ? "Paste SKILL.md"
                  : m === "upload"
                    ? "Upload Bundle"
                    : "Import from GitHub"}
              </button>
            ))}
          </div>

          {mode === "paste" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SKILL.md Content *
              </label>
              <textarea
                value={skillMd}
                onChange={(e) => setSkillMd(e.target.value)}
                rows={12}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-gray-500 focus:outline-none"
                placeholder={`---\nname: my-skill\ndescription: A useful agent skill\n---\n\n# My Skill\n\nInstructions for the agent...`}
              />
            </div>
          )}

          {mode === "upload" && (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <p className="text-sm text-gray-500">
                Upload a .zip file containing your SKILL.md bundle.
              </p>
              <input
                type="file"
                accept=".zip"
                className="mt-3"
                onChange={() => setError("File upload coming soon. Use paste mode for now.")}
              />
            </div>
          )}

          {mode === "github" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                GitHub URL
              </label>
              <input
                type="url"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                placeholder="https://github.com/user/repo"
                onChange={() =>
                  setError("GitHub import coming soon. Use paste mode for now.")
                }
              />
            </div>
          )}

          <button
            onClick={() => {
              setError(null);
              setStep("validate");
              handleValidate();
            }}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Validate &rarr;
          </button>
        </div>
      )}

      {/* Step: Metadata */}
      {step === "metadata" && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Display Name *
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Summary *
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Version
              </label>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Changelog
              </label>
              <input
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Repo URL
              </label>
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Homepage URL
              </label>
              <input
                value={homepageUrl}
                onChange={(e) => setHomepageUrl(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("source")}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              &larr; Back
            </button>
            <button
              onClick={handlePublish}
              disabled={submitting || !displayName || !summary || !categorySlug}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {submitting ? "Publishing..." : "Publish Skill"}
            </button>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === "success" && publishedSlug && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-green-800">
            Skill Published!
          </h2>
          <p className="mt-2 text-sm text-green-700">
            Your skill is now live and searchable.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <a
              href={`/skills/${publishedSlug}`}
              className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
            >
              View Skill
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/skills/${publishedSlug}`
                );
              }}
              className="rounded-md border border-green-300 px-4 py-2 text-sm text-green-700 hover:bg-green-100"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
