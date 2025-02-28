import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId, patientId, message } = req.body;

    if (!doctorId || !patientId || !message) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const chat = await prisma.chat.create({
      data: { 
        doctorId, 
        patientId, 
        message 
      },
    });

    res.status(201).json({ message: 'Message sent successfully', chat });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      res.status(400).json({ error: 'Patient ID is required' });
      return;
    }

    const chats = await prisma.chat.findMany({
      where: { patientId }, 
      include: {
        doctor: { select: { name: true, email: true } }, 
        patient: { select: { name: true, email: true } }, 
      },
      orderBy: { createdAt: 'asc' }, 
    });

    res.status(200).json({ messages: chats });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};