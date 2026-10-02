# 3WM Eco-Reward Platform — Complete Project Overview

> **Version**: 1.0.0 &nbsp;|&nbsp; **Stack**: Next.js 16 · Prisma · BNB Smart Chain · Privy Auth  
> **Token**: 3WM (BEP-20) &nbsp;|&nbsp; **Contract**: [`0xd065ca6460ae6d379c93ec0422084c2bc7048d77`](https://bscscan.com/address/0xd065ca6460ae6d379c93ec0422084c2bc7048d77)

---

## Table of Contents

1. [The Problem We Solve](#1-the-problem-we-solve)
2. [The 3WM Solution — Platform Overview](#2-the-3wm-solution--platform-overview)
3. [Technology Stack](#3-technology-stack)
4. [Token Architecture — Deep Dive](#4-token-architecture--deep-dive)
5. [Database Schema (Prisma)](#5-database-schema-prisma)
6. [Project File Structure](#6-project-file-structure)
7. [End-to-End System Architecture](#7-end-to-end-system-architecture)
8. [User Flows — Step by Step](#8-user-flows--step-by-step)
9. [API Reference](#9-api-reference)
10. [Admin Dashboard — Complete Guide](#10-admin-dashboard--complete-guide)
11. [Authentication System (Privy)](#11-authentication-system-privy)
12. [Security Architecture](#12-security-architecture)
13. [Environment Variables](#13-environment-variables)
14. [Deployment](#14-deployment)

---

## 1. The Problem We Solve

### The Core Challenge

In many developing regions (particularly Madagascar, Morocco, and francophone Africa), ecological actions — such as waste collection, tree planting, and environmental cleanup — go **unrewarded** and **undocumented**. Communities lack:

- **Incentive mechanisms** to motivate ecological participation
- **Digital identity** for grassroots environmental volunteers
- **Access to crypto/Web3** due to technical barriers (no MetaMask, no crypto knowledge)
- **Verifiable proof** that eco-actions actually happened
- **A way to spend** earned rewards at local partner merchants

### Why Existing Solutions Fail

| Problem | Why It's Hard |
|---|---|
| Rural users can't install MetaMask | Too technical, requires seed phrases |
| No bank accounts | Traditional payments don't work |
| No trust layer | How do you prove someone cleaned a beach? |
| Token distribution | Airdrops require gas fees the user can't pay |

---

## 2. The 3WM Solution — Platform Overview

The **3WM Eco-Reward Platform** is a Proof-of-Concept (POC) that creates a complete circular economy:

```
┌─────────────────────────────────────────────────────────────────┐
│                    3WM ECOSYSTEM FLOW                          │
│                                                                 │
│   📸 User submits          🔍 Admin reviews         💰 Tokens  │
│   eco-action photo    ──►  and approves        ──►  airdropped │
│   + phone number           via dashboard            on BSC     │
│                                                                 │
│   🛒 User spends           🤝 Partners get          📱 QR Card │
│   tokens at merchant  ◄──  digital VIP cards   ◄──  shared via │
│   (checkout flow)          with QR codes            WhatsApp   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Innovations

1. **Zero-Knowledge Onboarding** — Users only need a phone number. No passwords, no seed phrases, no app downloads.
2. **Custodial Wallet Auto-Generation** — The platform creates a BSC wallet for users who don't have one, storing the private key server-side.
3. **BYOW (Bring Your Own Wallet)** — Advanced users can provide their existing BSC address.
4. **BYOK (Bring Your Own Key)** — The admin's master treasury key is **never stored on the server**. The admin injects it at runtime via the browser.
5. **JIT Gas Funding** — When a user spends tokens at a merchant, the platform auto-funds micro-BNB from a dedicated "Gas Tank" wallet so the custodial wallet can pay transaction fees.
6. **Digital Partner Cards** — Approved ambassadors/partners receive a shareable digital VIP card with QR code, sent via WhatsApp.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) | SSR pages, client components, API routes |
| **Styling** | Tailwind CSS 4 + Custom CSS | Glassmorphism UI, dark admin theme |
| **Database** | MySQL (Prisma ORM) | Persistent storage for actions & ambassadors |
| **Blockchain** | BNB Smart Chain (BSC) | 3WM BEP-20 token transfers |
| **Blockchain SDK** | ethers.js v6 | Wallet creation, contract interaction |
| **Authentication** | Privy (SMS, email, wallet) | Passwordless login for end users |
| **QR Codes** | qrcode.react | Ambassador digital card QR generation |
| **Phone Input** | react-phone-number-input | International E.164 phone formatting |
| **Deployment** | Hostinger (MySQL) | Production hosting |

---

## 4. Token Architecture — Deep Dive

### 4.1. The 3WM Token

| Property | Value |
|---|---|
| **Name** | 3WM |
| **Standard** | BEP-20 (ERC-20 on BSC) |
| **Blockchain** | BNB Smart Chain (Mainnet, Chain ID: 56) |
| **Contract Address** | `0xd065ca6460ae6d379c93ec0422084c2bc7048d77` |
| **Decimals** | 10 |
| **RPC Endpoint** | `https://bsc-dataseed.binance.org/` |
| **Explorer** | [BscScan](https://bscscan.com/address/0xd065ca6460ae6d379c93ec0422084c2bc7048d77) |

### 4.2. Token Lifecycle — Step by Step

Here is the **complete journey of a 3WM token** from the treasury to a merchant:

```
STEP 1: TREASURY HOLDS TOKENS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The 3WM project owns a "treasury wallet" loaded with 3WM tokens.
The private key to this wallet is held ONLY by the executive admin.
It is NEVER stored in any .env file or database.

STEP 2: ADMIN INJECTS KEY (BYOK)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The admin opens /admin, pastes their treasury private key
into the "Trésorerie BYOK" panel. The key is stored ONLY
in the browser's sessionStorage (cleared on tab close).

      ┌──────────────────────────────┐
      │  Admin Dashboard (Browser)   │
      │                              │
      │  🔑 Private Key: 0xABC...   │
      │  📊 Balance: 50,000 3WM     │
      │  ⛽ Gas: 0.0234 BNB          │
      └──────────────┬───────────────┘
                     │
                     ▼
STEP 3: USER SUBMITS ECO-ACTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A user at / fills the form:
  • Full name
  • Age
  • Phone number (unique identifier)
  • Photo of eco-action (uploaded to /public/uploads/)
  • Optional: their own BSC wallet address (BYOW)

The submission is saved to the database with status = "PENDING".

STEP 4: ADMIN REVIEWS & APPROVES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
In the admin dashboard, the admin sees the pending submission card
with the photo. They set the reward amount (default: 50 3WM)
and click "Approuver". This triggers:

  4a. WALLET RESOLUTION
  ─────────────────────
  IF user provided their own wallet (BYOW):
    → Use that address as the destination
  ELSE (no wallet provided):
    → ethers.Wallet.createRandom() generates a NEW BSC wallet
    → The new wallet address + private key are stored in the DB
    → This is the "custodial" model

  4b. ON-CHAIN TOKEN TRANSFER
  ───────────────────────────
  The admin's treasury wallet signs a transfer:

    ┌────────────────────────────────────────────┐
    │  contract.transfer(userWallet, amount)      │
    │                                             │
    │  From: Admin Treasury (0xTREASURY...)       │
    │  To:   User Wallet (0xUSER...)              │
    │  Amount: 50 × 10^10 (10 decimals)           │
    │  Gas: Paid by the treasury wallet's BNB     │
    └─────────────────────┬──────────────────────┘
                          │
                          ▼
    ┌─────────────────────────────────────────────┐
    │  BNB Smart Chain confirms the transaction   │
    │  tx.wait() returns receipt.status === 1     │
    └─────────────────────────────────────────────┘

  4c. DATABASE UPDATE (only after blockchain confirmation)
  ────────────────────────────────────────────────────────
    status:          "PENDING" → "APPROVED"
    walletAddress:   set to user's wallet
    encryptedPrivKey: set (only if custodial)
    rewardAmount:    50
    slug:            "jean-dupont" (for shareable page)

STEP 5: USER CAN VIEW THEIR REWARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The user visits /profil, logs in via Privy (SMS/email/wallet),
and sees their Web3 wallet address with tokens on BscScan.

STEP 6: SPENDING TOKENS (Merchant Checkout)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When a user wants to pay a merchant with 3WM tokens:

  6a. JIT GAS FUNDING
  ───────────────────
  The server's "Gas Tank" wallet sends 0.0005 BNB to the
  user's custodial wallet so it can pay BSC transaction fees.

    ┌──────────────────────────────────────────┐
    │  Gas Tank (0xGAS...) ──► User (0xUSER..)│
    │  Amount: 0.0005 BNB                      │
    └──────────────────────────────────────────┘

  6b. TOKEN TRANSFER TO MERCHANT
  ──────────────────────────────
  Using the user's stored private key, the server signs a
  token transfer from the user's wallet to the merchant:

    ┌──────────────────────────────────────────────────┐
    │  User Wallet (0xUSER..) ──► Merchant (0xMERCH..)│
    │  Amount: X 3WM tokens                            │
    │  Gas: Paid with the 0.0005 BNB just received     │
    └──────────────────────────────────────────────────┘

    ✅ Both transactions are confirmed on-chain before
       returning success to the frontend.
```

### 4.3. Wallet Models Comparison

| Feature | BYOW (Bring Your Own Wallet) | Custodial (Auto-Generated) |
|---|---|---|
| **User provides wallet** | ✅ Yes | ❌ No |
| **Platform creates wallet** | ❌ No | ✅ Yes (`ethers.Wallet.createRandom()`) |
| **Private key stored in DB** | ❌ No | ✅ Yes (in `encryptedPrivKey` field) |
| **Merchant checkout available** | ❌ No (user manages own keys) | ✅ Yes (server signs transactions) |
| **User controls funds** | ✅ Full control | ⚠️ Platform controls |
| **Private key reveal** | N/A | ✅ Via `/api/client/reveal` (phone verification) |

### 4.4. Key Wallet Roles

```
┌─────────────────────────────────────────────────────────┐
│                 WALLET ARCHITECTURE                      │
│                                                          │
│  🏦 TREASURY WALLET (Admin's personal wallet)           │
│  ├── Holds the 3WM token supply                         │
│  ├── Private key: NEVER stored on server                │
│  ├── Injected at runtime via BYOK in admin dashboard    │
│  └── Used to: Airdrop tokens to approved users          │
│                                                          │
│  ⛽ GAS TANK WALLET (Server-side, in .env)              │
│  ├── Holds small amount of BNB (~$5)                    │
│  ├── Private key: In GAS_TANK_PRIVATE_KEY env var       │
│  └── Used to: Fund JIT gas for custodial tx             │
│                                                          │
│  👤 USER WALLET (per-user, one of two types)            │
│  ├── BYOW: User's own wallet, no key stored             │
│  └── Custodial: Auto-generated, key in DB               │
│                                                          │
│  🏪 MERCHANT WALLET (external)                          │
│  └── Any BSC address provided by the merchant           │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Database Schema (Prisma)

The database uses **MySQL** (production) with **Prisma ORM**. Two models:

### 5.1. `EcoAction` — Eco-action Submissions

```prisma
model EcoAction {
  id               String   @id @default(cuid())
  fullName         String                          // User's full name
  age              String                          // User's age
  phoneNumber      String   @unique               // Primary identifier (unique)
  photoUrl         String                          // Path to uploaded photo (/uploads/...)
  walletAddress    String?                         // BSC wallet (set on approval)
  encryptedPrivKey String?  @db.Text              // Private key (custodial only)
  rewardAmount     Int?                            // Number of 3WM tokens rewarded
  status           String   @default("PENDING")   // PENDING | APPROVED | REJECTED
  slug             String?  @unique               // URL slug for shareable page
  createdAt        DateTime @default(now())
}
```

**Status Lifecycle:**
```
PENDING ──► APPROVED  (tokens sent on-chain, wallet assigned)
PENDING ──► REJECTED  (admin rejects the submission)
```

### 5.2. `Ambassador` — Partner/Ambassador Applications

```prisma
model Ambassador {
  id          String   @id @default(cuid())
  fullName    String                           // Partner's full name
  role        String   @default("Ambassadeur") // Custom role/title
  phoneNumber String   @unique                 // E.164 format phone
  photoUrl    String                           // Uploaded portrait photo
  slug        String   @unique                 // URL slug for digital card
  status      String   @default("PENDING")     // PENDING | APPROVED
  createdAt   DateTime @default(now())
}
```

---

## 6. Project File Structure

```
3WM-POC/
├── app/
│   ├── layout.tsx                    # Root layout (Geist fonts, Providers)
│   ├── providers.tsx                 # PrivyProvider wrapper (client)
│   ├── globals.css                   # Global styles, animations, glassmorphism
│   ├── page.tsx                      # 🏠 Home — Eco-action submission form
│   │
│   ├── profil/
│   │   └── page.tsx                  # 👤 User profile — Privy login + Web3 wallet display
│   │
│   ├── partenaire/
│   │   └── page.tsx                  # 🤝 Partner application form
│   │
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx              # 🔐 Admin login (password)
│   │   └── page.tsx                  # 📊 Admin dashboard (BYOK + submissions + ambassadors)
│   │
│   ├── action/
│   │   └── [slug]/
│   │       └── page.tsx              # 🌿 Public eco-action certificate page
│   │
│   ├── p/
│   │   └── [slug]/
│   │       ├── page.tsx              # 💳 Ambassador digital VIP card (Paper Wallet style)
│   │       └── QRCodeDisplay.tsx     # QR code component
│   │
│   ├── components/
│   │   └── LoginButton.tsx           # Privy login/logout button component
│   │
│   └── api/
│       ├── claim/
│       │   └── route.ts              # POST — Submit eco-action (form + photo upload)
│       │
│       ├── admin/
│       │   ├── login/route.ts        # POST — Admin password authentication
│       │   ├── balance/route.ts      # POST — Treasury wallet balance (BYOK)
│       │   ├── submissions/route.ts  # GET  — List eco-action submissions (filterable)
│       │   ├── approve/route.ts      # POST — Approve submission + airdrop tokens
│       │   ├── reject/route.ts       # POST — Reject a submission
│       │   ├── delete/route.ts       # POST — Delete a submission record
│       │   ├── ambassadors/route.ts  # GET  — List pending ambassador applications
│       │   └── approve-ambassador/route.ts  # POST — Approve an ambassador
│       │
│       ├── ambassador/
│       │   └── apply/route.ts        # POST — Submit ambassador application
│       │
│       ├── client/
│       │   ├── status/route.ts       # POST — Check submission status by phone
│       │   └── reveal/route.ts       # POST — Reveal custodial wallet private key
│       │
│       ├── merchant/
│       │   └── checkout/route.ts     # POST — JIT gas + token transfer to merchant
│       │
│       └── user/
│           └── profile/route.ts      # GET  — Authenticated user profile (Privy token)
│
├── lib/
│   ├── constants.ts                  # BSC config, token contract, ERC-20 ABI
│   ├── prisma.ts                     # Prisma client singleton
│   └── privy.ts                      # Privy server-side client
│
├── prisma/
│   └── schema.prisma                 # Database schema (EcoAction, Ambassador)
│
├── public/
│   ├── uploads/                      # User-uploaded photos (eco-actions, ambassador portraits)
│   ├── logo 3wm jjj-01.png          # 3WM logo (light background)
│   └── logo white-01.png            # 3WM logo (dark background)
│
├── .env.example                      # Environment variable template
├── package.json                      # Dependencies & scripts
└── next.config.ts                    # Next.js configuration
```

---

## 7. End-to-End System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js 16)                              │
│                                                                              │
│   /                    /profil              /partenaire          /admin      │
│   Eco-Action Form      Privy Wallet         Partner Apply        Dashboard  │
│   ┌─────────────┐     ┌──────────────┐     ┌─────────────┐    ┌──────────┐ │
│   │ name, age   │     │ Login with   │     │ name, role  │    │ BYOK key │ │
│   │ phone, photo│     │ SMS/email/   │     │ phone       │    │ treasury │ │
│   │ wallet(opt) │     │ wallet       │     │ photo       │    │ approve  │ │
│   └──────┬──────┘     └──────┬───────┘     └──────┬──────┘    │ reject   │ │
│          │                   │                     │           │ delete   │ │
├──────────┼───────────────────┼─────────────────────┼───────────┼──────────┤ │
│          ▼                   ▼                     ▼           ▼          │ │
│                         API LAYER (Route Handlers)                        │ │
│                                                                           │ │
│   POST /api/claim    GET /api/user/profile  POST /api/ambassador/apply   │ │
│   POST /api/admin/approve    POST /api/admin/reject                      │ │
│   POST /api/admin/balance    POST /api/merchant/checkout                 │ │
│   POST /api/client/status    POST /api/client/reveal                     │ │
│                                                                           │ │
├───────────────────────────────┬───────────────────────────────────────────┤ │
│                               │                                           │ │
│           ┌───────────────────┼───────────────────┐                       │ │
│           ▼                   ▼                   ▼                       │ │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                 │ │
│   │    MySQL     │   │  BNB Smart   │   │    Privy     │                 │ │
│   │   (Prisma)   │   │    Chain     │   │   (Auth)     │                 │ │
│   │              │   │              │   │              │                 │ │
│   │  EcoAction   │   │  3WM Token   │   │  SMS/Email   │                 │ │
│   │  Ambassador  │   │  BEP-20      │   │  Embedded    │                 │ │
│   │              │   │  Transfers   │   │  Wallets     │                 │ │
│   └──────────────┘   └──────────────┘   └──────────────┘                 │ │
│                                                                           │ │
└───────────────────────────────────────────────────────────────────────────┘ │
```

---

## 8. User Flows — Step by Step

### 8.1. Flow A: Eco-Action Submission (End User)

```
Step 1 ─ User opens the homepage (/)
         Sees the "Programme Éco-Récompense" form
         
Step 2 ─ User fills in:
         • Full name (required)
         • Age (required)
         • Phone number (required, unique identifier)
         • BSC Wallet address (optional — for advanced users)
         • Photo of eco-action (required — camera or gallery)
         
Step 3 ─ User clicks "Soumettre mon action écologique"
         Frontend sends FormData to POST /api/claim
         
Step 4 ─ Server processing:
         a) Photo saved to /public/uploads/<timestamp>-<filename>
         b) New EcoAction record created in MySQL with status = "PENDING"
         c) Phone number uniqueness enforced (409 if duplicate)
         
Step 5 ─ User sees success message:
         "Votre action a été enregistrée. Notre équipe va l'examiner."
         They can navigate to /profil to check their status later.
```

### 8.2. Flow B: Admin Review & Token Airdrop

```
Step 1 ─ Admin navigates to /admin/login
         Enters the ADMIN_SECRET_PASSWORD
         Cookie-based session set for 24 hours
         
Step 2 ─ Admin reaches /admin dashboard
         Pastes their treasury wallet private key into
         the "Trésorerie BYOK" panel
         Clicks "Charger Solde" to verify:
           • Treasury wallet address
           • 3WM token balance
           • BNB balance (for gas)
         
Step 3 ─ Admin views pending submissions
         Each card shows: photo, name, age, phone, date
         Filter buttons: Tous | En attente | Approuvés | Rejetés
         
Step 4 ─ Admin sets reward amount (input field, default 50 3WM)
         Clicks "Approuver"
         
Step 5 ─ Server processing (POST /api/admin/approve):
         a) Validates the submission exists and is PENDING
         b) Resolves wallet:
            • If user provided a wallet → use it (BYOW)
            • If not → generate new wallet (ethers.Wallet.createRandom())
         c) Generates URL slug from user's name
         d) Connects to BSC via admin's private key
         e) Calls contract.transfer(userWallet, amount)
         f) Waits for on-chain confirmation (tx.wait())
         g) ONLY after blockchain success → updates database:
            status="APPROVED", walletAddress, rewardAmount, slug
         
Step 6 ─ Dashboard shows success:
         "✅ Approuvé ! 50 3WM envoyés à 0xABC123..."
         Treasury balance refreshes automatically.
         
         If the admin REJECTS:
         → status changes to "REJECTED", no blockchain activity
```

### 8.3. Flow C: Partner/Ambassador Application

```
Step 1 ─ Partner visits /partenaire
         Fills in: Full name, Role/Title, Phone (E.164), Photo
         
Step 2 ─ Clicks "Envoyer ma candidature"
         POST /api/ambassador/apply creates:
           • Photo uploaded to /public/uploads/
           • Ambassador record with status = "PENDING"
           • Auto-generated slug: "jean-dupont-4821"
         
Step 3 ─ Admin sees the application in the "Demandes de Partenariat"
         section at the bottom of /admin
         
Step 4 ─ Admin clicks "Approuver & Envoyer WhatsApp"
         a) POST /api/admin/approve-ambassador sets status = "APPROVED"
         b) Frontend constructs WhatsApp deep link:
            https://wa.me/<phone>?text=Félicitations...votre carte: https://domain/p/<slug>
         c) New browser tab opens → admin sends the WhatsApp message
         
Step 5 ─ Partner receives WhatsApp with link to their digital card
         → /p/<slug> renders a premium Paper Wallet-style VIP card
         → QR code links back to the card URL for verification
```

### 8.4. Flow D: User Profile & Wallet (Privy Auth)

```
Step 1 ─ User visits /profil
         
Step 2 ─ If not authenticated:
         → Sees "Connectez-vous à votre compte" button
         → Privy modal opens: login via SMS, email, or wallet
         → Privy auto-creates an embedded Ethereum wallet for
           users without one (createOnLogin: 'users-without-wallets')
         
Step 3 ─ Once authenticated:
         → Shows their authentication method (phone/email)
         → Displays their Privy-generated wallet address
         → Copy-to-clipboard button
         → If no wallet exists: "Générer mon portefeuille Web3" button
         
Step 4 ─ User can log out via "Se déconnecter"
```

### 8.5. Flow E: Merchant Checkout (Token Spending)

```
Step 1 ─ Merchant provides: user's phone number, amount to spend,
         merchant's BSC wallet address
         → POST /api/merchant/checkout
         
Step 2 ─ Server validates:
         • User exists and is APPROVED
         • User has a custodial wallet (BYOW users cannot use this flow)
         • Merchant address is valid (0x + 40 hex chars)
         
Step 3 ─ JIT Gas Funding (Transaction 1):
         Gas Tank wallet sends 0.0005 BNB to user's wallet
         (so user's wallet can pay BSC gas fees)
         
Step 4 ─ Token Transfer (Transaction 2):
         Using user's stored private key, server signs:
         contract.transfer(merchantAddress, amount)
         
Step 5 ─ Both transactions confirmed on-chain
         Response includes: gasTxHash, spendTxHash, from, to, amount
```

---

## 9. API Reference

### Public APIs

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/claim` | Submit a new eco-action (FormData: name, age, phone, photo, wallet?) |
| `POST` | `/api/ambassador/apply` | Apply to become a partner/ambassador |
| `POST` | `/api/client/status` | Check submission status by phone number |
| `POST` | `/api/client/reveal` | Reveal custodial wallet private key (by phone) |
| `GET` | `/api/user/profile` | Get authenticated user's profile (requires Privy Bearer token) |

### Admin APIs

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/login` | Authenticate with admin password |
| `POST` | `/api/admin/balance` | Get treasury wallet balance (requires private key in body) |
| `GET` | `/api/admin/submissions?status=PENDING` | List submissions (filter: ALL, PENDING, APPROVED, REJECTED) |
| `POST` | `/api/admin/approve` | Approve submission + on-chain token airdrop |
| `POST` | `/api/admin/reject` | Reject a pending submission |
| `POST` | `/api/admin/delete` | Permanently delete a submission record |
| `GET` | `/api/admin/ambassadors` | List pending ambassador applications |
| `POST` | `/api/admin/approve-ambassador` | Approve an ambassador application |

### Merchant APIs

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/merchant/checkout` | Process JIT gas + token transfer to merchant |

---

## 10. Admin Dashboard — Complete Guide

The admin dashboard (`/admin`) is the **command center** of the platform. It has two major sections:

### 10.1. Treasury Panel (BYOK)

```
┌─────────────────────────────────────────────────────────────┐
│  🔒 Trésorerie BYOK                                        │
│                                                              │
│  [🔑 Paste private key here...          ] [Charger Solde]   │
│                                                              │
│  ┌────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │   Wallet   │  │   Solde 3WM    │  │   BNB (Gas)     │   │
│  │ 0xABC...   │  │   48,500.00    │  │   0.0234        │   │
│  └────────────┘  └────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

- The private key is stored in **browser sessionStorage only**
- Green dot indicator: "Clé active" when key is loaded
- Red dot: "Aucune clé" when no key
- Balance shows both 3WM tokens and BNB for gas

### 10.2. Submissions Grid

Each submission is a card showing:
- **Photo** of the eco-action
- **Status badge**: En attente (yellow) | Approuvé (green) | Rejeté (red)
- **User info**: name, age, phone number
- **Wallet address** (truncated, with BscScan link for approved)
- **Reward amount** (shown for approved submissions)
- **Date/time** of submission
- **Actions**: Amount input + Approuver / Rejeter buttons (for PENDING)
- **Delete button** (for all statuses)

Filter tabs: `Tous` | `En attente` | `Approuvés` | `Rejetés`

### 10.3. Ambassador Management Section

Displays pending partner applications with:
- Partner photo, name, role, phone number
- Single **"Approuver & Envoyer WhatsApp"** button
- On approval → opens WhatsApp with pre-formatted message containing the partner's digital card URL

---

## 11. Authentication System (Privy)

### Configuration (`providers.tsx`)

```typescript
loginMethods: ["sms", "email", "wallet"]
embeddedWallets: {
  ethereum: {
    createOnLogin: 'users-without-wallets'  // Auto-create embedded wallet
  }
}
```

### Authentication Flow

| Step | What Happens |
|---|---|
| 1 | User clicks "Se connecter" → Privy modal opens |
| 2 | User chooses: SMS, email, or external wallet |
| 3 | SMS/email: verification code sent → user enters code |
| 4 | Privy creates a session + auto-generates an embedded Ethereum wallet |
| 5 | `usePrivy()` hook provides: `user`, `authenticated`, `login`, `logout`, `createWallet` |

### Server-Side Verification (`/api/user/profile`)

```
1. Extract Bearer token from Authorization header
2. privy.utils().auth().verifyAuthToken(token)
3. privy.users()._get(userId) to get linked accounts
4. Match phone or wallet to EcoAction in database
5. Return profile (never expose encryptedPrivKey)
```

---

## 12. Security Architecture

### What is protected and how:

| Asset | Protection |
|---|---|
| **Treasury private key** | BYOK — never stored on server, lives in browser sessionStorage only |
| **Gas Tank private key** | Environment variable (`GAS_TANK_PRIVATE_KEY`) |
| **User custodial keys** | Stored in DB (`encryptedPrivKey` column), accessible only via phone verification |
| **Admin access** | Password-based login (`ADMIN_SECRET_PASSWORD`), HttpOnly cookie session |
| **Privy secrets** | `PRIVY_APP_SECRET` in env (server-only), `NEXT_PUBLIC_PRIVY_APP_ID` (public) |
| **User profile data** | Privy Bearer token validation on `/api/user/profile` |
| **Phone uniqueness** | Database-level unique constraint prevents duplicate submissions |

### Key Security Design Decisions

> [!CAUTION]
> The `encryptedPrivKey` field currently stores private keys in **plaintext**. In production, this should be encrypted with a server-side key before storage.

> [!IMPORTANT]
> The BYOK pattern means that if the admin's browser tab is closed or session clears, the treasury key is gone. The admin must re-inject it each session. This is **intentional** for security.

---

## 13. Environment Variables

```bash
# ── Database ──
DATABASE_URL="mysql://user:password@localhost:3306/3wmdb"

# ── Gas Tank Wallet ──
# Small BNB balance for JIT gas funding in merchant checkout
GAS_TANK_PRIVATE_KEY="0x..."

# ── Privy Authentication ──
NEXT_PUBLIC_PRIVY_APP_ID="clXXXXXXXXX"    # Public (frontend)
PRIVY_APP_SECRET="XXXXXXXXXXXXXXX"          # Secret (backend only)

# ── Admin Access ──
ADMIN_SECRET_PASSWORD="your_admin_password"

# ── NOT IN ENV (by design) ──
# Treasury/admin private key → injected at runtime via BYOK dashboard
```

---

## 14. Deployment

### Build Commands

```bash
npm run dev        # Local development server
npm run build      # Production build (generates Prisma client, pushes schema, builds Next.js)
npm run start      # Start production server
```

### Build Script Breakdown

The `build` script runs:
```bash
chmod -R 775 node_modules/@prisma/engines && prisma generate && prisma db push && next build
```

1. **Fix Prisma engine permissions** (for Hostinger hosting)
2. **Generate Prisma client** from schema
3. **Push schema to MySQL** (create/update tables)
4. **Build Next.js** for production

### Database Provider

- **Development**: SQLite (`file:./dev.db`) — included in repo for quick testing
- **Production**: MySQL on Hostinger

---

> **Last Updated**: July 2026 &nbsp;|&nbsp; **Maintainer**: 3WM Group Team
