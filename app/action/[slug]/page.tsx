import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ActionPage({ params }: Props) {
  const { slug } = await params;

  const action = await prisma.ecoAction.findUnique({
    where: { slug },
  });

  if (!action || action.status !== "APPROVED") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-100">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="relative h-72 w-full">
            <img
              src={action.photoUrl}
              alt={action.fullName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl font-bold text-white mb-1">
                {action.fullName}
              </h1>
              <p className="text-emerald-100 text-lg">
                Age: {action.age}
              </p>
            </div>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <span className="text-emerald-800 font-semibold">
                Action écologique validée
              </span>
            </div>

            <p className="text-emerald-700 leading-relaxed text-lg mb-6">
              Merci pour votre engagement en faveur de l'environnement ! Cette action a été validée par notre équipe.
            </p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-500 uppercase font-semibold tracking-wide">
                  Récompense
                </p>
                <p className="text-emerald-800 font-bold text-lg">
                  {action.rewardAmount ?? 50} 3WM Tokens
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-500 uppercase font-semibold tracking-wide">
                  Wallet
                </p>
                <p className="text-emerald-700 text-sm font-mono">
                  {action.walletAddress?.slice(0, 6)}...{action.walletAddress?.slice(-4)}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-emerald-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src="/logo 3wm jjj-01.png"
                    alt="3WM Group"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <span className="text-sm text-emerald-600 font-medium">
                    3WM Group
                  </span>
                </div>
                <a
                  href="/"
                  className="text-emerald-600 hover:text-emerald-800 font-medium text-sm transition-colors"
                >
                  Participer aussi →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
