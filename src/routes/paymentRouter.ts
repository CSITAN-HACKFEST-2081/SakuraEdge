import express from 'express';
import paymentController from '../controller/paymentController';

const router = express.Router();

router.post('/payment/initiate', paymentController.initiatePayment);
router.post('/payment/verify', paymentController.verifyPayment);

export default router;
