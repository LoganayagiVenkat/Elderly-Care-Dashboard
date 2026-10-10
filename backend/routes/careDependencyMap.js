import express from 'express';
import * as careDependencyMapController from '../controllers/careDependencyMapController.js';

const router = express.Router();

router.get('/:residentId', careDependencyMapController.getCareDependencyMap);

export default router;
