import { Request, Response } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid'; 

dotenv.config();

const {
  ESEWA_MERCHANT_CODE,
  ESEWA_SECRET_KEY,
  ESEWA_SUCCESS_URL,
  ESEWA_FAILURE_URL,
  ESEWA_API_URL,
} = process.env;

const generateSignature = (total_amount: string, transaction_uuid: string, product_code: string): string => {
  const data = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  return crypto.createHmac('sha256', ESEWA_SECRET_KEY as string).update(data).digest('base64');
};

const initiatePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const transaction_uuid = uuidv4(); 
    const amount = '100';
    const total_amount = '100';
    const product_code = ESEWA_MERCHANT_CODE as string;
    const signature = generateSignature(total_amount, transaction_uuid, product_code);

    const formData = new URLSearchParams({
      amount,
      total_amount,
      transaction_uuid,
      product_code,
      success_url: ESEWA_SUCCESS_URL || '',
      failure_url: ESEWA_FAILURE_URL || '',
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature,
    });

    const redirectUrl = `${ESEWA_API_URL}?${formData.toString()}`;
    
    res.status(200).json({ message: 'Redirect to eSewa', url: redirectUrl });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ message: 'Payment initiation failed' });
  }
};

const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transaction_uuid, total_amount, transaction_code, status, product_code, signature } = req.body;

    if (status !== 'COMPLETE') {
      res.status(400).json({ message: 'Payment not successful' });
      return;
    }

    const generatedSignature = generateSignature(total_amount, transaction_uuid, product_code);
    if (generatedSignature !== signature) {
      res.status(400).json({ message: 'Signature mismatch' });
      return;
    }

    res.status(200).json({ message: 'Payment verified successfully', transaction_uuid, transaction_code });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

export default { initiatePayment, verifyPayment };


// import { Request, Response } from 'express';
// import crypto from 'crypto';
// import dotenv from 'dotenv';
// import { v4 as uuidv4 } from 'uuid'; 

// dotenv.config();

// const {
//   ESEWA_MERCHANT_CODE,
//   ESEWA_SECRET_KEY,
//   ESEWA_SUCCESS_URL,
//   ESEWA_FAILURE_URL,
//   ESEWA_API_URL,
// } = process.env;

// const generateSignature = (total_amount: string, transaction_uuid: string, product_code: string): string => {
//   const data = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
//   return crypto.createHmac('sha256', ESEWA_SECRET_KEY as string).update(data).digest('base64');
// };

// const initiatePayment = async (req: Request, res: Response): Promise<Response> => {
//   try {
//     const transaction_uuid = uuidv4(); 
//     const amount = '100';
//     const total_amount = '110';
//     const product_code = ESEWA_MERCHANT_CODE as string;
//     const signature = generateSignature(total_amount, transaction_uuid, product_code);

//     const formData = new URLSearchParams({
//       amount,
//       total_amount,
//       transaction_uuid,
//       product_code,
//       success_url: ESEWA_SUCCESS_URL || '',
//       failure_url: ESEWA_FAILURE_URL || '',
//       signed_field_names: 'total_amount,transaction_uuid,product_code',
//       signature,
//     });

//     const redirectUrl = `${ESEWA_API_URL}?${formData.toString()}`;
    
//     return res.status(200).json({ message: 'Redirect to eSewa', url: redirectUrl });
//   } catch (error) {
//     console.error('Error initiating payment:', error);
//     return res.status(500).json({ message: 'Payment initiation failed' });
//   }
// };

// const verifyPayment = async (req: Request, res: Response): Promise<Response> => {
//   try {
//     const { transaction_uuid, total_amount, transaction_code, status, product_code, signature } = req.body;

//     if (status !== 'COMPLETE') {
//       return res.status(400).json({ message: 'Payment not successful' });
//     }

//     const generatedSignature = generateSignature(total_amount, transaction_uuid, product_code);
//     if (generatedSignature !== signature) {
//       return res.status(400).json({ message: 'Signature mismatch' });
//     }

//     return res.status(200).json({ message: 'Payment verified successfully', transaction_uuid, transaction_code });
//   } catch (error) {
//     console.error('Error verifying payment:', error);
//     return res.status(500).json({ message: 'Payment verification failed' });
//   }
// };

// export default { initiatePayment, verifyPayment };