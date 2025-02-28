import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); 

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", 
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS, 
  },
  logger: true, 
  debug: true,  
});

const generateOTP = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

const sendOTPEmail = async (email: string, otp: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"Aarogya" <${process.env.SMTP_USER}>`, 
      to: email, 
      subject: "Your OTP for Aarogya", 
      text: `Your OTP for account verification is: ${otp}`, 
      html: `<p>Your OTP for account verification is: <strong>${otp}</strong></p>`, 
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const validatePassword = (password: string) => {
  return password.length >= 8;
};

export const registerDoctor = async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    licenseNo,
    specialization,
    location,
    contactNo,
    availability, // Expecting an array of availability times
  } = req.body;

  try {
    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    const user = await prisma.doctor.create({
      data: {
        name,
        email,
        password: hashedPassword,
        licenseNo,
        specialization,
        location,
        contactNo,
        otpCode: otp,
      },
    });

    // Create availability entries
    if (availability && Array.isArray(availability)) {
      await Promise.all(availability.map(async (slot: { startTime: string, endTime: string }) => {
        await prisma.availability.create({
          data: {
            doctorId: user.id, 
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime),
          },
        });        
      }));
    }

    await sendOTPEmail(email, otp);
    return res.status(201).json({ message: 'Doctor registered successfully. OTP sent to email.', user });
  } catch (err) {
    console.error('Error registering doctor:', err);

    if ((err as any)?.code === 'P2002') {
      return res.status(400).json({ message: 'Email already in use' });
    }

    return res.status(500).json({
      message: 'Error registering doctor',
      error: (err as Error).message,
    });
  }
};

export const getAllDoctors = async (_req: Request, res: Response) => {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        availabilities: {
          select: {
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    return res.status(200).json({ doctors });
  } catch (err) {
    console.error('Error fetching doctors:', err);
    return res.status(500).json({ message: 'Error fetching doctors', error: (err as Error).message });
  }
};
export const registerPatient = async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    bloodType,
    location,
    contactNo,
  } = req.body;

  try {
    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    const user = await prisma.patient.create({
      data: {
        name,
        email,
        password: hashedPassword,
        bloodType,
        location,
        contactNo,
        otpCode: otp,
      },
    });

    await sendOTPEmail(email, otp);
    return res.status(201).json({ message: 'Patient registered successfully. OTP sent to email.', user });
  } catch (err) {
    console.error('Error registering patient:', err);

    if ((err as any)?.code === 'P2002') {
      return res.status(400).json({ message: 'Email already in use' });
    }

    return res.status(500).json({
      message: 'Error registering patient',
      error: (err as Error).message,
    });
  }
};
export const login = async (req: Request, res: Response) => {
  const { email, password, userType } = req.body;

  try {
    let user;

    if (userType === 'DOCTOR') {
      user = await prisma.doctor.findUnique({ where: { email } });
    } else if (userType === 'PATIENT') {
      user = await prisma.patient.findUnique({ where: { email } });
    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(
      password, 
      user.password || ''
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.email, userType },
      process.env.JWT_SECRET || 'aarogya123', 
      { expiresIn: '1h' }
    );

    return res.status(200).json({ message: 'Login successful', token, user });
  } catch (err) {
    const error = err as Error;
    return res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp, userType } = req.body;

  try {
    let user;

    if (userType === 'DOCTOR') {
      user = await prisma.doctor.findUnique({ where: { email } });
    } else if (userType === 'PATIENT') {
      user = await prisma.patient.findUnique({ where: { email } });
    } else {
      return res.status(400).json({ message: 'Invalid user type. Must be Doctor or Patient.' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.otpVerified) {
      return res.status(200).json({ message: 'User is already verified.' });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    if (userType === 'DOCTOR') {
      await prisma.doctor.update({
        where: { email },
        data: { otpVerified: true, otpCode: null }, 
      });
    } else if (userType === 'PATIENT') {
      await prisma.patient.update({
        where: { email },
        data: { otpVerified: true, otpCode: null }, 
      });
    }

    return res.status(200).json({ message: 'OTP verified successfully. Account activated.' });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return res.status(500).json({ message: 'Error verifying OTP', error: (err as Error).message });
  }
};
