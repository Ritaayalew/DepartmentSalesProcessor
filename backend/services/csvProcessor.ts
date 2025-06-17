import fs from 'fs';
import csvParser from 'csv-parser';
import { Stringifier, stringify } from 'csv-stringify';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

interface SalesRow {
  'Department Name': string;
  Date: string;
  'Number of Sales': string;
}

interface AggregatedData {
  [department: string]: number;
}

export async function processCSVFile(inputPath: string): Promise<{ filePath: string, metrics: { processingTime: number, departmentCount: number } }> {
  const outputDir = path.join(__dirname, '../../results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  const outputFile = path.join(outputDir, `${uuidv4()}.csv`);
  const aggregatedData: AggregatedData = {};

  // Process input CSV using streams
  const startTime = Date.now();
  await new Promise((resolve, reject) => {
    fs.createReadStream(inputPath)
      .pipe(csvParser())
      .on('data', (row: SalesRow) => {
        const department = row['Department Name'];
        const sales = parseInt(row['Number of Sales'], 10);
        if (department && !isNaN(sales)) {
          aggregatedData[department] = (aggregatedData[department] || 0) + sales;
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Write aggregated data to output CSV
  const columns = ['Department Name', 'Total Number of Sales'];
  const stringifier: Stringifier = stringify({ header: true, columns });
  const writableStream = fs.createWriteStream(outputFile);

  for (const [department, totalSales] of Object.entries(aggregatedData)) {
    stringifier.write([department, totalSales]);
  }
  stringifier.pipe(writableStream);

  await new Promise<void>((resolve, reject) => {
    writableStream.on('finish', resolve);
    writableStream.on('error', reject);
    stringifier.end();
  });

  const processingTime = Date.now() - startTime;
  return {
    filePath: outputFile,
    metrics: { processingTime, departmentCount: Object.keys(aggregatedData).length }
  };
}