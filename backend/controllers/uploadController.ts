import { Request, Response } from 'express';
import { addToQueue, getJobResult } from '../services/queue';
import path from 'path';
import fs from 'fs/promises';

export async function processCSV(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      console.log('No file uploaded');
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const inputPath = req.file.path;
    console.log(`Received file: ${inputPath}`);
    const jobId = await addToQueue(inputPath);
    console.log(`Queued job: ${jobId}`);

    res.json({
      message: 'File queued for processing',
      jobId
    });
  } catch (error: any) {
    console.error('Failed to queue file:', error.message || error);
    res.status(500).json({ error: 'Failed to queue file' });
  }
}

export async function checkJobStatus(req: Request, res: Response): Promise<void> {
  try {
    const jobId = req.params.jobId;
    console.log(`Checking status for job: ${jobId}`);
    const result = await getJobResult(jobId);
    console.log(`getJobResult returned:`, result);

    if (!result) {
      console.log(`Job ${jobId} not found or not complete`);
      res.status(202).json({ status: 'processing', message: 'Processing not complete' });
      return;
    }

    const resultsDir = path.join(__dirname, '../../results');
    console.log(`Current __dirname: ${__dirname}`);
    console.log(`Resolved results directory: ${resultsDir}`);
    let outputFilePath = result.outputFilePath || path.join(resultsDir, `${jobId}_output.csv`);
    console.log(`Checking output file: ${outputFilePath}`);

    try {
      await fs.access(outputFilePath);
      console.log(`Output file exists: ${outputFilePath}`);
    } catch (err: any) {
      console.error(`Output file not found: ${outputFilePath}`);
      try {
        const files = await fs.readdir(resultsDir);
        console.log(`Files in results directory: ${files.join(', ')}`);
        const matchingFile = files.find(file => file.startsWith(jobId));
        if (matchingFile) {
          outputFilePath = path.join(resultsDir, matchingFile);
          console.log(`Found matching file: ${outputFilePath}`);
        } else {
          console.log(`No matching file found for job ${jobId}`);
          res.status(202).json({ status: 'processing', message: 'Processing not complete' });
          return;
        }
      } catch (dirErr: any) {
        console.error(`Failed to read results directory ${resultsDir}:`, dirErr.message || dirErr);
        res.status(202).json({ status: 'processing', message: 'Processing not complete' });
        return;
      }
    }

    if (result.filePath && result.filePath !== outputFilePath) {
      try {
        await fs.access(result.filePath);
        await fs.unlink(result.filePath);
        console.log(`Deleted input file: ${result.filePath}`);
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          console.log(`Input file ${result.filePath} already deleted or not found`);
        } else {
          console.warn(`Failed to delete input file ${result.filePath}:`, err.message || err);
        }
      }
    }

    const fileName = path.basename(outputFilePath);
    const downloadLink = `${req.protocol}://${req.get('host')}/results/${fileName}`;
    console.log(`Sending response:`, { status: 'completed', message: 'File processed successfully', downloadLink, jobId, metrics: result.metrics });

    res.json({
      status: 'completed',
      message: 'File processed successfully',
      downloadLink,
      jobId,
      metrics: result.metrics
    });
  } catch (error: any) {
    console.error(`Error checking job status:`, error.message || error);
    res.status(500).json({ status: 'failed', error: 'Failed to check job status' });
  }
}