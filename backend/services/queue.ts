import Queue from 'bull';
import { processCSVFile } from './csvProcessor';

const csvQueue = new Queue('csv-processing', {
  redis: { host: 'localhost', port: 6379 }
});

//&Yt3!pxQ9v*sN12z

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
  return job?.returnvalue || null;
}