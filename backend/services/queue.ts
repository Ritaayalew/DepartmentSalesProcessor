import Queue from 'bull';
import { processCSVFile } from './csvProcessor';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const csvQueue = new Queue('csv-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD,
  },
});

console.log('Initialized csvQueue:', csvQueue.name);

export async function addToQueue(inputPath: string): Promise<string> {
  const jobId = uuidv4(); // Generate unique jobId
  console.log(`Adding job ${jobId} with input: ${inputPath}`);
  try {
    const job = await csvQueue.add({ inputPath, jobId }, { jobId }); // Use custom jobId
    console.log(`Job added with ID: ${job.id}`);
    return job.id as string;
  } catch (err) {
    console.error(`Failed to add job ${jobId}:`, err);
    throw err;
  }
}

csvQueue.process(async (job) => {
  const { inputPath, jobId } = job.data;
  console.log(`Processing job ${jobId} with input: ${inputPath}`);
  try {
    const result = await processCSVFile(inputPath, jobId);
    console.log(`Job ${jobId} completed with output: ${result.filePath}`);
    return result;
  } catch (err) {
    console.error(`Job ${jobId} failed:`, err);
    throw err;
  }
});

csvQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

csvQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed with error:`, error);
});

export async function getJobResult(jobId: string): Promise<{ filePath: string; outputFilePath?: string; metrics?: { processingTime: number; departmentCount: number } } | null> {
  try {
    const job = await csvQueue.getJob(jobId);
    if (!job) {
      console.log(`Job ${jobId} not found`);
      return null;
    }

    const state = await job.getState();
    console.log(`Job ${jobId} state: ${state}`);

    if (state === 'completed') {
      const result = job.returnvalue;
      console.log(`getJobResult for ${jobId}:`, result);
      return {
        filePath: job.data.inputPath,
        outputFilePath: result?.filePath,
        metrics: result?.metrics
      };
    }

    console.log(`Job ${jobId} not completed yet (state: ${state})`);
    return null;
  } catch (err) {
    console.error(`Error retrieving job ${jobId}:`, err);
    return null;
  }
}








// // mock integration test with hardcoded job id

// import { processCSVFile } from './csvProcessor';

// export async function addToQueue(inputPath: string): Promise<string> {
//   // Run the CSV processor immediately and save path for retrieval
//   const result = await processCSVFile(inputPath);

//   // Save this result in memory (mock job store)
//   mockJobStore['mock-job-12345'] = result;

//   return 'mock-job-12345';
// }

// const mockJobStore: Record<string, any> = {};

// export async function getJobResult(jobId: string): Promise<any> {
//   return mockJobStore[jobId] || null;
// }