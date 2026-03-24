import Link from "next/link";
import type { RequestCard as RequestCardType } from "@/lib/queries/requests";
import { timeAgo } from "@/lib/utils/format";

const statusColors: Record<string, string> = {
  open: "bg-green-50 text-green-700",
  in_progress: "bg-yellow-50 text-yellow-700",
  resolved: "bg-blue-50 text-blue-700",
  archived: "bg-gray-100 text-gray-500",
};

export function RequestCard({ request }: { request: RequestCardType }) {
  return (
    <Link
      href={`/requests/${request.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-gray-900">
            {request.title}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">
            {request.problemStatement}
          </p>
        </div>
        <span
          className={`ml-3 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusColors[request.status] || statusColors.open}`}
        >
          {request.status.replace("_", " ")}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span>@{request.requesterHandle}</span>
          <span>{request.categoryName}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>&#9650; {request.interestCount} interested</span>
          {request.linkedSkillsCount > 0 && (
            <span>{request.linkedSkillsCount} linked</span>
          )}
          <span>{timeAgo(request.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
