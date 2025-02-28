import { Request, Response } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const {
  ESEWA_MERCHANT_CODE,
  ESEWA_SECRET_KEY,
  ESEWA_SUCCESS_URL,
  ESEWA_FAILURE_URL,
  ESEWA_API_URL,
  ESEWA_VERIFY_URL,
} = process.env;

const generateSignature = (total_amount: string, transaction_uuid: string, product_code: string): string => {
  const data = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  return crypto.createHmac('sha256', ESEWA_SECRET_KEY as string).update(data).digest('base64');
};

const initiatePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transaction_uuid } = req.body;

    const amount = '100';
    const tax_amount = '0';
    const service_charge = '0';
    const delivery_charge = '0';

    const total_amount = '100';
    const product_code = ESEWA_MERCHANT_CODE as string;
    const signature = generateSignature(total_amount, transaction_uuid, product_code);

    const formData = {
      amount,
      tax_amount,
      product_service_charge: service_charge,
      product_delivery_charge: delivery_charge,
      total_amount,
      transaction_uuid,
      product_code,
      success_url: ESEWA_SUCCESS_URL,
      failure_url: ESEWA_FAILURE_URL,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature,
    };

    res.status(200).json({ message: 'Redirect to eSewa', formData, url: ESEWA_API_URL });
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
