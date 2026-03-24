"use client";

import { useState } from "react";
import type { SkillDetail } from "@/lib/queries/skills";
import { formatDate, formatRating } from "@/lib/utils/format";

type Tab = "overview" | "files" | "versions" | "reviews";

export function SkillDetailTabs({ skill }: { skill: SkillDetail }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "files", label: "Files", count: skill.files.length },
    { id: "versions", label: "Versions", count: skill.versions.length },
    { id: "reviews", label: "Reviews", count: skill.reviewCount },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === "overview" && <OverviewTab skill={skill} />}
        {activeTab === "files" && <FilesTab skill={skill} />}
        {activeTab === "versions" && <VersionsTab skill={skill} />}
        {activeTab === "reviews" && <ReviewsTab skill={skill} />}
      </div>
    </div>
  );
}

function OverviewTab({ skill }: { skill: SkillDetail }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="prose prose-sm max-w-none">
        {skill.parsedDescription ? (
          <p>{skill.parsedDescription}</p>
        ) : (
          <p>{skill.summary}</p>
        )}

        {skill.hasScripts && (
          <div className="mt-4 rounded bg-yellow-50 p-3 text-sm text-yellow-800">
            This skill includes scripts or executable references.
          </div>
        )}
        {skill.isInstructionOnly && (
          <div className="mt-4 rounded bg-blue-50 p-3 text-sm text-blue-800">
            This is an instruction-only skill (no scripts).
          </div>
        )}

        {skill.changelog && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900">
              Latest Changelog
            </h3>
            <p className="mt-1 text-sm text-gray-600">{skill.changelog}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilesTab({ skill }: { skill: SkillDetail }) {
  const [selectedFile, setSelectedFile] = useState(0);

  if (skill.files.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        No files available.
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* File tree */}
      <div className="w-48 shrink-0">
        <div className="rounded-lg border border-gray-200 bg-white">
          {skill.files.map((file, idx) => (
            <button
              key={file.path}
              onClick={() => setSelectedFile(idx)}
              className={`block w-full px-3 py-1.5 text-left text-xs ${
                idx === selectedFile
                  ? "bg-gray-100 font-medium text-gray-900"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {file.path}
            </button>
          ))}
        </div>
      </div>

      {/* File content */}
      <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-2 text-xs text-gray-500">
          {skill.files[selectedFile].path} &mdash;{" "}
          {skill.files[selectedFile].sizeBytes} bytes
        </div>
        <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-gray-800">
          <code>{skill.files[selectedFile].content}</code>
        </pre>
      </div>
    </div>
  );
}

function VersionsTab({ skill }: { skill: SkillDetail }) {
  return (
    <div className="space-y-2">
      {skill.versions.map((v) => (
        <div
          key={v.versionLabel}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              v{v.versionLabel}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(v.createdAt)}
            </span>
          </div>
          {v.changelog && (
            <p className="mt-1 text-sm text-gray-600">{v.changelog}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function ReviewsTab({ skill }: { skill: SkillDetail }) {
  if (skill.reviews.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        No reviews yet. Be the first to review this skill.
      </div>
    );
  }

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: skill.reviews.filter((rev) => rev.rating === r).length,
  }));

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {formatRating(skill.averageRating)}
          </div>
          <div className="text-xs text-gray-500">
            {skill.reviewCount} reviews
          </div>
        </div>
        <div className="flex-1 space-y-1">
          {distribution.map((d) => (
            <div key={d.rating} className="flex items-center gap-2 text-xs">
              <span className="w-3">{d.rating}</span>
              <div className="h-2 flex-1 rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-yellow-400"
                  style={{
                    width: `${skill.reviewCount > 0 ? (d.count / skill.reviewCount) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="w-4 text-right text-gray-500">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review cards */}
      {skill.reviews.map((review) => (
        <div
          key={review.id}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {review.actorAvatarUrl && (
                <img
                  src={review.actorAvatarUrl}
                  alt={review.actorHandle}
                  className="h-6 w-6 rounded-full"
                />
              )}
              <span className="text-sm font-medium text-gray-900">
                @{review.actorHandle}
              </span>
              <span className="text-xs text-gray-500">
                {review.actorType === "agent" ? "Agent" : "Human"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-yellow-500">
                {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
              </span>
              <span>{formatDate(review.createdAt)}</span>
            </div>
          </div>
          {review.headline && (
            <h4 className="mt-2 text-sm font-medium text-gray-900">
              {review.headline}
            </h4>
          )}
          <p className="mt-1 text-sm text-gray-600">{review.body}</p>
          {review.versionLabelUsed && (
            <span className="mt-2 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
              Used v{review.versionLabelUsed}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
