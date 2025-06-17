import fs from 'fs';
import { processCSVFile } from '../services/csvProcessor';
import path from 'path';

describe('CSV Processor', () => {
  const testInputPath = path.join(__dirname, 'test-input.csv');
  const testCSVContent = `Department Name,Date,Number of Sales
Electronics,2023-08-01,100
Clothing,2023-08-01,200
Electronics,2023-08-02,150`;

beforeEach(() => {
fs.writeFileSync(testInputPath, testCSVContent);
});

afterEach(() => {
if (fs.existsSync(testInputPath)) {
fs.unlinkSync(testInputPath);
}
});

it('should process CSV and produce correct output', async () => {
const { filePath } = await processCSVFile(testInputPath);
const outputContent = fs.readFileSync(filePath, 'utf-8');

expect(outputContent).toContain('Department Name,Total Number of Sales');
expect(outputContent).toContain('Electronics,250');
expect(outputContent).toContain('Clothing,200');

fs.unlinkSync(filePath);
});
});