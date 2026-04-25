// PathResolver (Isomorphic)

/**
 * AMRIKYY LAB :: SOVEREIGN PATH RESOLVER
 * PURPOSE: Provides absolute path resolution that works across:
 * 1. Local Development (The Forge)
 * 2. Vercel Serverless Functions
 * 3. Go-Next Hybrid Runtimes
 */

export class PathResolver {
  private static root = process.cwd();

  /**
   * Resolves a path relative to the project root.
   * Ensures consistency between local and cloud environments.
   */
  public static resolve(relativePath: string): string {
    if (typeof window !== 'undefined') return relativePath;
    // Use dynamic import or gated require to prevent browser bundling issues
    const path = require('path');
    return path.join(process.cwd(), relativePath);
  }


  /**
   * Specialized resolver for Proto files.
   */
  public static getProtoPath(): string {
    return this.resolve('sidecar/sovereign-engine/proto/sovereign.proto');
  }

  /**
   * Specialized resolver for Security Certificates.
   */
  public static getCertPath(certName: string): string {
    return this.resolve(`infra/certs/${certName}`);
  }
}
