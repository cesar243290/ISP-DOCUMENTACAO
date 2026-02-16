const ENCRYPTION_KEY = 'ISP-NOC-SECRET-KEY-2024-CHANGE-IN-PRODUCTION';

export async function encrypt(text: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0')),
      'AES-GCM',
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
}

export async function decrypt(encryptedText: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0')),
      'AES-GCM',
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedText;
  }
}
