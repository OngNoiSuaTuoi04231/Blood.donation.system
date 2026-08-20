import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

/**
 * Generate a unique QR code identifier for a registration
 */
export const generateQRIdentifier = (): string => {
  return `BDS-${uuidv4()}`;
};

/**
 * Generate QR code data URL from an identifier
 */
export const generateQRDataURL = async (identifier: string): Promise<string> => {
  try {
    const qrDataURL = await QRCode.toDataURL(identifier, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return qrDataURL;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};
