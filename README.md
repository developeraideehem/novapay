<div align="center">

# 💳 NovaPay

### African Mobile Wallet & Payment Platform

[![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?style=flat-square&logo=react)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-52-000020?style=flat-square&logo=expo)](https://expo.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)](LICENSE)

*A production-grade fintech application enabling seamless financial services across Africa — from wallet management and bill payments to P2P transfers and savings plans.*

</div>

---

## ✨ Features

| Feature | Mobile App | Web App | Status |
|---------|:---------:|:-------:|:------:|
| Phone + OTP Authentication | ✅ | ✅ | Live |
| Wallet Balance & Transactions | ✅ | ✅ | Live |
| Fund Wallet (Paystack) | ✅ | ✅ | Live |
| Withdraw to Bank (Paystack) | ✅ | ✅ | Live |
| P2P Transfer | ✅ | ✅ | Live |
| Airtime Purchase (Flutterwave) | ✅ | ✅ | Live |
| Data Bundle Purchase | ✅ | ✅ | Live |
| Electricity Bill Payment | ✅ | ✅ | Live |
| Cable TV Subscription | ✅ | ✅ | Live |
| Savings Plans | ✅ | 🔄 | In Progress |
| Loan Requests | ✅ | 🔄 | In Progress |
| KYC Verification | ✅ | 🔄 | In Progress |
| Beneficiary Management | ✅ | 🔄 | In Progress |

---

## 🏗️ Architecture

```
novapay/
├── app/                        # 📱 React Native (Expo) mobile app
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── screens/            # Auth, Dashboard, Wallet, Bills, etc.
│       ├── navigation/         # React Navigation stack & tabs
│       ├── services/           # Supabase, Paystack, Flutterwave APIs
│       ├── store/              # Zustand state management
│       ├── theme/              # Design tokens (colors, spacing, fonts)
│       └── types/              # TypeScript type definitions
│
├── web/                        # 🌐 React + Vite web app
│   └── src/
│       ├── screens/            # All web screen components
│       │   ├── bills/          # Airtime, Data, Electricity, Cable TV
│       │   ├── DashboardScreen.tsx
│       │   ├── FundWalletScreen.tsx
│       │   ├── TransferScreen.tsx
│       │   ├── WithdrawScreen.tsx
│       │   └── ProfileScreen.tsx
│       ├── services/           # Supabase, Paystack, Flutterwave, Wallet
│       ├── context/            # WalletContext (React Context)
│       └── App.tsx             # React Router configuration
│
└── supabase/                   # 🗄️ Database layer
    ├── schema.sql              # Tables, constraints, indexes
    ├── functions.sql           # Stored procedures & triggers
    └── rls.sql                 # Row-Level Security policies
```

---

## 🛠️ Tech Stack

### Mobile (`/app`)
| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.76 + Expo 52 |
| Navigation | React Navigation 7 |
| State | Zustand 5 |
| Storage | Expo SecureStore |
| Auth | Supabase Auth (Phone OTP) |

### Web (`/web`)
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS |
| Routing | React Router DOM v6 |
| State | React Context + hooks |

### Backend & Services
| Service | Provider | Purpose |
|---------|----------|---------|
| Database | Supabase (PostgreSQL 17) | Users, wallets, transactions |
| Auth | Supabase Auth | Phone OTP login |
| Payments | Paystack | Fund wallet, withdrawals |
| VTU | Flutterwave | Airtime & data top-ups |
| Security | Row-Level Security | Per-user data isolation |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Git

### 1. Clone the repository
```bash
git clone https://github.com/devoloperaideehem/novapay.git
cd novapay
```

### 2. Configure environment variables

**Copy the example files:**
```bash
cp .env.example .env
```

**Fill in your keys in `.env`:**
```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Paystack
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxx
PAYSTACK_SECRET_KEY=sk_test_xxxx

# Flutterwave
EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxx
```

### 3. Set up the database

Apply the SQL files to your Supabase project in this order:
```
1. supabase/schema.sql      ← Tables & constraints
2. supabase/functions.sql   ← Business logic functions
3. supabase/rls.sql         ← Row-Level Security policies
```

### 4. Run the Web App

```bash
cd web
npm install
npm run dev
# → http://localhost:5173
```

### 5. Run the Mobile App

```bash
cd app
npm install
npx expo start
# Scan QR with Expo Go, or press i/a for simulator
```

---

## 🗄️ Database Schema

The Supabase PostgreSQL database has 8 core tables:

```
users           → Profile, KYC status, tier level
wallets         → Balance, account number, limits
transactions    → Full ledger with 17 categories
savings_plans   → Flexible / fixed / target savings
loans           → Applications, disbursements
loan_repayments → Repayment schedule tracking
beneficiaries   → Saved recipients
bill_providers  → 18 pre-seeded providers (airtime, data, electricity, cable TV)
```

**Key functions:**
- `transfer_funds()` — atomic P2P transfer with full audit trail
- `update_wallet_balance()` — safe credit/debit with balance checks
- `process_bill_payment()` — bills with cashback calculation
- `find_wallet_by_identifier()` — lookup by account number or phone

---

## 🔒 Security

- **Row-Level Security** — every table has RLS policies; users can only access their own data
- **Environment variables** — all secrets in `.env` (never committed)
- **SecureStore** — sensitive mobile data stored in hardware-backed storage
- **Transaction PIN** — hashed server-side; never stored in plaintext
- **HTTPS only** — all external API communication over TLS

---

## 🌍 Supported Providers

### Electricity (DISCOs)
IKEDC · EKEDC · AEDC · PHED · KEDCO · IBEDC · EEDC · BEDC

### Cable TV
DStv · GOtv · StarTimes

### Telecom
MTN · Airtel · Glo · 9mobile (Airtime & Data)

---

## 📸 Screenshots

> Coming soon — UI walkthrough of all major flows

---

## 🤝 Contributing

This is a private project. Contributions are by invitation only.

---

## 📄 License

Private — All rights reserved © 2025 NovaPay

---

<div align="center">
  <strong>Built with ❤️ for Africa's financial inclusion</strong><br/>
  <sub>Empowering millions with accessible digital financial services</sub>
</div>
