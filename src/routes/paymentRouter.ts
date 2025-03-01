import express from 'express';
import paymentController from '../controller/paymentController';

const router = express.Router();

router.post('/initiate', paymentController.initiatePayment);
router.post('/verify', paymentController.verifyPayment);

export default router;