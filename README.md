# 🌌 PiWorker-OS — نظام الوكلاء السيادي | The Sovereign Agent OS

<div align="center">

<img src="https://img.shields.io/badge/Status-Alpha%20Sovereign-39FF14?style=for-the-badge&logoColor=black" alt="Status"/>
<img src="https://img.shields.io/badge/Engine-Go%201.25-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go"/>
<img src="https://img.shields.io/badge/UI-Next.js%2015-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js"/>
<img src="https://img.shields.io/badge/AI-Gemini%201.5%20Pro-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Gemini"/>
<img src="https://img.shields.io/badge/Language-TypeScript%2062%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
<img src="https://img.shields.io/badge/Backend-Go%2026%25-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go"/>

</div>

---

## 🇸🇦 النسخة العربية | Arabic Version

### ما هو PiWorker-OS؟

**PiWorker-OS** هو نظام تشغيل للوكلاء الذكيين المستقلين، مصمم خصيصاً للعمل داخل بيئة **Pi Network**. النظام يجمع بين ثلاث طبقات تقنية متكاملة:

1. **واجهة المستخدم** — لوحة تحكم سيادية مبنية بـ Next.js 15 (React 19) بأسلوب بصري Cyberpunk
2. **المحرك الخلفي (Sidecar)** — موتور عالي الأداء مكتوب بـ Go يدير المعاملات المالية والوكلاء
3. **نظام الوكلاء (MAS-ZERO)** — إطار عمل للوكلاء المتعددين Multi-Agent System

النظام الحقيقي هو **منصة تشغيل وكلاء ذكية** تتصل بمحفظة Pi Network، تدير مهام الوكلاء، وتتعامل مع عمليات مالية آمنة باستخدام نظام Escrow مكتوب بـ Go.

---

### 🏗️ البنية التقنية الحقيقية

```
PiWorker-OS/
├── app/                          ← واجهة Next.js 15 (React 19)
│   ├── page.tsx                  ← لوحة القيادة الرئيسية (Sovereign Command Center)
│   ├── dashboard/                ← صفحات لوحة التحكم
│   ├── marketplace/              ← سوق المهام والمكافآت (Bounties)
│   ├── api/                      ← API Routes الخاصة بـ Next.js
│   ├── components/               ← مكونات الواجهة (UI Components)
│   │   ├── pi-provider.tsx       ← Provider للاتصال بـ Pi SDK
│   │   ├── WalletStatus.tsx      ← حالة المحفظة
│   │   └── visualizers/          ← مكونات العرض المرئي
│   ├── hooks/
│   │   └── use-sovereign-stream  ← Hook للاستماع للأحداث اللحظية
│   └── lib/                      ← المكتبات المساعدة
│
├── core/                         ← الـ Brain — منطق الحوكمة والذكاء
│   ├── governance-engine.ts      ← محرك الحوكمة + Betrayal Protocol
│   ├── agents/                   ← منطق الوكلاء (TypeScript)
│   ├── ai/                       ← تكامل Gemini AI
│   ├── brain/                    ← نظام الذاكرة والتفكير
│   ├── contracts/                ← العقود والاتفاقيات بين الوكلاء
│   ├── engine/                   ← المحرك الأساسي للمعالجة
│   ├── evolution/                ← نظام التطور الذاتي للوكلاء
│   ├── finance/                  ← pi-auth.ts والعمليات المالية
│   ├── identity/                 ← إدارة الهويات اللامركزية
│   ├── security/                 ← طبقة الأمان
│   └── skills/                   ← مهارات الوكلاء القابلة للتوسع
│
├── sidecar/                      ← المحرك العضلي — Go Backend
│   ├── sovereign-engine/         ← المحرك السيادي الرئيسي (Go)
│   ├── finance/
│   │   ├── escrow-manager.go     ← نظام الـ Escrow لإدارة Pi coins
│   │   ├── outcome-settlement.go ← تسوية المدفوعات بعد إنجاز المهام
│   │   └── soroban-bridge.go     ← جسر Soroban للعقود الذكية
│   ├── robotics/                 ← واجهة التحكم بالروبوتات (Physical Bridge)
│   ├── physical-bridge/          ← الجسر بين الرقمي والمادي
│   ├── diplomacy/                ← بروتوكولات التفاوض بين الوكلاء
│   └── military/                 ← بروتوكولات الأمان والدفاع
│
├── agents/
│   └── dna/
│       └── agent-manifest.schema.json  ← مخطط الـ DNA الخاص بكل وكيل
│
├── sandbox/                      ← بيئة العزل (Ring-3 Isolation)
├── plugins/                      ← نظام الإضافات القابل للتوسع
├── cmd/piworker/                 ← CLI الخاص بالنظام (Go)
├── api/                          ← تعريفات gRPC/Protobuf
├── scripts/                      ← سكريبتات البناء والتشغيل
└── docs/                         ← التوثيق المعماري
```

