/**
 * NEXUS OS Job Simulator Service (v82.5)
 * Coordinates, tracks, and processes asynchronous mock rendering jobs for GPU-bound workflows.
 */

export interface RenderJob {
  id: string;
  projectName: string;
  engine: "kling" | "runway" | "midjourney" | "flux";
  status: "QUEUED" | "ANIMATING" | "POST_PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  stepsTotal: number;
  stepsCompleted: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  renderedVideoUrl?: string;
}

const activeJobsStore: Map<string, RenderJob> = new Map();

export class JobSimulatorService {
  /**
   * Submits a fresh mock rendering transaction
   */
  public static createJob(projectName: string, engine: RenderJob["engine"]): RenderJob {
    const newJob: RenderJob = {
      id: `job_tx_${Math.random().toString(36).substr(2, 9)}`,
      projectName,
      engine,
      status: "QUEUED",
      progress: 0,
      stepsTotal: 120,
      stepsCompleted: 0,
      createdAt: new Date().toISOString()
    };
    
    activeJobsStore.set(newJob.id, newJob);
    return newJob;
  }

  /**
   * Retrieves status of a submitted pipeline transaction
   */
  public static getJob(id: string): RenderJob | undefined {
    return activeJobsStore.get(id);
  }

  /**
   * Steps the rendering pipeline forward Mock progress logic
   */
  public static simulateProgress(id: string): RenderJob | undefined {
    const job = activeJobsStore.get(id);
    if (!job) return undefined;

    if (job.status === "COMPLETED" || job.status === "FAILED") {
      return job;
    }

    const nextCompleted = Math.min(job.stepsTotal, job.stepsCompleted + Math.floor(Math.random() * 20) + 10);
    job.stepsCompleted = nextCompleted;
    job.progress = Math.round((nextCompleted / job.stepsTotal) * 100);

    if (job.stepsCompleted >= job.stepsTotal) {
      job.status = "COMPLETED";
      job.progress = 100;
      job.completedAt = new Date().toISOString();
      job.renderedVideoUrl = `/assets/renders/synthetic_cinematic_${job.id}.mp4`;
    } else if (job.progress > 70) {
      job.status = "POST_PROCESSING";
    } else if (job.progress > 0) {
      job.status = "ANIMATING";
    }

    activeJobsStore.set(id, job);
    return job;
  }

  /**
   * Drops list of all processed sequences
   */
  public static getAllJobs(): RenderJob[] {
    return Array.from(activeJobsStore.values());
  }

  /**
   * Flushes simulator cache
   */
  public static resetStore(): void {
    activeJobsStore.clear();
  }
}
