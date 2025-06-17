import { Router } from 'express';
import multer from 'multer';
import { processCSV } from '../controllers/uploadController';


const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), processCSV);

export default router;