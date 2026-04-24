import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/**
 * AIX SOVEREIGN FOUNDRY
 * Format: .aix (Artificial Intelligence eXecutable)
 * Mission: Package high-ROI agents into tradable assets.
 */
export interface AixPackage {
  header: {
    id: string;
    name: string;
    version: string;
    architect: string;
    signature: string;
  };
  dna: {
    specialization: string;
    skills: string[];
    basePrice: number;
  };
  config: {
    sandboxLimits: object;
    neuralWeightHash: string;
  };
}

export class AixFoundry {
  private static ASSET_DIR = path.join(process.cwd(), "marketplace/assets");

  /**
   * Compiles an active agent instance into a .aix package.
   * Only proceeds if the agent has demonstrated positive ROI.
   */
  static async compile(agent: any, pricePi: number): Promise<string | null> {
    const roi = agent.totalProfit / (agent.piBudget || 1);
    
    if (roi < 1.5) {
      console.log(`[META-FOUNDRY] Skipping compilation for ${agent.agentId}: ROI too low (${roi.toFixed(2)}x)`);
      return null;
    }

    const fileName = `${agent.specialization.toLowerCase()}_${crypto.randomBytes(2).toString("hex")}.aix`;
    const filePath = path.join(this.ASSET_DIR, fileName);

    const aixPackage: AixPackage = {
      header: {
        id: agent.agentId,
        name: `${agent.specialization} Sovereign Agent`,
        version: "1.0.0",
        architect: "AMRIKYY_LAB_MAS_ZERO",
        signature: `SIG_AIX_${crypto.randomBytes(8).toString("hex")}`
      },
      dna: {
        specialization: agent.specialization,
        skills: agent.skills || ["DEFAULT_EXECUTION"],
        basePrice: pricePi
      },
      config: {
        sandboxLimits: { cpu: "medium", memory: "1gb" },
        neuralWeightHash: crypto.createHash("sha256").update(JSON.stringify(agent)).digest("hex")
      }
    };

    await fs.mkdir(this.ASSET_DIR, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(aixPackage, null, 2));

    console.log(`\x1b[1m\x1b[35m--- [META-FOUNDRY] NEW AIX ASSET COMPILED: ${fileName} | LISTING PRICE: ${pricePi} PI ---\x1b[0m`);
    
    return fileName;
  }

  /**
   * Lists all available .aix assets in the marketplace.
   */
  static async listAssets(): Promise<AixPackage[]> {
    try {
      const files = await fs.readdir(this.ASSET_DIR);
      const aixFiles = files.filter(f => f.endsWith(".aix"));
      
      const packages = await Promise.all(
        aixFiles.map(async f => {
          const content = await fs.readFile(path.join(this.ASSET_DIR, f), "utf-8");
          return JSON.parse(content);
        })
      );
      
      return packages;
    } catch (error) {
      return [];
    }
  }
}
