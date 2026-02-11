// Queue untuk mengantri pesan WhatsApp
interface MessageQueue {
  receiver: string;
  message: string;
  timestamp: number;
  retryCount?: number;
}

// In-memory queue (dalam production bisa pakai Redis)
let messageQueue: MessageQueue[] = [];
let isProcessing = false;

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://api.moonwa.id/api/send-message';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || '';
const DELAY_BETWEEN_MESSAGES = 10000; // 10 detik
const MAX_WA_RETRIES = 3; // Maksimal 3 kali retry

// Fungsi untuk mengirim pesan ke WhatsApp API
async function sendWhatsAppMessage(receiver: string, message: string) {
  if (!WHATSAPP_API_KEY) {
    throw new Error('WHATSAPP_API_KEY tidak dikonfigurasi di environment variable');
  }

  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: WHATSAPP_API_KEY,
        receiver: receiver,
        data: {
          message: message,
        },
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send message');
    }

    return result;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

// Fungsi untuk menyimpan failed notification ke database
async function saveFailedNotification(receiver: string, message: string, error: string) {
  try {
    await fetch('/api/notifications/failed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiver,
        message,
        error,
        failedAt: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('Failed to save failed notification to database:', err);
  }
}

// Fungsi untuk memproses antrian pesan dengan retry mechanism
async function processQueue() {
  if (isProcessing || messageQueue.length === 0) {
    return;
  }

  isProcessing = true;

  try {
    while (messageQueue.length > 0) {
      const message = messageQueue.shift();
      if (!message) break;

      let success = false;
      let lastError = '';
      const currentRetry = message.retryCount || 0;

      // Retry loop dengan exponential backoff
      for (let attempt = 1; attempt <= MAX_WA_RETRIES; attempt++) {
        try {
          await sendWhatsAppMessage(message.receiver, message.message);
          console.log(`✅ Message sent to ${message.receiver}`);
          success = true;
          break;
        } catch (error: any) {
          lastError = error.message || 'Unknown error';
          console.warn(`⚠️ WA attempt ${attempt}/${MAX_WA_RETRIES} failed for ${message.receiver}: ${lastError}`);
          
          // Jika belum mencapai max retry, tunggu dengan exponential backoff
          if (attempt < MAX_WA_RETRIES) {
            const delay = 2000 * Math.pow(2, attempt - 1); // 2s, 4s, 8s
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // Jika tetap gagal setelah semua retry, simpan ke database
      if (!success) {
        console.error(`❌ Failed to send message to ${message.receiver} after ${MAX_WA_RETRIES} attempts`);
        await saveFailedNotification(message.receiver, message.message, lastError);
      }

      // Delay 10 detik sebelum mengirim pesan berikutnya
      if (messageQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MESSAGES));
      }
    }
  } finally {
    // ALWAYS reset isProcessing, even if there's an unexpected error
    isProcessing = false;
  }
}

// Fungsi untuk menambahkan pesan ke antrian
export async function addToQueue(receiver: string, message: string): Promise<void> {
  // Validasi format nomor (harus dimulai dengan 62)
  const cleanReceiver = receiver.replace(/^0/, '62').replace(/[^0-9]/g, '');
  if (!cleanReceiver.startsWith('62')) {
    throw new Error('Format nomor tidak valid. Harus dimulai dengan 62');
  }

  // Tambahkan ke antrian
  messageQueue.push({
    receiver: cleanReceiver,
    message: message,
    timestamp: Date.now(),
    retryCount: 0,
  });

  // Mulai proses antrian jika belum berjalan
  processQueue().catch(error => {
    console.error('Error processing queue:', error);
  });
}

// Fungsi untuk mendapatkan status antrian
export function getQueueStatus() {
  return {
    queueLength: messageQueue.length,
    isProcessing: isProcessing,
    queue: messageQueue.map(m => ({
      receiver: m.receiver,
      timestamp: m.timestamp,
    })),
  };
}
















