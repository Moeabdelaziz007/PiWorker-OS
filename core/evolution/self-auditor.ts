import { SovereignAIOrchestrator } from '../ai/orchestrator';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 🧬 SELF-EVOLUTION AUDITOR
 * Role: MAS-ZERO capability for autonomous code quality and security auditing.
 * Logic: Uses Gemini 3.1 Pro to analyze files and propose patches.
 */
export class SelfEvolutionAuditor {
  private orchestrator = SovereignAIOrchestrator.getInstance();

  async auditFile(filePath: string): Promise<string> {
    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`[EVO_ERROR] File not found: ${filePath}`);
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const systemPrompt = `You are MAS-ZERO, the Sovereign Architect of PiWorker-OS. 
    Analyze the provided source code for:
    1. Security vulnerabilities (Ring-3 isolation breaches).
    2. Performance bottlenecks.
    3. Missing "Zero-Mock" E2E realism.
    Provide a concise report and suggest a git-style diff for improvements.`;

    const response = await this.orchestrator.dispatch(
      `File: ${filePath}\n\nContent:\n${content}`,
      {
        priority: 'strategic',
        systemPrompt: systemPrompt
      }
    );

    return response.content;
  }

  async auditCore(): Promise<Record<string, string>> {
    const coreFiles = [
      'core/engine/sovereign-bridge.ts',
      'sidecar/sovereign-engine/pkg/sandbox/js_engine.go',
      'core/identity/axiomid-resolver.ts'
    ];

    const results: Record<string, string> = {};
    for (const file of coreFiles) {
      console.log(`🧬 [Evolution] Auditing ${file}...`);
      results[file] = await this.auditFile(file);
    }

    return results;
  }
}
