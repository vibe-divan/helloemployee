import { Queue, Worker } from "bunqueue/client";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { runAnalysis, runGeneration } from "../tasks";

export const DOCUMENT_QUEUE_NAME = "document-processing";

export interface DocumentJobData {
  sessionId: string;
}

export type DocumentJobName = "analyze" | "generate";

let queue: Queue<DocumentJobData> | undefined;
let worker: Worker<DocumentJobData> | undefined;

function getQueue(): Queue<DocumentJobData> {
  queue ??= new Queue<DocumentJobData>(DOCUMENT_QUEUE_NAME, {
    embedded: true,
    dataPath: env.QUEUE_DB_PATH,
  });
  return queue;
}

/** Starts the embedded worker (idempotent). Runs in the process that enqueues. */
export function startDocumentWorker(): void {
  if (worker) {
    return;
  }

  worker = new Worker<DocumentJobData>(
    DOCUMENT_QUEUE_NAME,
    async (job) => {
      if (job.name === "analyze") {
        await runAnalysis(job.data.sessionId);
        return { sessionId: job.data.sessionId };
      }
      if (job.name === "generate") {
        await runGeneration(job.data.sessionId);
        return { sessionId: job.data.sessionId };
      }
      throw new Error(`Неизвестная задача: ${job.name}`);
    },
    { embedded: true, dataPath: env.QUEUE_DB_PATH, concurrency: 2 },
  );

  worker.on("failed", (job, error) => {
    const reason = error instanceof Error ? error.message : String(error);
    log.warn(`Задача "${job?.name ?? "?"}" завершилась ошибкой: ${reason}`);
  });
}

export async function enqueueDocumentJob(name: DocumentJobName, sessionId: string): Promise<void> {
  startDocumentWorker();
  await getQueue().add(name, { sessionId });
}
