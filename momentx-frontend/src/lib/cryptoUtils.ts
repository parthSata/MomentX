import CryptoJS from 'crypto-js';

// ✅ Fetch the key from your .env file
const SECRET_KEY =
  import.meta.env.CHAT_ENCRYPTION_KEY || 'fallback_momentx_key_123';

export const encryptMessage = (text: string): string => {
  if (!text) return text;
  try {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  } catch (error) {
    console.error('Encryption failed', error);
    return text;
  }
};

export const decryptMessage = (ciphertext: string): string => {
  if (!ciphertext) return '';
  try {
    // If it doesn't start with this, it's an old unencrypted message from your DB!
    if (!ciphertext.startsWith('U2FsdGVkX1')) {
      return ciphertext;
    }

    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);

    // If wrong key is used, originalText is empty. Don't show the raw ciphertext!
    if (!originalText) {
      return '🔒 Decryption Failed (Wrong Key)';
    }

    return originalText;
  } catch (error) {
    console.error('Decryption failed', error);
    return '🔒 Decryption Error';
  }
};
