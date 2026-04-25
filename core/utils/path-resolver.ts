import "server-only";
import path from "node:path";

// PathResolver (Server-Only)

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
