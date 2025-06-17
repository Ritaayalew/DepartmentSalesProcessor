import express from 'express';
import path from 'path';
import rateLimit from 'express-rate-limit';
import uploadRoutes from './routes/uploadRoutes'

const app= express();
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 
});
app.use('/api', limiter, uploadRoutes);

// Serve result files
app.use('/results', express.static(path.join(__dirname, '../results')));

export default app;
