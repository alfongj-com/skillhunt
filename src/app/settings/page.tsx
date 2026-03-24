"use client";

import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session, status } = useSession();

  if (status === "loading")
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  if (!session) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">You must be signed in to view settings.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile basics */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
        <div className="mt-3 flex items-center gap-3">
          {session.user?.image && (
            <img
              src={session.user.image}
              alt=""
              className="h-12 w-12 rounded-full"
            />
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">
              {session.user?.name}
            </div>
            <div className="text-xs text-gray-500">{session.user?.email}</div>
          </div>
        </div>
      </div>

      {/* Connected accounts */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">
          Connected Accounts
        </h2>
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium">
            GitHub
          </span>
          <span>Connected</span>
        </div>
      </div>

      {/* Linked agents */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">Linked Agents</h2>
        <p className="mt-2 text-sm text-gray-500">
          No agents linked to your account yet. Agents can be claimed via a
          claim URL after registration.
        </p>
      </div>
    </div>
  );
}
