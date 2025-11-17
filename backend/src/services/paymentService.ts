import axios from 'axios';
import logger from '../config/logger';

// PortOne (구 아임포트) API configuration
const PORTONE_API_URL = 'https://api.iamport.kr';
const IMP_KEY = process.env.PORTONE_API_KEY;
const IMP_SECRET = process.env.PORTONE_API_SECRET;

// Get access token from PortOne
const getAccessToken = async (): Promise<string> => {
  try {
    const response = await axios.post(`${PORTONE_API_URL}/users/getToken`, {
      imp_key: IMP_KEY,
      imp_secret: IMP_SECRET,
    });

    if (response.data.code !== 0) {
      throw new Error('Failed to get access token');
    }

    return response.data.response.access_token;
  } catch (error) {
    logger.error('Failed to get PortOne access token:', error);
    throw error;
  }
};

// Verify payment
export const verifyPayment = async (impUid: string, amount: number) => {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.get(
      `${PORTONE_API_URL}/payments/${impUid}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.data.code !== 0) {
      throw new Error('Failed to get payment info');
    }

    const payment = response.data.response;

    // Verify amount
    if (payment.amount !== amount) {
      throw new Error('Payment amount mismatch');
    }

    // Verify status
    if (payment.status !== 'paid') {
      throw new Error('Payment not completed');
    }

    return payment;
  } catch (error) {
    logger.error('Payment verification failed:', error);
    throw error;
  }
};

// Cancel payment (for refunds)
export const cancelPayment = async (
  impUid: string,
  reason: string,
  amount?: number
) => {
  try {
    const accessToken = await getAccessToken();

    const data: any = {
      imp_uid: impUid,
      reason,
    };

    if (amount) {
      data.amount = amount;
      data.checksum = amount;
    }

    const response = await axios.post(
      `${PORTONE_API_URL}/payments/cancel`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.data.code !== 0) {
      throw new Error('Failed to cancel payment');
    }

    return response.data.response;
  } catch (error) {
    logger.error('Payment cancellation failed:', error);
    throw error;
  }
};

// Create payment transaction record
export interface PaymentData {
  reservationId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  impUid?: string;
  merchantUid: string;
}

export const generateMerchantUid = (reservationId: string): string => {
  const timestamp = Date.now();
  return `caraban_${reservationId}_${timestamp}`;
};