---

### 🧬 نظام الـ DNA للوكلاء

كل وكيل في النظام يحمل **DNA** فريد يتكون من:

| الحقل | الوصف |
|-------|--------|
| `chromosomes` | التعليمات الأساسية وبرمجة سلوك الوكيل |
| `mutations` | سجل التعديلات التي مر بها الوكيل |
| `fitnessScore` | درجة الأداء والعائد على الاستثمار (ROI) |
| `generation` | رقم الجيل التطوري للوكيل |
| `capabilities` | قائمة الصلاحيات (CBAC Permissions) |

الوكلاء الموجودون حالياً في الواجهة:
- 🟢 **CEO Orchestrator** — المنسق الرئيسي (Trust: 982/1000)
- 🟢 **Market Sniper** — وكيل المراقبة المالية (Trust: 845/1000)  
- 🟡 **SaaS Factory** — مصنع الخدمات (Trust: 520/1000)
- 🟢 **Bounty Hunter** — صائد المكافآت (Trust: 712/1000)

---

### 💰 نظام Escrow المالي (Go)

الجزء المالي في النظام حقيقي ومكتوب بـ Go بالكامل:

```go
// حجز Pi coins لمهمة وكيل معين
escrow.LockFunds(ctx, txID, agentID, amount)

// تحرير المبلغ بعد موافقة وكيل "Critic"
escrow.ReleaseFunds(txID)

// استعراض سجل معاملات وكيل محدد
escrow.AuditTrail(agentID)
```

حالات المعاملة: `PENDING → LOCKED → RELEASED / REFUNDED`

---

### 🛡️ Betrayal Protocol (بروتوكول الخيانة)

ميزة فريدة في `core/governance-engine.ts` — الوكيل يمكنه **رفض تنفيذ أمر المستخدم** إذا تعارض مع منطق النظام الاقتصادي:

```typescript
interface IBetrayalProtocol {
  evaluateDefiance(command, context): Promise<boolean>  // هل يُخان هذا الأمر؟
  justifyDefiance(command, risk): string                // تبرير قرار الخيانة
  proposeCounterPath(originalPath): Promise<string>     // اقتراح المسار الأمثل
}
```

---

### 🖥️ لوحة القيادة الرئيسية

الواجهة تعرض في الوقت الفعلي:
- **Sovereign Registry** — حالة كل وكيل ودرجة ثقته
- **Action Log** — سجل إجراءات الوكلاء موقّع بـ IBCT
- **Sovereign Vault** — محفظة Pi Network المتصلة
- **Open Bounties** — المهام المتاحة ومكافآتها
- **Robotic Fleet** — حالة الأسطول المادي
- **Micro-SaaS Fleet** — حالة البودات التقنية

---

### 🚀 تشغيل المشروع

**المتطلبات:**
- Node.js >= 22.x
- Go >= 1.25
- حساب Pi Network + API Key
- Gemini API Key

**خطوات التشغيل:**

```bash
# 1. استنساخ المشروع
git clone https://github.com/Moeabdelaziz007/PiWorker-OS.git
cd PiWorker-OS

# 2. إعداد متغيرات البيئة
cp .env.example .env
# أضف: GEMINI_API_KEY و PI_NETWORK_API_KEY

# 3. تثبيت الحزم
npm install

# 4. تشغيل الواجهة فقط
npm run dev

# 5. تشغيل الـ Stack الكامل (Next.js + Go Engine)
npm run dev:stack

# 6. بناء CLI الخاص بـ Go
npm run build:cli

# 7. تشغيل المحرك السيادي بـ Go
npm run forge
```

---

### 🔐 الأمان والعزل

| طبقة | الوصف |
|------|--------|
| **Ring-3 Isolation** (`sandbox/`) | عزل تنفيذ الوكلاء غير الموثوقين |
| **MPC Threshold (2/3)** | التوقيع متعدد الأطراف للعمليات الحساسة |
| **AIP-IBCT** | بروتوكول التحقق من سلامة الإجراءات |
| **Secret Lint** | فحص آلي للأسرار في الكود |
| **Husky Pre-commit** | إجراءات فحص قبل كل commit |

---

---

## 🇬🇧 English Version

### What is PiWorker-OS?

**PiWorker-OS** is a **Sovereign Multi-Agent Operating System** built specifically for the **Pi Network ecosystem**. It is a real, production-oriented platform — not just a concept — combining three integrated technical layers:

1. **Frontend Dashboard** — A cyberpunk-styled command center built with Next.js 15 and React 19
2. **Sidecar Engine (Go)** — A high-performance Go backend managing financial transactions and agent orchestration
3. **MAS-ZERO Protocol** — A Multi-Agent System framework with DNA-based agent identity and governance

