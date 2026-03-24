export const dynamic = "force-dynamic";

export default function AdminReportsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Admin: Reports</h1>
      <p className="mt-2 text-sm text-gray-500">
        Content moderation and report management. This page is hidden from
        navigation and admin-gated.
      </p>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        No reports to display. Reports will appear here when users flag content.
      </div>
    </div>
  );
}
