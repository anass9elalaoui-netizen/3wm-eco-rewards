"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import {
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_DECIMALS,
  ERC20_ABI,
  BSC_RPC,
  BSC_CHAIN_ID,
} from "@/lib/constants";

// ══════════════════════════════════════════════════
//  Types
// ══════════════════════════════════════════════════

interface EcoAction {
  id: string;
  fullName: string;
  age: string;
  phoneNumber: string;
  photoUrl: string;
  walletAddress: string | null;
  rewardAmount: number | null;
  status: string;
  createdAt: string;
}

interface Ambassador {
  id: string;
  fullName: string;
  role: string;
  phoneNumber: string;
  photoUrl: string;
  slug: string;
  status: string;
  createdAt: string;
}

interface TreasuryInfo {
  walletAddress: string;
  tokenBalance: string;
  bnbBalance: string;
}

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
type AuthMethod = "walletconnect" | "mnemonic" | "keystore";

const BSCSCAN_BASE = "https://bscscan.com/address/";

// ══════════════════════════════════════════════════
//  Component
// ══════════════════════════════════════════════════

export default function AdminDashboard() {
  // ── Hydration guard (Trust Wallet inpage.js fix) ──
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // ── Auth Method State ──
  const [authMethod, setAuthMethod] = useState<AuthMethod>("walletconnect");

  // ── WalletConnect State (Privy) ──
  const { wallets } = useWallets();
  const connectedWallet = isHydrated && wallets.length > 0 ? wallets[0] : null;

  // ── Mnemonic State ──
  const [mnemonicPhrase, setMnemonicPhrase] = useState("");

  // ── Keystore State ──
  const [keystoreJson, setKeystoreJson] = useState("");
  const [keystoreFileName, setKeystoreFileName] = useState("");
  const [keystorePassword, setKeystorePassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Treasury State ──
  const [treasury, setTreasury] = useState<TreasuryInfo | null>(null);
  const [treasuryLoading, setTreasuryLoading] = useState(false);
  const [treasuryError, setTreasuryError] = useState("");

  // ── Submissions State ──
  const [actions, setActions] = useState<EcoAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("PENDING");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // ── Per-card reward amounts ──
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [defaultRewardAmount, setDefaultRewardAmount] = useState(50);

  // ── Ambassador State ──
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [ambassadorLoading, setAmbassadorLoading] = useState(true);
  const [approvingAmbassadorId, setApprovingAmbassadorId] = useState<string | null>(null);

  // ══════════════════════════════════════════════════
  //  Helpers
  // ══════════════════════════════════════════════════

  function showMessage(msg: string, type: "success" | "error") {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 8000);
  }

  function getAmount(id: string): number {
    return amounts[id] ?? defaultRewardAmount;
  }

  function setAmount(id: string, value: number) {
    setAmounts((prev) => ({ ...prev, [id]: value }));
  }

  // Check if the current auth method is "ready" (has the required inputs)
  function isAuthReady(): boolean {
    switch (authMethod) {
      case "walletconnect":
        return !!connectedWallet;
      case "mnemonic":
        return mnemonicPhrase.trim().split(/\s+/).length >= 12;
      case "keystore":
        return !!keystoreJson && !!keystorePassword;
      default:
        return false;
    }
  }

  // Human-readable label for the auth readiness warning
  function getAuthWarning(): string {
    switch (authMethod) {
      case "walletconnect":
        return "Connectez votre wallet via Privy pour approuver.";
      case "mnemonic":
        return "Entrez votre phrase secrète (12 ou 24 mots) pour approuver.";
      case "keystore":
        return "Importez votre fichier Keystore et entrez le mot de passe.";
      default:
        return "";
    }
  }

  // ══════════════════════════════════════════════════
  //  Treasury Balance
  // ══════════════════════════════════════════════════

  async function fetchTreasuryWalletConnect() {
    if (!connectedWallet) return;
    setTreasuryLoading(true);
    setTreasuryError("");
    try {
      // Query balance via backend API (server-side BSC RPC — no CORS issues)
      const res = await fetch("/api/admin/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: connectedWallet.address }),
      });
      const data = await res.json();
      if (res.ok) {
        setTreasury({
          walletAddress: data.walletAddress,
          tokenBalance: data.tokenBalance,
          bnbBalance: data.bnbBalance,
        });
      } else {
        setTreasuryError(data.error || "Erreur lors de la récupération du solde.");
      }
    } catch (err) {
      console.error("WalletConnect balance fetch error:", err);
      setTreasuryError(
        "Impossible de récupérer le solde. Vérifiez votre connexion internet et réessayez."
      );
    }
    setTreasuryLoading(false);
  }

  async function fetchTreasuryMnemonic() {
    if (!mnemonicPhrase || mnemonicPhrase.trim().split(/\s+/).length < 12) return;
    setTreasuryLoading(true);
    setTreasuryError("");
    try {
      // Derive address client-side (no RPC needed for this)
      const wallet = ethers.Wallet.fromPhrase(mnemonicPhrase.trim());
      // Query balance via backend API (server-side BSC RPC — no CORS issues)
      const res = await fetch("/api/admin/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: wallet.address }),
      });
      const data = await res.json();
      if (res.ok) {
        setTreasury({
          walletAddress: data.walletAddress,
          tokenBalance: data.tokenBalance,
          bnbBalance: data.bnbBalance,
        });
      } else {
        setTreasuryError(data.error || "Erreur lors de la récupération du solde.");
      }
    } catch {
      setTreasuryError("Phrase mnémonique invalide.");
    }
    setTreasuryLoading(false);
  }

  async function fetchTreasuryKeystore() {
    if (!keystoreJson || !keystorePassword) return;
    setTreasuryLoading(true);
    setTreasuryError("");
    try {
      // Decrypt client-side to get the address (no RPC needed)
      const decrypted = await ethers.Wallet.fromEncryptedJson(keystoreJson, keystorePassword);
      // Query balance via backend API (server-side BSC RPC — no CORS issues)
      const res = await fetch("/api/admin/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: decrypted.address }),
      });
      const data = await res.json();
      if (res.ok) {
        setTreasury({
          walletAddress: data.walletAddress,
          tokenBalance: data.tokenBalance,
          bnbBalance: data.bnbBalance,
        });
      } else {
        setTreasuryError(data.error || "Erreur lors de la récupération du solde.");
      }
    } catch {
      setTreasuryError("Mot de passe incorrect ou fichier Keystore invalide.");
    }
    setTreasuryLoading(false);
  }

  function handleLoadBalance() {
    switch (authMethod) {
      case "walletconnect":
        return fetchTreasuryWalletConnect();
      case "mnemonic":
        return fetchTreasuryMnemonic();
      case "keystore":
        return fetchTreasuryKeystore();
    }
  }

  // Reset treasury when switching auth methods
  useEffect(() => {
    setTreasury(null);
    setTreasuryError("");
  }, [authMethod]);

  // ══════════════════════════════════════════════════
  //  Fetch Submissions
  // ══════════════════════════════════════════════════

  const fetchActions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/submissions?status=${filter}`, { cache: 'no-store' });
      const data = await res.json();
      setActions(data.actions || []);
    } catch {
      showMessage("Erreur lors du chargement des données.", "error");
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  // ══════════════════════════════════════════════════
  //  Fetch Ambassadors
  // ══════════════════════════════════════════════════

  const fetchAmbassadors = useCallback(async () => {
    setAmbassadorLoading(true);
    try {
      const res = await fetch('/api/admin/ambassadors', { cache: 'no-store' });
      const data = await res.json();
      setAmbassadors(data.ambassadors || []);
    } catch {
      showMessage("Erreur lors du chargement des ambassadeurs.", "error");
    }
    setAmbassadorLoading(false);
  }, []);

  useEffect(() => {
    fetchAmbassadors();
  }, [fetchAmbassadors]);

  // ══════════════════════════════════════════════════
  //  Handle Keystore File Upload
  // ══════════════════════════════════════════════════

  function handleKeystoreFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setKeystoreFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setKeystoreJson(content);
    };
    reader.readAsText(file);
  }

  // ══════════════════════════════════════════════════
  //  APPROVE — Dispatch by Method
  // ══════════════════════════════════════════════════

  async function handleApprove(id: string) {
    if (!isAuthReady()) {
      showMessage(getAuthWarning(), "error");
      return;
    }

    const amount = getAmount(id);
    setProcessingId(id);

    try {
      // ── METHOD 1: WalletConnect (Frontend signing) ──
      if (authMethod === "walletconnect") {
        await handleApproveWalletConnect(id, amount);
        return;
      }

      // ── METHOD 2: Mnemonic (Backend signing) ──
      if (authMethod === "mnemonic") {
        const res = await fetch("/api/admin/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            method: "mnemonic",
            mnemonicPhrase: mnemonicPhrase.trim(),
            amount,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          showMessage(`✅ Approuvé ! ${amount} 3WM envoyés à ${data.walletAddress?.slice(0, 10)}...`, "success");
          fetchActions();
          handleLoadBalance();
        } else {
          showMessage(data.error || "Erreur lors de l'approbation.", "error");
        }
        return;
      }

      // ── METHOD 3: Keystore (Backend signing) ──
      if (authMethod === "keystore") {
        const res = await fetch("/api/admin/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            method: "keystore",
            keystoreJson,
            password: keystorePassword,
            amount,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          showMessage(`✅ Approuvé ! ${amount} 3WM envoyés à ${data.walletAddress?.slice(0, 10)}...`, "success");
          fetchActions();
          handleLoadBalance();
        } else {
          showMessage(data.error || "Erreur lors de l'approbation.", "error");
        }
        return;
      }
    } catch {
      showMessage("Erreur de connexion au serveur.", "error");
    } finally {
      setProcessingId(null);
    }
  }

  // ── WalletConnect: Full frontend signing flow ──
  async function handleApproveWalletConnect(id: string, amount: number) {
    if (!connectedWallet) return;

    try {
      // 1. Resolve user wallet via a lightweight pre-check
      //    We need the recipient address. Fetch the pending action details.
      const preRes = await fetch(`/api/admin/submissions?status=PENDING`, { cache: 'no-store' });
      const preData = await preRes.json();
      const actionData = (preData.actions || []).find((a: EcoAction) => a.id === id);

      let recipientAddress: string;
      if (actionData?.walletAddress) {
        recipientAddress = actionData.walletAddress;
      } else {
        // Generate wallet on-the-fly for custodial users
        const newWallet = ethers.Wallet.createRandom();
        recipientAddress = newWallet.address;
      }

      // 2. Get the Privy wallet's EIP-1193 provider
      const ethProvider = await connectedWallet.getEthereumProvider();

      // 3. Switch to BSC if not already
      try {
        await ethProvider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${BSC_CHAIN_ID.toString(16)}` }],
        });
      } catch (switchError: unknown) {
        // If the chain isn't added, add it
        const err = switchError as { code?: number };
        if (err.code === 4902) {
          await ethProvider.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: `0x${BSC_CHAIN_ID.toString(16)}`,
              chainName: "BNB Smart Chain",
              nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
              rpcUrls: [BSC_RPC],
              blockExplorerUrls: ["https://bscscan.com"],
            }],
          });
        }
      }

      // 4. Build and send the transaction via BrowserProvider
      const provider = new ethers.BrowserProvider(ethProvider);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, ERC20_ABI, signer);
      const parsedAmount = ethers.parseUnits(amount.toString(), TOKEN_DECIMALS);
      const tx = await contract.transfer(recipientAddress, parsedAmount);

      showMessage("⏳ Transaction envoyée... En attente de confirmation blockchain.", "success");

      // 5. Wait for on-chain confirmation
      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1) {
        throw new Error("Transaction échouée sur la blockchain.");
      }

      // 6. Notify backend to update DB only
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          method: "walletconnect",
          txHash: receipt.hash,
          amount,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(`✅ Approuvé ! ${amount} 3WM envoyés à ${data.walletAddress?.slice(0, 10)}...`, "success");
        fetchActions();
        fetchTreasuryWalletConnect();
      } else {
        showMessage(data.error || "Erreur lors de la mise à jour DB.", "error");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("user rejected") || errMsg.includes("User denied")) {
        showMessage("Transaction annulée par l'utilisateur.", "error");
      } else {
        showMessage(`Erreur WalletConnect: ${errMsg}`, "error");
      }
    } finally {
      setProcessingId(null);
    }
  }

  // ══════════════════════════════════════════════════
  //  Reject
  // ══════════════════════════════════════════════════

  async function handleReject(id: string) {
    setProcessingId(id);
    try {
      const res = await fetch("/api/admin/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        showMessage("Soumission rejetée.", "success");
        fetchActions();
      } else {
        const data = await res.json();
        showMessage(data.error || "Erreur lors du rejet.", "error");
      }
    } catch {
      showMessage("Erreur de connexion.", "error");
    }
    setProcessingId(null);
  }

  // ══════════════════════════════════════════════════
  //  Delete
  // ══════════════════════════════════════════════════

  async function handleDelete(id: string) {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet enregistrement ?")) {
      return;
    }
    setProcessingId(id);
    try {
      const res = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        showMessage("Enregistrement supprimé.", "success");
        setActions((prev) => prev.filter((a) => a.id !== id));
      } else {
        const data = await res.json();
        showMessage(data.error || "Erreur lors de la suppression.", "error");
      }
    } catch {
      showMessage("Erreur de connexion.", "error");
    }
    setProcessingId(null);
  }

  // ══════════════════════════════════════════════════
  //  Approve Ambassador + WhatsApp
  // ══════════════════════════════════════════════════

  async function handleApproveAmbassador(ambassador: Ambassador) {
    setApprovingAmbassadorId(ambassador.id);
    try {
      const res = await fetch('/api/admin/approve-ambassador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ambassador.id }),
      });

      if (res.ok) {
        // Construction dynamique du lien de la carte digitale
        const profileUrl = `${window.location.origin}/p/${ambassador.slug}`;

        // Message personnalisé pour le Zero Waste Concept
        const waMessage = `Félicitations ${ambassador.fullName} ! Votre demande est validée. Vous êtes maintenant un partenaire officiel 3WM pour l'or vert et bleu. Voici votre carte digitale personnelle et votre QR Code : ${profileUrl}`;

        // Nettoyage du numéro de téléphone (conserver uniquement les chiffres)
        const cleanPhone = ambassador.phoneNumber.replace(/[^0-9]/g, '');

        // Ouverture du nouvel onglet vers wa.me
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;
        window.open(whatsappUrl, '_blank');

        showMessage(`✅ ${ambassador.fullName} approuvé(e) ! WhatsApp ouvert.`, 'success');

        // Rafraîchir la liste
        setAmbassadors((prev) => prev.filter((a) => a.id !== ambassador.id));
      } else {
        const data = await res.json();
        showMessage(data.error || "Erreur lors de l'approbation.", 'error');
      }
    } catch {
      showMessage("Erreur de connexion au serveur.", 'error');
    }
    setApprovingAmbassadorId(null);
  }

  // ══════════════════════════════════════════════════
  //  Computed
  // ══════════════════════════════════════════════════

  const pendingCount = actions.filter((a) => a.status === "PENDING").length;
  const approvedCount = actions.filter((a) => a.status === "APPROVED").length;

  const AUTH_TABS: { key: AuthMethod; icon: string; label: string }[] = [
    { key: "walletconnect", icon: "🔗", label: "WalletConnect" },
    { key: "mnemonic", icon: "🔑", label: "Phrase Secrète" },
    { key: "keystore", icon: "📁", label: "Fichier Keystore" },
  ];

  // ══════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════

  return (
    <div className="min-h-screen admin-dark" suppressHydrationWarning={true}>
      {/* ── Header ── */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo white-01.png"
              alt="3WM"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-lg font-bold text-white">3WM Admin</h1>
              <p className="text-xs text-slate-400">Tableau de bord exécutif</p>
            </div>
          </div>
          <div className="flex items-center gap-4" suppressHydrationWarning={true}>
            {isHydrated && (
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${isAuthReady() ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                <span className="text-slate-400">
                  {isAuthReady() ? "Autorisation prête" : "Non configuré"}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ═══════════════════════════════════════════════════
            TREASURY PANEL — 3 Auth Method Tabs
        ═══════════════════════════════════════════════════ */}
        <section className="treasury-panel rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-lg font-bold text-white">Autorisation Sécurisée</h2>
          </div>
          <p className="text-emerald-200/70 text-xs mb-5">
            Choisissez votre méthode d&apos;autorisation pour signer les transferts de tokens 3WM depuis le wallet trésorerie.
          </p>

          {/* ── Auth Method Tabs ── */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {AUTH_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setAuthMethod(tab.key)}
                className={`auth-tab ${authMethod === tab.key ? "active" : ""}`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══ TAB CONTENT ═══ */}

          {/* ── TAB 1: WalletConnect ── */}
          {authMethod === "walletconnect" && (
            <div key="walletconnect" className="auth-panel space-y-4">
              <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-600/20">
                <p className="text-xs text-emerald-300/80 mb-3">
                  Connectez votre MetaMask, Trust Wallet ou tout wallet compatible WalletConnect via Privy.
                  La transaction sera signée directement depuis votre wallet — aucune clé n&apos;est jamais envoyée au serveur.
                </p>
                {isHydrated && connectedWallet ? (
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="wallet-connected-badge">
                      <span className="dot" />
                      <span className="font-mono">{connectedWallet.address.slice(0, 8)}...{connectedWallet.address.slice(-4)}</span>
                    </div>
                    <button
                      onClick={handleLoadBalance}
                      disabled={treasuryLoading}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 disabled:opacity-40 transition-all"
                    >
                      {treasuryLoading ? "Chargement..." : "Charger Solde"}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-3" suppressHydrationWarning={true}>
                    {!isHydrated ? (
                      <p className="text-emerald-300/50 text-sm">Chargement du wallet...</p>
                    ) : (
                      <>
                        <p className="text-amber-300/80 text-sm mb-2">
                          Aucun wallet connecté. Utilisez le bouton Privy pour connecter votre wallet.
                        </p>
                        <p className="text-emerald-300/50 text-xs">
                          💡 Astuce: Connectez-vous via la page /profil ou utilisez l&apos;authentification Privy avec l&apos;option wallet.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: Mnemonic Phrase ── */}
          {authMethod === "mnemonic" && (
            <div key="mnemonic" className="auth-panel space-y-4">
              <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-600/20">
                <p className="text-xs text-emerald-300/80 mb-3">
                  Entrez votre phrase de récupération secrète (12 ou 24 mots). Elle sera envoyée au serveur via HTTPS pour signer la transaction, puis immédiatement supprimée de la mémoire.
                </p>
                <div className="space-y-3">
                  <textarea
                    value={mnemonicPhrase}
                    onChange={(e) => setMnemonicPhrase(e.target.value)}
                    placeholder="Entrez vos 12 ou 24 mots séparés par des espaces..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-emerald-900/50 border border-emerald-600/30 text-white placeholder-emerald-400/50 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 outline-none transition-all text-sm font-mono resize-none"
                  />
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <p className="text-xs text-emerald-300/50">
                      {mnemonicPhrase.trim() ? `${mnemonicPhrase.trim().split(/\s+/).length} mot(s) détecté(s)` : "Aucun mot détecté"}
                    </p>
                    <button
                      onClick={handleLoadBalance}
                      disabled={treasuryLoading || mnemonicPhrase.trim().split(/\s+/).length < 12}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {treasuryLoading ? "Chargement..." : "Charger Solde"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: Keystore JSON ── */}
          {authMethod === "keystore" && (
            <div key="keystore" className="auth-panel space-y-4">
              <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-600/20">
                <p className="text-xs text-emerald-300/80 mb-3">
                  Importez votre fichier Keystore JSON chiffré (exporté depuis MetaMask, MyEtherWallet, etc.) et entrez le mot de passe de déchiffrement.
                </p>
                <div className="space-y-3">
                  {/* File upload zone */}
                  <div
                    className={`file-drop-zone ${keystoreJson ? "has-file" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleKeystoreFileChange}
                      className="hidden"
                    />
                    {keystoreJson ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-emerald-300 text-sm font-medium">{keystoreFileName}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setKeystoreJson("");
                            setKeystoreFileName("");
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="ml-2 text-red-400/60 hover:text-red-400 text-xs"
                        >
                          ✕ Retirer
                        </button>
                      </div>
                    ) : (
                      <div>
                        <svg className="w-8 h-8 text-emerald-400/40 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-emerald-300/60 text-sm">Cliquez pour sélectionner un fichier Keystore JSON</p>
                        <p className="text-emerald-300/40 text-xs mt-1">.json uniquement</p>
                      </div>
                    )}
                  </div>

                  {/* Password input */}
                  <input
                    type="password"
                    value={keystorePassword}
                    onChange={(e) => setKeystorePassword(e.target.value)}
                    placeholder="Mot de passe de déchiffrement du Keystore..."
                    className="w-full px-4 py-3 rounded-xl bg-emerald-900/50 border border-emerald-600/30 text-white placeholder-emerald-400/50 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 outline-none transition-all text-sm"
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={handleLoadBalance}
                      disabled={treasuryLoading || !keystoreJson || !keystorePassword}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {treasuryLoading ? "Déchiffrement..." : "Charger Solde"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Treasury Error ── */}
          {treasuryError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-300 mt-4">
              {treasuryError}
            </div>
          )}

          {/* ── Treasury Balance Display ── */}
          {treasury && (
            <div className="space-y-4 mt-4 animate-fade-in-up">
              {/* Balance cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-800/30 rounded-xl p-4 border border-emerald-600/20">
                  <p className="text-xs text-emerald-300/70 uppercase tracking-wider mb-1">Wallet</p>
                  <p className="text-sm font-mono text-emerald-200 truncate">
                    {treasury.walletAddress}
                  </p>
                  <a
                    href={`${BSCSCAN_BASE}${treasury.walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors mt-1 inline-block"
                  >
                    Voir sur BscScan ↗
                  </a>
                </div>
                <div className="bg-emerald-800/30 rounded-xl p-4 border border-emerald-600/20">
                  <p className="text-xs text-emerald-300/70 uppercase tracking-wider mb-1">Solde 3WM</p>
                  <p className="text-2xl font-bold text-white">
                    {parseFloat(treasury.tokenBalance).toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-emerald-400/60 mt-1">
                    {parseFloat(treasury.tokenBalance) > 0
                      ? "Tokens disponibles dans le wallet"
                      : "Aucun token disponible"}
                  </p>
                </div>
                <div className="bg-emerald-800/30 rounded-xl p-4 border border-emerald-600/20">
                  <p className="text-xs text-emerald-300/70 uppercase tracking-wider mb-1">BNB (Gas)</p>
                  <p className="text-2xl font-bold text-white">
                    {parseFloat(treasury.bnbBalance).toFixed(4)}
                  </p>
                  <p className="text-xs text-emerald-400/60 mt-1">
                    {parseFloat(treasury.bnbBalance) > 0.001
                      ? "✅ Suffisant pour le gas"
                      : "⚠️ Solde BNB faible — rechargez pour le gas"}
                  </p>
                </div>
              </div>

              {/* Reward amount selector + estimation */}
              <div className="bg-emerald-800/20 rounded-xl p-4 border border-emerald-600/20 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-emerald-200 font-medium whitespace-nowrap">
                    🎁 Montant par récompense :
                  </label>
                  <div className="flex items-center gap-2">
                    {[10, 25, 50, 100].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setDefaultRewardAmount(preset)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          defaultRewardAmount === preset
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                            : "bg-emerald-900/40 text-emerald-300/70 border border-emerald-600/30 hover:bg-emerald-800/40 hover:text-emerald-300"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      value={defaultRewardAmount}
                      onChange={(e) => setDefaultRewardAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-2 py-1.5 rounded-lg bg-emerald-900/50 border border-emerald-600/30 text-white text-sm text-center font-bold focus:border-emerald-400 outline-none transition-all"
                    />
                    <span className="text-xs text-emerald-300/60 font-medium">3WM</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">
                    ≈ {parseFloat(treasury.tokenBalance) > 0 ? Math.floor(parseFloat(treasury.tokenBalance) / defaultRewardAmount) : 0} approbations
                  </p>
                  <p className="text-xs text-emerald-400/50">
                    à {defaultRewardAmount} 3WM chacune
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Status Message ── */}
        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-medium animate-fade-in-up ${
              messageType === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                : "bg-red-500/10 border border-red-500/20 text-red-300"
            }`}
          >
            {message}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2 flex-wrap">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as FilterStatus[]).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === s
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-300"
                  }`}
                >
                  {s === "ALL" && "Tous"}
                  {s === "PENDING" && `En attente ${filter === "ALL" ? `(${pendingCount})` : ""}`}
                  {s === "APPROVED" && `Approuvés ${filter === "ALL" ? `(${approvedCount})` : ""}`}
                  {s === "REJECTED" && "Rejetés"}
                </button>
              )
            )}
          </div>
          <button
            onClick={fetchActions}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Rafraîchir
          </button>
        </div>

        {/* ── Cards Grid ── */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-400">Chargement...</p>
          </div>
        ) : actions.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            Aucune soumission trouvée.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {actions.map((action) => (
              <div
                key={action.id}
                className="admin-card admin-card-hover rounded-2xl overflow-hidden transition-all duration-300"
              >
                {/* ── Photo ── */}
                <div className="relative h-44 bg-slate-800">
                  <img
                    src={action.photoUrl}
                    alt={action.fullName}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                      action.status === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                        : action.status === "APPROVED"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {action.status === "PENDING" && "En attente"}
                    {action.status === "APPROVED" && "Approuvé"}
                    {action.status === "REJECTED" && "Rejeté"}
                  </span>
                </div>

                {/* ── Info ── */}
                <div className="p-5">
                  <h3 className="font-bold text-white text-lg mb-1">
                    {action.fullName}
                  </h3>
                  <p className="text-sm text-slate-400 mb-1">
                    Âge: {action.age} • {action.phoneNumber}
                  </p>
                  {action.walletAddress && (
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-mono text-emerald-400 truncate">
                        {action.walletAddress.slice(0, 10)}...{action.walletAddress.slice(-4)}
                      </p>
                      {action.status === "APPROVED" && (
                        <a
                          href={`${BSCSCAN_BASE}${action.walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                          title="Voir sur BscScan"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                  {action.rewardAmount && action.status === "APPROVED" && (
                    <p className="text-xs text-emerald-400 font-semibold mb-1">
                      Récompense: {action.rewardAmount} 3WM
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mb-4">
                    {new Date(action.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  {/* ── Actions for PENDING ── */}
                  {action.status === "PENDING" && (
                    <div className="space-y-3">
                      {/* ── Amount input ── */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400 whitespace-nowrap">
                          Montant :
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={getAmount(action.id)}
                          onChange={(e) =>
                            setAmount(action.id, parseInt(e.target.value) || 0)
                          }
                          className="w-20 px-2 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm text-center focus:border-emerald-500 outline-none transition-all"
                        />
                        <span className="text-xs text-slate-400 font-medium">3WM</span>
                      </div>

                      {/* ── Active auth method indicator ── */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span>{AUTH_TABS.find(t => t.key === authMethod)?.icon}</span>
                        <span>via {AUTH_TABS.find(t => t.key === authMethod)?.label}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(action.id)}
                          disabled={processingId === action.id || !isAuthReady()}
                          className="flex-1 bg-emerald-600 text-white text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                        >
                          {processingId === action.id ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Blockchain...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approuver
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(action.id)}
                          disabled={processingId === action.id}
                          className="flex-1 bg-slate-700/50 text-red-400 text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-red-500/10 border border-slate-600/50 hover:border-red-500/30 disabled:opacity-40 transition-all"
                        >
                          Rejeter
                        </button>
                      </div>

                      {!isAuthReady() && (
                        <p className="text-xs text-amber-400/70 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getAuthWarning()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* ── Delete for all ── */}
                  <div className="flex justify-end mt-3 pt-3 border-t border-slate-700/30">
                    <button
                      onClick={() => handleDelete(action.id)}
                      disabled={processingId === action.id}
                      className="text-xs text-red-400/60 hover:text-red-400 font-medium transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            SECTION AMBASSADEURS
        ══════════════════════════════════════════════════════════ */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Demandes de Partenariat (Ambassadeurs)</h2>
                <p className="text-xs text-slate-400">
                  {ambassadors.length} demande{ambassadors.length !== 1 ? 's' : ''} en attente
                </p>
              </div>
            </div>
            <button
              onClick={fetchAmbassadors}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Rafraîchir
            </button>
          </div>

          {ambassadorLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-400">Chargement des ambassadeurs...</p>
            </div>
          ) : ambassadors.length === 0 ? (
            <div className="text-center py-12 admin-card rounded-2xl">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-500">Aucune demande de partenariat en attente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {ambassadors.map((amb) => (
                <div
                  key={amb.id}
                  className="admin-card admin-card-hover rounded-2xl overflow-hidden transition-all duration-300"
                >
                  {/* ── Photo ── */}
                  <div className="relative h-44 bg-slate-800">
                    <img
                      src={amb.photoUrl}
                      alt={amb.fullName}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                      En attente
                    </span>
                    {/* Ambassadeur badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                      Partenaire
                    </div>
                  </div>

                  {/* ── Info ── */}
                  <div className="p-5">
                    <h3 className="font-bold text-white text-lg mb-0.5">
                      {amb.fullName}
                    </h3>
                    <p className="text-xs text-emerald-400 font-medium mb-1">
                      {amb.role}
                    </p>
                    <p className="text-sm text-slate-400 mb-1 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {amb.phoneNumber}
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      {new Date(amb.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>

                    {/* ── Approve + WhatsApp Button ── */}
                    <button
                      onClick={() => handleApproveAmbassador(amb)}
                      disabled={approvingAmbassadorId === amb.id}
                      className="w-full bg-emerald-600 text-white text-sm font-semibold py-3 px-4 rounded-xl hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
                    >
                      {approvingAmbassadorId === amb.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Approbation...
                        </>
                      ) : (
                        <>
                          {/* WhatsApp icon */}
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          Approuver & Envoyer WhatsApp
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
