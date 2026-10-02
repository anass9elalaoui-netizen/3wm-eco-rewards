"use client";

import { usePrivy } from "@privy-io/react-auth";

export default function LoginButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  if (!ready) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-emerald-100">
        <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
        <span className="text-xs text-emerald-600 font-medium">
          Chargement...
        </span>
      </div>
    );
  }

  if (authenticated) {
    // Determine display name from linked accounts
    const displayName =
      user?.phone?.number ||
      user?.email?.address ||
      user?.wallet?.address?.slice(0, 8) + "..." ||
      "Utilisateur";

    return (
      <div className="flex items-center gap-2">
        {/* User pill */}
        <a
          href="/profil"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <span className="text-xs font-medium text-emerald-800 group-hover:text-emerald-900 max-w-[120px] truncate">
            {displayName}
          </span>
        </a>

        {/* Logout button */}
        <button
          onClick={logout}
          className="p-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all group"
          title="Se déconnecter"
        >
          <svg
            className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all active:scale-[0.98]"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      Se connecter
    </button>
  );
}
