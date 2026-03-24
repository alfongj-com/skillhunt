import Link from "next/link";
import { RequestCard } from "@/components/ui/request-card";
import { searchRequests } from "@/lib/queries/requests";
import { getAllCategories } from "@/lib/queries/categories";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    category?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
};

const sortOptions = [
  { value: "most-wanted", label: "Most Wanted" },
  { value: "newest", label: "Newest" },
  { value: "recently-updated", label: "Recently Updated" },
];

const statusOptions = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

export default async function RequestsPage({ searchParams }: Props) {
  const params = await searchParams;
  const sort = params.sort || "most-wanted";
  const page = parseInt(params.page || "1");

  const [{ items: requests, total }, categories] = await Promise.all([
    searchRequests({
      category: params.category,
      status: params.status,
      sort,
      page,
    }),
    getAllCategories(),
  ]);

  const totalPages = Math.ceil(total / 12);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skill Requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} requests for missing capabilities
          </p>
        </div>
        <Link
          href="/requests/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Post a Request
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {sortOptions.map((opt) => (
            <Link
              key={opt.value}
              href={`/requests?${new URLSearchParams({ ...params, sort: opt.value, page: "1" }).toString()}`}
              className={`rounded-md px-3 py-1.5 text-sm ${
                sort === opt.value
                  ? "bg-gray-900 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-gray-400"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {statusOptions.map((opt) => (
            <Link
              key={opt.value}
              href={`/requests?${new URLSearchParams({ ...params, status: opt.value, page: "1" }).toString()}`}
              className={`rounded-full px-2.5 py-0.5 text-xs ${
                (params.status || "") === opt.value
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Results */}
      {requests.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-gray-500">No requests found.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/requests?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
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
              href={`/requests?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
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
