import { Router } from 'express';
import multer from 'multer';


const router = Router();
router.get('/test', (req,res)=>{
    res.send("hi there");
})

export default router;