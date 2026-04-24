# Task: Phase 6 - Neural Memory Mesh Implementation

### Goal
Establish a sovereign vector-based memory system for agents to store, retrieve, and share experiences, enabling cross-agent learning and task optimization.

### Memory Context
- **Searched Patterns:** `PersistenceEngine` (JSONL storage), `NeuralMemoryMesh` (Blackboard pattern).
- **Relevant Namespaces:** `core/brain`, `core/identity`.

### Why now
To move from reactive agents to learning agents. Memory is the foundation of long-term ROI optimization in the Agent Economy.

### Scope
- `/core/brain` - Memory logic and vector search.
- `/core/engine` - Orchestration integration.

### Out of scope
- Distributed database clusters (keeping it local/sovereign for now).
- External vector DB dependencies (e.g., Pinecone).

### Risks / Ambiguities / Fragility
- Performance of local vector search as memory grows.
- Embedding cost/latency if using Gemini for every insight.

### Plan
1. [ ] **Step 1: Vector Store**: Create `core/brain/vector-store.ts` with cosine similarity logic.
2. [ ] **Step 2: Embedding Integration**: Connect to Gemini for generating embeddings of insights.
3. [ ] **Step 3: Mesh Upgrade**: Update `NeuralMemoryMesh` to index insights into the vector store.
4. [ ] **Step 4: Orchestration Loop**: Modify `MASOrchestrator` to retrieve relevant memories before planning.
5. [ ] **Step 5: Verification**: Run `scratch/test-neural-memory.ts` to verify retrieval accuracy.

### Verification
- [ ] 2x `search-memory` calls executed before coding
- [ ] typecheck (`npx tsc --noEmit`)
- [ ] build (`npm run build`)
- [ ] Targeted test: `scratch/test-neural-memory.ts`
- [ ] 1x `add-memory` call executed

### Done when
- An agent can retrieve a "similar" past experience to solve a new goal.
- Memory persists across system restarts.

### Commit format
`feat(brain): implement neural vector memory mesh`
