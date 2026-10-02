"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import LoginButton from "../components/LoginButton";

interface UserStatus {
  fullName: string;
  age: string;
  photoUrl: string;
  status: string;
  walletAddress: string | null;
  rewardAmount: number | null;
  slug: string | null;
}

type ViewState = "form" | "loading" | "approved" | "pending" | "error";

const BSCSCAN_BASE = "https://bscscan.com/address/";

export default function ProfilPage() {
  const { ready, authenticated, user, login, logout, createWallet } = usePrivy();
  const [copied, setCopied] = useState(false);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Determine display name/auth method from linked accounts
  const authMethod =
    user?.phone?.number ||
    user?.email?.address ||
    "Méthode de connexion inconnue";

  const walletAddress = user?.wallet?.address;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex flex-col items-center px-4 py-12 relative overflow-hidden">
      {/* ── Decorative blobs ── */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* ── Logo ── */}
        <div className="flex justify-center mb-8 animate-fade-in-up">
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-400/40 rounded-2xl blur-xl group-hover:bg-emerald-400/60 transition-all duration-500" />
            <img
              src="/logo 3wm jjj-01.png"
              alt="3WM Group"
              width={120}
              height={120}
              className="rounded-2xl relative z-10 shadow-lg"
            />
          </div>
        </div>

        {!ready ? (
          <div className="glass-card rounded-3xl shadow-xl p-10 w-full text-center flex flex-col items-center justify-center animate-pulse">
            <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
            <p className="text-emerald-800 font-medium">Chargement...</p>
          </div>
        ) : !authenticated ? (
          <div className="glass-card rounded-3xl shadow-xl p-10 w-full text-center space-y-6 animate-fade-in-up">
            <div>
              <h1 className="text-2xl font-bold text-emerald-900 mb-2">
                Bienvenue sur 3WM
              </h1>
              <p className="text-emerald-700 text-sm">
                Connectez-vous pour accéder à votre profil et votre portefeuille Web3.
              </p>
            </div>
            
            <button
              onClick={login}
              className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-[1px] transition-all hover:shadow-[0_0_2rem_-0.5rem_#059669]"
            >
              <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 rounded-xl text-white font-bold transition-all group-hover:bg-opacity-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Connectez-vous à votre compte
              </div>
            </button>
          </div>
        ) : (
          <div 
            className="w-full relative rounded-3xl p-[1px] overflow-hidden animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            {/* Animated glowing border effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-emerald-500 to-teal-600 opacity-70 animate-pulse-glow" />
            
            {/* Dark Glassmorphism Card */}
            <div className="relative bg-[#0f172a]/90 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl overflow-hidden">
              {/* Inner card light sweep effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-100%] animate-[shimmer_3s_infinite]" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>

                <h1 className="text-2xl font-bold text-white mb-1 tracking-wide">
                  Your 3WM Web3 Wallet
                </h1>
                
                <div className="flex items-center gap-2 mb-8 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-emerald-200 text-xs font-medium">
                    {authMethod}
                  </p>
                </div>

                <div className="w-full space-y-2 mb-8 text-left">
                  <label className="text-xs font-semibold text-cyan-300 uppercase tracking-widest pl-1">
                    Wallet Address
                  </label>
                  
                  {walletAddress ? (
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                      <div className="relative flex items-center justify-between bg-[#1e293b] border border-white/10 rounded-xl p-4">
                        <code className="font-mono text-emerald-100 text-sm sm:text-base break-all">
                          {walletAddress}
                        </code>
                        <button
                          onClick={() => copyToClipboard(walletAddress)}
                          className="ml-3 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors shrink-0 group/btn border border-white/5 hover:border-emerald-500/50"
                          title="Copy to clipboard"
                        >
                          {copied ? (
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-cyan-400 group-hover/btn:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#1e293b]/80 border border-amber-500/30 rounded-xl p-4 text-center">
                      <p className="text-amber-200/80 text-sm">
                        Aucun wallet n'est généré pour ce compte.
                      </p>
                      <button 
                        onClick={() => createWallet()} 
                        className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
                      >
                        Générer mon portefeuille Web3
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={logout}
                  className="w-full bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-300 font-medium py-3.5 px-6 rounded-xl transition-all border border-white/10 hover:border-red-500/30 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
