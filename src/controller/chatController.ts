import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { senderId, receiverId, senderType, receiverType, message } = req.body;

    if (!senderId || !receiverId || !senderType || !receiverType || !message) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    let chatData: any = { message };

    if (senderType === 'doctor') {
      chatData.doctorSenderId = senderId;
    } else if (senderType === 'patient') {
      chatData.patientSenderId = senderId;
    } else {
      res.status(400).json({ error: 'Invalid sender type' });
      return;
    }

    if (receiverType === 'doctor') {
      chatData.doctorReceiverId = receiverId;
    } else if (receiverType === 'patient') {
      chatData.patientReceiverId = receiverId;
    } else {
      res.status(400).json({ error: 'Invalid receiver type' });
      return;
    }

    const chat = await prisma.chat.create({
      data: chatData,
    });

    res.status(201).json({ message: 'Message sent successfully', chat });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, userType } = req.params;

    if (!userId || !userType) {
      res.status(400).json({ error: 'User ID and type are required' });
      return;
    }

    let chatFilter: any = {};
    const parsedUserId = parseInt(userId);

    if (userType === 'doctor') {
      chatFilter.OR = [{ doctorSenderId: parsedUserId }, { doctorReceiverId: parsedUserId }];
    } else if (userType === 'patient') {
      chatFilter.OR = [{ patientSenderId: parsedUserId }, { patientReceiverId: parsedUserId }];
    } else {
      res.status(400).json({ error: 'Invalid user type' });
      return;
    }

    const chats = await prisma.chat.findMany({
      where: chatFilter,
      include: {
        doctorSender: { select: { name: true, email: true } },
        patientSender: { select: { name: true, email: true } },
        doctorReceiver: { select: { name: true, email: true } },
        patientReceiver: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({ messages: chats });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};