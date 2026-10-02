"use client";

import { useState, useRef, FormEvent } from "react";
import LoginButton from "./components/LoginButton";

type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/claim", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message);
        form.reset();
        setPreviewUrl(null);
      } else {
        setStatus("error");
        setMessage(data.error || "Une erreur est survenue.");
      }
    } catch {
      setStatus("error");
      setMessage("Impossible de se connecter au serveur.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex flex-col items-center px-4 py-8">
      {/* ── Decorative blobs ── */}
      <div className="fixed top-0 left-0 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* ── Login Button ── */}
        <div className="flex justify-end mb-4 animate-fade-in-up">
          <LoginButton />
        </div>

        <div className="flex justify-center mb-6 animate-fade-in-up">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/20 rounded-2xl blur-xl" />
            <img
              src="/logo 3wm jjj-01.png"
              alt="3WM Group"
              width={110}
              height={110}
              className="rounded-2xl relative z-10"
            />
          </div>
        </div>

        {/* ── Header ── */}
        <div className="text-center mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <h1 className="text-2xl font-bold text-emerald-900 mb-2">
            Programme Éco-Récompense
          </h1>
          <p className="text-emerald-700 text-sm mb-4">
            Participez à une action écologique et recevez des tokens 3WM en récompense.
          </p>
          <a
            href="/profil"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-800 font-medium bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full transition-all hover:shadow-md border border-emerald-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Mon Profil / Portefeuille
          </a>
        </div>

        {status === "success" ? (
          <div className="glass-card rounded-2xl shadow-lg p-8 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <svg
                className="w-8 h-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-emerald-900 mb-2">
              Merci !
            </h2>
            <p className="text-emerald-700 mb-2">{message}</p>
            <p className="text-sm text-emerald-500 mb-6">
              Votre action a été enregistrée. Notre équipe va l&apos;examiner.
              Rendez-vous sur votre profil pour suivre l&apos;état de votre récompense.
            </p>
            <a
              href="/profil"
              className="block w-full bg-emerald-100 text-emerald-800 font-semibold py-3 px-6 rounded-xl hover:bg-emerald-200 transition-all hover:shadow-md mb-3 text-center"
            >
              Voir mon profil / portefeuille →
            </a>
            <button
              onClick={() => setStatus("idle")}
              className="w-full bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-emerald-700 transition-all hover:shadow-lg"
            >
              Soumettre une autre action
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="glass-card rounded-2xl shadow-lg p-6 space-y-5 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-emerald-900 mb-1"
              >
                Nom complet
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Jean Dupont"
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-emerald-900 placeholder-emerald-300 bg-white/50"
              />
            </div>

            <div>
              <label
                htmlFor="age"
                className="block text-sm font-medium text-emerald-900 mb-1"
              >
                Âge
              </label>
              <input
                id="age"
                name="age"
                type="text"
                required
                placeholder="25"
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-emerald-900 placeholder-emerald-300 bg-white/50"
              />
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-emerald-900 mb-1"
              >
                Numéro de téléphone
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                placeholder="+261 34 00 000 00"
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-emerald-900 placeholder-emerald-300 bg-white/50"
              />
            </div>

            <div>
              <label
                htmlFor="userWallet"
                className="block text-sm font-medium text-emerald-900 mb-1"
              >
                Votre wallet BSC (optionnel)
              </label>
              <input
                id="userWallet"
                name="userWallet"
                type="text"
                placeholder="0x... (laissez vide pour un wallet automatique)"
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-emerald-900 placeholder-emerald-300 bg-white/50"
              />
              <p className="text-xs text-emerald-500 mt-1">
                Si vous avez déjà un wallet BNB Smart Chain, entrez-le ici.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">
                Photo de l&apos;action
              </label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  required
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 transition-all flex items-center justify-center gap-2 text-emerald-600 bg-white/30 hover:bg-white/60"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {previewUrl ? "Changer la photo" : "Prendre une photo"}
                </button>
              </div>
              {previewUrl && (
                <div className="mt-3 rounded-xl overflow-hidden border border-emerald-200 shadow-sm">
                  <img
                    src={previewUrl}
                    alt="Aperçu"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
            </div>

            {status === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 animate-fade-in-up">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                "Soumettre mon action écologique"
              )}
            </button>

            <p className="text-xs text-center text-emerald-500 mt-4">
              Vos informations sont sécurisées. Aucun mot de passe requis.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
