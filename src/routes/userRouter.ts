import express from 'express';
import { registerDoctor, registerPatient, login, verifyOTP, getAllDoctors } from '../controller/userController'; // Ensure getAllDoctors is imported
import catchAsync from '../utils/catchAsync';

const router = express.Router();

router.post('/registerDoctor', catchAsync(registerDoctor));
router.post('/registerPatient', catchAsync(registerPatient));
router.post('/login', catchAsync(login));
router.post('/verify-otp', catchAsync(verifyOTP));
router.get('/allDoctors', catchAsync(getAllDoctors)); 

export default router;