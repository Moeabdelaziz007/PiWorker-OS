# Task: Architectural Alignment and Hardening Strategy

### Goal
حل "التنافر المعماري" و "تفكك المستودع الأحادى" (Monorepo Desync) عبر تحويل المحرك إلى نمط عديم الحالة (Stateless)، وتوحيد لغة العقود بين TypeScript و Go، وتعزيز عزل بيئة العميل عن الخادم.

### Memory Context
- **Searched Patterns:**
  - تم اكتشاف عدم تطابق في تسمية الحقول بين Zod (camelCase) و Protobuf (snake_case/different names)؛ مثال: `parallelInstances` vs `instances`.
  - تم فحص `package.json`؛ يفتقر إلى `workspaces` مما يضعف التنسيق بين المكونات.
  - تم فحص `pi-auth.ts`؛ يعتمد على سياق المتصفح بشكل جيد ولكنه يفتقر إلى عزل صارم للأسرار البرمجية.
- **Relevant Namespaces:** `/sidecar`, `/core/contracts`, `/core/finance`.

### Why now
التناقض في تسمية الحقول يؤدي إلى أخطاء صامتة (Silent Failures) في استدعاءات gRPC/HTTP. غياب هيكلية Monorepo حقيقية يجعل أنابيب CI هشة وغير قابلة للتوسع.

### Scope
- `package.json` (إضافة workspaces).
- `core/contracts/critical-contracts.ts` (مزامنة التسميات مع Proto).
- `sidecar/sovereign-engine/pkg/server/server.go` (تحويل مسارات البيانات إلى `/tmp`).
- `SovereignBridge.ts` (تأكيد مسارات الـ API وتوافق الحقول).

### Out of scope
- تغيير بروتوكول gRPC في بيئة التطوير المحلية (Local Dev).

### Risks / Ambiguities / Fragility
- **الخطر:** كسر التوافق مع الأنظمة الخارجية إذا تم تغيير أسماء الحقول دون تحديث كافة المراجع.
- **الغموض:** هل نعتمد TurboRepo كحل نهائي لإدارة البناء؟

### Plan
1. [Step 1: Monorepo Hardening] إضافة `workspaces` إلى `package.json` لتشمل `core`, `sidecar`, `agents`.
2. [Step 2: Contract Synchronization] توحيد تسميات الحقول في `critical-contracts.ts` لتطابق `sovereign.proto` (استخدام camelCase في TS مع التحويل المناسب أو مطابقة Proto).
3. [Step 3: Stateless Adaptation] تحويل المحرك السيادي لاستخدام `/tmp` في Vercel وتأمين المتغيرات البيئية السرية.
4. [Step 4: Bridge Logic Update] تحديث `SovereignBridge.ts` ليتعامل مع التسميات الجديدة ويوجه الطلبات بدقة إلى `/api/sovereign/*`.

### Verification
- [x] 2x `search-memory` calls executed before coding
- [ ] typecheck (`npx tsc --noEmit`)
- [ ] build (`npm run build`)
- [ ] targeted test
- [ ] sandbox security boundary review
- [x] 1x `add-memory` call executed (with Git metadata) and `openmemory.md` updated if applicable

### Done when
- ينجح أمر `npm run build` مع وجود مزامنة كاملة بين Zod و Protobuf.
- يتم تشغيل المحرك السيادي في بيئة Vercel المحاكية بنجاح.

### Commit format
`refactor(arch): harmonize contracts and harden monorepo structure`
