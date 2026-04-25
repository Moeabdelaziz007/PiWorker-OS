import { SovereignBridge } from "../core/engine/sovereign-bridge";

/**
 * Ring 3+: Advanced Neural Isolation (isolated-vm)
 * Provides memory-level isolation for high-risk plugin execution.
 * Falls back to Sovereign Engine (Go/Otto) if isolated-vm is unavailable.
 */
export class IsolatedExecutor {
  private static ivm: any = null;

  private static async getIvm() {
    if (this.ivm) return this.ivm;
    try {
      this.ivm = await import("isolated-vm");
      return this.ivm;
    } catch (e) {
      console.warn("⚠️ [Sandbox] isolated-vm not found. Falling back to Sovereign Engine isolation.");
      return null;
    }
  }

  /**
   * Executes code with the highest possible isolation level.
   */
  public static async execute(
    pluginId: string,
    code: string,
    envVars: Record<string, string> = {},
    timeoutMs: number = 5000
  ): Promise<any> {
    const ivm = await this.getIvm();

    if (ivm) {
      console.log(`🛡️ [Sandbox] Ring 3+ Isolation (ivm) for: ${pluginId}`);
      const isolate = new ivm.Isolate({ memoryLimit: 128 });
      const context = await isolate.createContext();
      const jail = context.global;

      // Setup secure bridge for logs/data
      await jail.set("global", jail.derefInto());
      await jail.set("_env", new ivm.ExternalCopy(envVars).copyInto());
      
      const script = await isolate.compileScript(code);
      const result = await script.run(context, { timeout: timeoutMs });
      
      isolate.dispose();
      return result;
    }

    // Fallback to Go Sovereign Engine
    console.log(`🛡️ [Sandbox] Falling back to Ring 3 Isolation (Go/Otto) for: ${pluginId}`);
    return SovereignBridge.executePlugin({
      pluginId,
      sourceCode: code,
      envVars,
      allowedCapabilities: []
    });
  }
}
