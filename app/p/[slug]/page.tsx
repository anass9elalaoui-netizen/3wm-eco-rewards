export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import QRCodeDisplay from "./QRCodeDisplay";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AmbassadorCardPage({ params }: Props) {
  const { slug } = await params;

  const ambassador = await prisma.ambassador.findUnique({
    where: { slug },
  });

  // ── 404 / Not approved ──
  if (!ambassador || ambassador.status !== "APPROVED") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="fixed top-0 left-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl p-10 text-center max-w-sm relative z-10">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
            <svg
              className="w-8 h-8 text-amber-500/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            Carte non disponible
          </h1>
          <p className="text-gray-400 text-sm">
            Cette carte de partenaire n&apos;existe pas ou n&apos;a pas encore
            été approuvée.
          </p>
        </div>
      </div>
    );
  }

  // ── Build absolute URL for QR Code ──
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "https";
  const absoluteUrl = `${protocol}://${host}/p/${slug}`;

  // ── Generate a fake "private key" style hash for the textured zone ──
  const fakeKeyHash = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
  const formattedKey = `3WM${fakeKeyHash.toUpperCase().slice(0, 60)}`;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
      {/* ── Ambient glow effects ── */}
      <div className="fixed top-0 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* ══════════════════════════════════════════════════════════
            PAPER WALLET — CARTE VIP 3WM
        ══════════════════════════════════════════════════════════ */}
        <div
          className="rounded-2xl overflow-hidden shadow-2xl border border-gray-800"
          style={{
            background:
              "linear-gradient(160deg, #0f0f0f 0%, #1a1a2e 40%, #16213e 70%, #0f0f0f 100%)",
          }}
        >
          {/* ── Top Header Bar ── */}
          <div className="relative px-6 pt-6 pb-4">
            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/logo white-01.png"
                  alt="3WM Group"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <div>
                  <p className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.25em]">
                    3WM Group
                  </p>
                  <p className="text-gray-500 text-[9px] uppercase tracking-widest">
                    Paper Wallet
                  </p>
                </div>
              </div>
              {/* Verified hologram */}
              <div className="w-8 h-8 rounded-full border border-cyan-500/30 flex items-center justify-center bg-cyan-500/5">
                <svg
                  className="w-4 h-4 text-cyan-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* ── Gold divider ── */}
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

          {/* ── Identity Section ── */}
          <div className="px-6 py-6 flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500 to-cyan-500 rounded-full opacity-40 blur-sm" />
              <img
                src={ambassador.photoUrl}
                alt={ambassador.fullName}
                width={72}
                height={72}
                className="w-[72px] h-[72px] rounded-full object-cover border-2 border-gray-700 relative z-10"
              />
            </div>
            {/* Name & Role */}
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white truncate">
                {ambassador.fullName}
              </h1>
              <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
                {ambassador.role}
              </p>
              <p className="text-cyan-400/60 text-[10px] font-medium uppercase tracking-widest mt-0.5">
                Partenaire Officiel
              </p>
            </div>
          </div>

          {/* ── Subtle divider ── */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mx-6" />

          {/* ── Zero Waste Badge ── */}
          <div className="px-6 py-4 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em]">
              Zero Waste Concept — Or Vert &amp; Bleu
            </p>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>

          {/* ── QR Code Section ── */}
          <div className="px-6 py-4 flex flex-col items-center">
            <QRCodeDisplay url={absoluteUrl} />
            <p className="text-gray-500 text-[10px] mt-2 uppercase tracking-wider">
              Scannez pour vérifier l&apos;authenticité
            </p>
          </div>

          {/* ── Cyan divider ── */}
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mx-6" />

          {/* ── Simulated Private Key Zone (textured gray) ── */}
          <div className="mx-6 my-4 rounded-lg overflow-hidden">
            <div
              className="p-3"
              style={{
                background:
                  "repeating-linear-gradient(45deg, #1f2937, #1f2937 2px, #1a2332 2px, #1a2332 4px)",
              }}
            >
              <p className="text-gray-600 text-[8px] uppercase tracking-widest mb-1 font-bold">
                Clé d&apos;authentification Partenaire
              </p>
              <p
                className="text-gray-500 text-[9px] font-mono break-all leading-relaxed select-none"
                style={{
                  textShadow: "0 0 4px rgba(6,182,212,0.15)",
                }}
              >
                {formattedKey}
              </p>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-gray-800/50">
            <div className="flex items-center justify-between">
              <p className="text-gray-600 text-[9px] uppercase tracking-wider">
                3wm.group • {new Date().getFullYear()}
              </p>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <p className="text-gray-600 text-[9px] uppercase tracking-wider">
                  Vérifié
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
