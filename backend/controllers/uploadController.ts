import { Request, Response } from 'express';
import { addToQueue, getJobResult } from '../services/queue';
import path from 'path';
import fs from 'fs';

export async function processCSV(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const inputPath = req.file.path;
    const jobId = await addToQueue(inputPath);

    res.json({
      message: 'File queued for processing',
      jobId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to queue file' });
  }
}

export async function checkJobStatus(req: Request, res: Response): Promise<void> {
  try {
    const jobId = req.params.jobId;
    const result = await getJobResult(jobId);
    if (!result) {
      res.status(202).json({ message: 'Processing not complete' });
      return;
    }

    // Clean up uploaded file
    fs.unlinkSync(result.filePath);

    // Generate downloadable link
    const fileName = path.basename(result.filePath);
    const downloadLink = `${req.protocol}://${req.get('host')}/results/${fileName}`;

    res.json({
      message: 'File processed successfully',
      downloadLink,
      metrics: result.metrics
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to check job status' });
  }
}