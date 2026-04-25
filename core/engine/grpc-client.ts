import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { PathResolver } from '../utils/path-resolver';

let client: any = null;

export function getGrpcClient(engineUrl: string) {
  if (typeof window !== 'undefined') return null;
  
  if (!client) {
    try {
      const PROTO_PATH = PathResolver.getProtoPath();
      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: false,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      });
      const sovereignProto = (grpc.loadPackageDefinition(packageDefinition) as any).sovereign;
      const insecureCreds = grpc.credentials.createInsecure();

      client = new sovereignProto.SovereignService(
        engineUrl,
        insecureCreds, 
        {
          "grpc.primary_user_agent": "PiWorker-Orchestrator/2.0",
          "grpc.default_authority": "axiev.org"
        }
      );
    } catch (e: any) {
      console.warn(`⚠️ [GrpcClient] Initialization failed: ${e.message}`);
      return null;
    }
  }
  return client;
}

export function createMetadata(token: string, correlationId?: string, requestId?: string): grpc.Metadata {
  const metadata = new grpc.Metadata();
  metadata.add('x-sovereign-token', token);

  if (correlationId) metadata.add('x-correlation-id', correlationId);
  if (requestId) metadata.add('x-request-id', requestId);

  return metadata;
}
