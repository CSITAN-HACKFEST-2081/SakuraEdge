import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRouter from './routes/userRouter'; 
import chatRouter from './routes/chatRouter'; 
import paymentRoutes from './routes/paymentRouter';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  console.log(req.method);
  res.send('This is the backend server of Aarogya, Whatsup visitor!!');
});

// API routes
app.use('/api/users', userRouter); 
app.use('/api/chats', chatRouter); 
app.use('/api/payment', paymentRoutes);

const PORT = parseInt(process.env.PORT as string, 10) || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});