import Queue from 'bull';
import { processCSVFile } from './csvProcessor';
import dotenv from 'dotenv';

dotenv.config();


const csvQueue = new Queue('csv-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD,
  },
});


console.log(csvQueue);


export async function addToQueue(inputPath: string): Promise<string> {
  const job = await csvQueue.add({ inputPath });
  return job.id as string;
}
csvQueue.process(async (job) => {
  const { inputPath } = job.data;
  const result = await processCSVFile(inputPath);
  return result;
});


export async function getJobResult(jobId: string): Promise<any> {
  const job = await csvQueue.getJob(jobId);
  if (!job) return { error: "Job not found" };

  const jobData = job.data;
  const result = job.returnvalue || { error: "Job not completed yet" };

  return { ...result, expectedFilePath: jobData.expectedFilePath };
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