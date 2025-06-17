import { Router } from 'express';
import multer from 'multer';
import { checkJobStatus, processCSV } from '../controllers/uploadController';


const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), processCSV);

router.get('/status/:jobId', checkJobStatus);


export default router;