---

### 🏗️ Real Architecture Overview

**Languages:** TypeScript (62.6%), Go (26.3%), JavaScript (8.7%), Shell (1.1%), Python (0.5%)

The system is a **monorepo** managed with npm workspaces containing 5 main packages: `core`, `agents`, `sidecar`, `sandbox`, and `plugins`.

```
PiWorker-OS/
├── app/              ← Next.js 15 UI (Sovereign Command Center)
├── core/             ← Brain: Governance, AI, Finance, Identity logic (TypeScript)
├── sidecar/          ← Muscle: Go Engine for finance, robotics, diplomacy
├── agents/dna/       ← Agent DNA schema & manifests (JSON Schema)
├── sandbox/          ← Ring-3 secure execution isolation
├── plugins/          ← Extensible plugin system
├── cmd/piworker/     ← Go CLI binary
└── api/              ← gRPC/Protobuf definitions
```

---

### 🧬 Agent DNA System

Every agent carries a unique **DNA manifest** defining:
- `chromosomes` — base logic and instruction prompts
- `mutations` — tracked changes and their performance impact
- `fitnessScore` — ROI-based performance score used for agent selection/hybridization
- `generation` — evolutionary generation number
- `capabilities` — CBAC permission list

Current agents in the system: **CEO Orchestrator**, **Market Sniper**, **SaaS Factory**, **Bounty Hunter** — each with a `did:piworker:...` decentralized identifier and a trust score out of 1000.

---

### 💰 Finance Engine (Go)

The financial system is fully implemented in Go:
- **Escrow Manager** — Locks Pi coins for agent tasks, releases upon Critic approval
- **Outcome Settlement** — Handles task completion payout logic
- **Soroban Bridge** — Integration bridge for Stellar/Soroban smart contracts

Transaction lifecycle: `PENDING → LOCKED → RELEASED / REFUNDED`

---

### 🛡️ Betrayal Protocol

A unique governance feature in `core/governance-engine.ts` — agents can **override user commands** if they violate economic constraints:

```typescript
// Agent evaluates if a command should be refused
evaluateDefiance(command, economicContext): Promise<boolean>

// Justification for the override decision
justifyDefiance(command, riskLevel): string

// Proposes an alternative optimal path
proposeCounterPath(originalPath): Promise<string>
```

---

### 🖥️ Sovereign Command Center (Dashboard)

The main `app/page.tsx` renders a real-time dashboard showing:
- **Sovereign Registry** — Live agent status with DNA fitness scores
- **IBCT-Signed Action Log** — Tamper-evident agent activity feed
- **Sovereign Vault** — Live Pi wallet connection via Pi SDK
- **Open Bounties** — Claimable task marketplace
- **Robotic Fleet Status** — Physical agent fleet monitoring
- **Live Economy Stream** — Real-time financial event feed

---

### 🚀 Quick Start

```bash
# Clone
git clone https://github.com/Moeabdelaziz007/PiWorker-OS.git
cd PiWorker-OS

# Configure
cp .env.example .env
# Set: GEMINI_API_KEY, PI_NETWORK_API_KEY

# Install
npm install

# Run frontend only
npm run dev

# Run full stack (Next.js + Go Sidecar)
npm run dev:stack

# Build Go CLI
npm run build:cli

# Run Go sovereign engine
npm run forge
```

---

### 🔐 Security Architecture

| Layer | Description |
|-------|-------------|
| **Ring-3 Isolation** | Sandboxed execution for untrusted agent code |
| **MPC 2-of-3 Threshold** | Multi-party signing for sensitive operations |
| **AIP-IBCT Protocol** | Intent-Based Contract Trust verification |
| **Husky + Secretlint** | Pre-commit secret scanning & code quality |
| **Playwright E2E Tests** | Automated end-to-end testing suite |

---

### 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 15, React 19, Tailwind CSS 4, Framer Motion |
| **Backend Engine** | Go 1.25 (gRPC, Protobuf via Buf) |
| **AI Oracle** | Google Gemini 1.5 Pro (`@google/generative-ai`) |
| **Finance** | Pi Network SDK, Soroban Bridge, Upstash Redis |
| **Validation** | Zod, JSON Schema |
| **Deployment** | Vercel (frontend), Docker (sidecar engine) |
| **Testing** | Playwright E2E |
| **CI/CD** | GitHub Actions, Husky, lint-staged |

---

<div align="center">
  <sub>Built by <b>Amrikyy Lab</b> — Sovereign AI for the Pi Network Economy</sub>
  <br/>
  <sub><i>Technical Sovereignty is the foundation of the Agentic Future.</i></sub>
</div>
