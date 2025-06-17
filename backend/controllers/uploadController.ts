// import { Request, Response } from 'express';
// import { addToQueue, getJobResult } from '../services/queue';
// import path from 'path';
// import fs from 'fs';
// import { v4 as uuidv4 } from 'uuid';



// export async function processCSV(req: Request, res: Response): Promise<void> {
//   try {
//     if (!req.file) {
//       res.status(400).json({ error: 'No file uploaded' });
//       return;
//     }

//     const inputPath = req.file.path;
//     const jobId = await addToQueue(inputPath);

//     res.json({
//       message: 'File queued for processing',
//       jobId
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to queue file' });
//   }
// }

// export async function checkJobStatus(req: Request, res: Response): Promise<void> {
//   try {
//     const jobId = req.params.jobId;
//     const result = await getJobResult(jobId);
//     if (!result) {
//       res.status(202).json({ message: 'Processing not complete' });
//       return;
//     }

//     // Clean up uploaded file
//     fs.unlinkSync(result.filePath);

//     // Generate downloadable link
//     const fileName = path.basename(result.filePath);
//     const downloadLink = `${req.protocol}://${req.get('host')}/results/${fileName}`;

//     res.json({
//       message: 'File processed successfully',
//       downloadLink,
//       metrics: result.metrics
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to check job status' });
//   }
// }




import { Request, Response } from 'express';
import { addToQueue, getJobResult } from '../services/queue';
import path from 'path';
import fs from 'fs/promises'; // Use promises for async file operations
import { v4 as uuidv4 } from 'uuid';

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
      res.status(202).json({ status: 'processing', message: 'Processing not complete' });
      return;
    }

    // Assume result.outputFilePath is the path to the processed file
    const outputFilePath = result.outputFilePath || path.join(__dirname, '../../results', `${jobId}_output.csv`);
    
    // Verify output file exists
    try {
      await fs.access(outputFilePath);
    } catch (err) {
      console.log(`Output file ${outputFilePath} not found, job still processing`);
      res.status(202).json({ status: 'processing', message: 'Processing not complete' });
      return;
    }

    // Clean up input file (if result.filePath is the input file)
    if (result.filePath && result.filePath !== outputFilePath) {
      try {
        await fs.unlink(result.filePath);
      } catch (err) {
        console.warn(`Failed to delete input file ${result.filePath}:`, err);
      }
    }

    // Generate downloadable link
    const fileName = path.basename(outputFilePath);
    const downloadLink = `${req.protocol}://${req.get('host')}/results/${fileName}`;

    res.json({
      status: 'completed',
      message: 'File processed successfully',
      downloadLink,
      metrics: result.metrics
    });
  } catch (error) {
    console.error('Error checking job status:', error);
    res.status(500).json({ status: 'failed', error: 'Failed to check job status' });
  }
}