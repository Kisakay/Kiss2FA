import { TOTP2 } from './totp2';

// Generate a TOTP code
export const generateTOTP = async (
  secret: string,
  period: number = 30,
  digits: number = 6,
): Promise<string> => {
  try {
    const result = await TOTP2.generate(secret, {
      period,
      digits,
      algorithm: 'SHA-1',
      encoding: 'hex'
    });
    
    return result.otp;
  } catch (error) {
    console.error('Error generating TOTP:', error);
    return '------';
  }
};

// Calculate seconds remaining until next TOTP refresh
export const getTimeRemaining = (period: number = 30): number => {
  const epoch = Math.floor(Date.now() / 1000);
  return period - (epoch % period);
};