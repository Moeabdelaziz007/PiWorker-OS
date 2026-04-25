let fs: any = null;
let grpc: any = null;
let protoLoader: any = null;

async function loadGrpcDeps() {
  if (grpc) return;
  fs = await import('node:fs');
  grpc = await import('@grpc/grpc-js');
  protoLoader = await import('@grpc/proto-loader');
}

import { PathResolver } from '../utils/path-resolver';

const STARTUP_MAX_RETRIES = Number.parseInt(process.env.SOVEREIGN_GRPC_STARTUP_RETRIES || '6', 10);
const STARTUP_BASE_DELAY_MS = Number.parseInt(process.env.SOVEREIGN_GRPC_STARTUP_BASE_DELAY_MS || '250', 10);
const STARTUP_READY_TIMEOUT_MS = Number.parseInt(process.env.SOVEREIGN_GRPC_READY_TIMEOUT_MS || '1200', 10);

let client: any = null;
let clientInitPromise: Promise<any | null> | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function assertProtoContractAvailable(): Promise<string> {
  await loadGrpcDeps();
  const protoPath = PathResolver.getProtoPath();
  if (!fs.existsSync(protoPath)) {
    throw new Error(`[CONTRACT_UNAVAILABLE] Proto contract missing at ${protoPath}`);
  }
  return protoPath;
}


async function buildClient(engineUrl: string) {
  const PROTO_PATH = await assertProtoContractAvailable();
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const sovereignProto = (grpc.loadPackageDefinition(packageDefinition) as any).sovereign;
  const insecureCreds = grpc.credentials.createInsecure();

  return new sovereignProto.SovereignService(engineUrl, insecureCreds, {
    'grpc.primary_user_agent': 'PiWorker-Orchestrator/2.0',
    'grpc.default_authority': 'axiev.org',
  });
}


function waitForReadyWithTimeout(grpcClient: any): Promise<void> {
  return new Promise((resolve, reject) => {
    grpcClient.waitForReady(Date.now() + STARTUP_READY_TIMEOUT_MS, (error: Error | null) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function initializeClient(engineUrl: string): Promise<any | null> {
  if (typeof window !== 'undefined') return null;

  const grpcClient = await buildClient(engineUrl);


  for (let attempt = 1; attempt <= STARTUP_MAX_RETRIES; attempt += 1) {
    try {
      await waitForReadyWithTimeout(grpcClient);
      return grpcClient;
    } catch (error: any) {
      const waitMs = STARTUP_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      const isLastAttempt = attempt === STARTUP_MAX_RETRIES;
      console.warn(
        `⚠️ [GrpcClient] Sidecar not ready (attempt ${attempt}/${STARTUP_MAX_RETRIES}): ${error.message}`
      );

      if (isLastAttempt) {
        grpcClient.close();
        throw new Error(
          `[GRPC_STARTUP_FAILED] Sidecar did not become ready after ${STARTUP_MAX_RETRIES} attempts`
        );
      }

      await sleep(waitMs);
    }
  }

  return null;
}

export async function getGrpcClient(engineUrl: string) {
  if (typeof window !== 'undefined') return null;

  if (client) return client;

  if (!clientInitPromise) {
    clientInitPromise = initializeClient(engineUrl)
      .then((initializedClient) => {
        client = initializedClient;
        return initializedClient;
      })
      .catch((error) => {
        client = null;
        throw error;
      })
      .finally(() => {
        clientInitPromise = null;
      });
  }

  try {
    return await clientInitPromise;
  } catch (e: any) {
    console.warn(`⚠️ [GrpcClient] Initialization failed: ${e.message}`);
    return null;
  }
}

export async function createMetadata(token: string, correlationId?: string, requestId?: string): Promise<any> {
  await loadGrpcDeps();
  const metadata = new grpc.Metadata();

  metadata.add('x-sovereign-token', token);

  if (correlationId) metadata.add('x-correlation-id', correlationId);
  if (requestId) metadata.add('x-request-id', requestId);

  return metadata;
}
