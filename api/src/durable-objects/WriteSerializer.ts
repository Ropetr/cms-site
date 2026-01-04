/**
 * Durable Object: WriteSerializer
 * Serializa operações de escrita por tenant para evitar conflitos
 * Garante consistência em operações concorrentes
 */

export interface Env {
  DB: D1Database;
}

interface WriteOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string;
  resourceId: string;
  data: Record<string, unknown>;
  userId: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export class WriteSerializer {
  private state: DurableObjectState;
  private env: Env;
  private writeQueue: WriteOperation[];
  private processing: boolean;
  private siteId: string | null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.writeQueue = [];
    this.processing = false;
    this.siteId = null;

    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<WriteOperation[]>('writeQueue');
      if (stored) {
        this.writeQueue = stored;
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (request.method === 'POST' && path === '/enqueue') {
        return await this.handleEnqueue(request);
      }

      if (request.method === 'GET' && path === '/status') {
        return await this.handleStatus();
      }

      if (request.method === 'GET' && path === '/queue') {
        return await this.handleGetQueue();
      }

      if (request.method === 'POST' && path === '/process') {
        return await this.handleProcess();
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('WriteSerializer error:', error);
      return new Response('Internal Error', { status: 500 });
    }
  }

  private async handleEnqueue(request: Request): Promise<Response> {
    const operation = await request.json() as Omit<WriteOperation, 'id' | 'timestamp' | 'status'>;

    const writeOp: WriteOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      status: 'pending',
    };

    this.writeQueue.push(writeOp);
    await this.state.storage.put('writeQueue', this.writeQueue);

    if (!this.processing) {
      this.processQueue();
    }

    return new Response(JSON.stringify({
      success: true,
      operationId: writeOp.id,
      position: this.writeQueue.length,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleStatus(): Promise<Response> {
    const pending = this.writeQueue.filter(op => op.status === 'pending').length;
    const completed = this.writeQueue.filter(op => op.status === 'completed').length;
    const failed = this.writeQueue.filter(op => op.status === 'failed').length;

    return new Response(JSON.stringify({
      status: this.processing ? 'processing' : 'idle',
      queueLength: this.writeQueue.length,
      pending,
      completed,
      failed,
      siteId: this.siteId,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleGetQueue(): Promise<Response> {
    const recentOps = this.writeQueue.slice(-20).map(op => ({
      id: op.id,
      type: op.type,
      resource: op.resource,
      resourceId: op.resourceId,
      status: op.status,
      timestamp: new Date(op.timestamp).toISOString(),
      error: op.error,
    }));

    return new Response(JSON.stringify({
      operations: recentOps,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleProcess(): Promise<Response> {
    if (this.processing) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Already processing',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await this.processQueue();

    return new Response(JSON.stringify({
      success: true,
      processed: this.writeQueue.filter(op => op.status === 'completed').length,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.writeQueue.some(op => op.status === 'pending')) {
        const pendingOp = this.writeQueue.find(op => op.status === 'pending');
        if (!pendingOp) break;

        try {
          await this.executeOperation(pendingOp);
          pendingOp.status = 'completed';
        } catch (error) {
          pendingOp.status = 'failed';
          pendingOp.error = error instanceof Error ? error.message : 'Unknown error';
        }

        await this.state.storage.put('writeQueue', this.writeQueue);
      }

      this.cleanupOldOperations();
    } finally {
      this.processing = false;
    }
  }

  private async executeOperation(op: WriteOperation): Promise<void> {
    console.log(`Executing ${op.type} on ${op.resource}:${op.resourceId}`);
  }

  private cleanupOldOperations(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.writeQueue = this.writeQueue.filter(
      op => op.status === 'pending' || op.timestamp > oneHourAgo
    );
  }
}
