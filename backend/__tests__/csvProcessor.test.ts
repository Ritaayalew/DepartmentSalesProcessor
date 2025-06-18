import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { processCSVFile } from '../services/csvProcessor';

describe('CSV Processor', () => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  const resultsDir = path.join(__dirname, '../../results');
  const testInputFile = 'test-input.csv';
  const testInputPath = path.join(uploadsDir, testInputFile);
  const testCSVContent = `Department Name,Date,Number of Sales
Electronics,2023-08-01,100
Clothing,2023-08-01,200
Electronics,2023-08-02,150`;

  beforeAll(async () => {
    // Ensure uploads and results directories exist
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(resultsDir, { recursive: true });
  });

  beforeEach(async () => {
    // Write test input file
    await fs.writeFile(testInputPath, testCSVContent);
  });

  afterEach(async () => {
    try {
      // Clean up input file
      await fs.access(testInputPath).catch(() => null); // Check existence
      await fs.unlink(testInputPath).catch(() => null); // Ignore if missing

      // Clean up output files
      const files = await fs.readdir(resultsDir);
      for (const file of files) {
        if (file.endsWith('.csv')) {
          await fs.unlink(path.join(resultsDir, file)).catch(() => null);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  it('should process CSV and produce correct output', async () => {
    const jobId = uuidv4();
    const { filePath, metrics } = await processCSVFile(testInputPath, jobId);
    const expectedOutputPath = path.join(resultsDir, `${jobId}_output.csv`);

    // Verify output file exists
    await expect(fs.access(expectedOutputPath)).resolves.toBeUndefined();

    // Verify returned filePath
    expect(filePath).toBe(expectedOutputPath);

    // Verify output content
    const outputContent = await fs.readFile(filePath, 'utf-8');
    expect(outputContent).toContain('Department Name,Total Number of Sales');
    expect(outputContent).toContain('Electronics,250');
    expect(outputContent).toContain('Clothing,200');

    // Verify metrics
    expect(metrics).toEqual({
      processingTime: expect.any(Number),
      departmentCount: 2,
    });
  });
});
