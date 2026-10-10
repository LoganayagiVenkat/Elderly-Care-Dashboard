import express from 'express';
import * as documentsController from '../controllers/documentsController.js';

const router = express.Router();

router.get('/', documentsController.getDocuments);
router.post('/', documentsController.createDocument);

export default router;
