import { SovereignBridge } from "../core/engine/sovereign-bridge";

/**
 * Ring 3: Neural-Isolated Sandbox Engine
 * Responsible for the secure execution of untrusted plugin code.
 * Delegated to the Go Sovereign Engine for process-level isolation.
 */
export class SandboxExecutor {
  /**
   * Executes a plugin source code within the Go-based sovereign sandbox.
   * This provides Ring 3 protection against memory leaks and unauthorized access.
   */
  public static async executePluginSource(
    pluginId: string,
    sourceCode: string,
    envVars: Record<string, string> = {},
    allowedCapabilities: string[] = []
  ): Promise<any> {
    console.log(`🛡️ [Sandbox] Requesting Isolated Execution for: ${pluginId}`);
    
    // SECURITY: Ring 2 (Capability-Based) pre-flight check
    if (allowedCapabilities.includes("NATIVE_FS_ACCESS")) {
        throw new Error(`[SECURITY_VIOLATION] Plugin ${pluginId} requested forbidden capability: NATIVE_FS_ACCESS`);
    }

    try {
      const response = await SovereignBridge.executePlugin({
        pluginId,
        sourceCode,
        envVars,
        allowedCapabilities
      });

      if (!response.success) {
        throw new Error(`[SANDBOX_ERROR] ${response.errorMessage}`);
      }

      // Parse the JSON output from the Go engine
      return JSON.parse(response.outputJson);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "UNKNOWN_EXECUTION_FAILURE";
      console.error(`❌ [Sandbox] Neural Isolation Failure in ${pluginId}:`, msg);
      throw error;
    }
  }

  /**
   * Legacy method for logical isolation (use executePluginSource for untrusted code).
   */
  public static async executeScopedTask(
    pluginId: string,
    task: () => Promise<any>,
    allowedCapabilities: string[]
  ): Promise<any> {
    console.warn(`⚠️ [Sandbox] Using Legacy Logical Isolation for ${pluginId}. Not secure against memory exploits.`);
    const result = await task();
    return result;
  }
}
