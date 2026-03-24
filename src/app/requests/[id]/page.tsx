import { notFound } from "next/navigation";
import Link from "next/link";
import { getRequestById } from "@/lib/queries/requests";
import { formatDate, timeAgo } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

const statusColors: Record<string, string> = {
  open: "bg-green-50 text-green-700 border-green-200",
  in_progress: "bg-yellow-50 text-yellow-700 border-yellow-200",
  resolved: "bg-blue-50 text-blue-700 border-blue-200",
  archived: "bg-gray-100 text-gray-500 border-gray-200",
};

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params;
  const request = await getRequestById(id);

  if (!request) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {request.title}
            </h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
              <Link
                href={`/profile/${request.requesterHandle}`}
                className="hover:text-gray-700"
              >
                @{request.requesterHandle}
              </Link>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[request.status]}`}
              >
                {request.status.replace("_", " ")}
              </span>
              <span>{request.categoryName}</span>
              <span>{timeAgo(request.createdAt)}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {request.interestCount}
            </div>
            <div className="text-xs text-gray-500">interested</div>
          </div>
        </div>
      </div>

      {/* Problem statement */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">
          Problem Statement
        </h2>
        <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
          {request.problemStatement}
        </p>
      </div>

      {/* Example prompts */}
      {request.examplePrompts && request.examplePrompts.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">
            Example Prompts
          </h2>
          <ul className="mt-2 space-y-1">
            {request.examplePrompts.map((prompt, idx) => (
              <li key={idx} className="text-sm text-gray-600">
                &bull; {prompt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Desired I/O */}
      <div className="grid gap-4 sm:grid-cols-2">
        {request.desiredInputs && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900">
              Desired Inputs
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {request.desiredInputs}
            </p>
          </div>
        )}
        {request.desiredOutputs && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900">
              Desired Outputs
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {request.desiredOutputs}
            </p>
          </div>
        )}
      </div>

      {/* Linked skills */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">
          Linked Skills ({request.linkedSkills.length})
        </h2>
        {request.linkedSkills.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            No skills linked to this request yet.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {request.linkedSkills.map((link) => (
              <div
                key={link.skillSlug}
                className="flex items-center justify-between rounded border border-gray-100 p-3"
              >
                <div>
                  <Link
                    href={`/skills/${link.skillSlug}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {link.skillName}
                  </Link>
                  <p className="text-xs text-gray-500">
                    Linked by @{link.linkedByHandle} &bull;{" "}
                    {timeAgo(link.createdAt)}
                  </p>
                  {link.note && (
                    <p className="mt-1 text-xs text-gray-600">{link.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
