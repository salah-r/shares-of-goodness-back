import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const bucketName = process.env.SUPABASE_BUCKET_NAME || 'donation-receipts';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials missing. Image uploads will fail.');
}

import ws from 'ws';

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder',
  {
    auth: {
      persistSession: false
    },
    realtime: {
      transport: ws
    }
  }
);

/**
 * Uploads a donation receipt image to Supabase Storage
 * @param {Buffer} fileBuffer - The file binary buffer
 * @param {string} fileName - Destination file name (unique identifier)
 * @param {string} mimeType - The mime type of the file (e.g. image/jpeg, image/png)
 * @returns {Promise<string>} The public URL of the uploaded image file
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadReceipt(fileBuffer, fileName, mimeType) {
  const isPlaceholder = !supabaseUrl || 
                        !supabaseKey || 
                        supabaseUrl.includes('your-project-id') || 
                        supabaseKey.includes('your-supabase-service');

  if (isPlaceholder) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Supabase configuration is missing or invalid in production environment.');
    }
    console.log('💡 Placeholder Supabase credentials detected. Saving file to local storage...');
    return saveLocally(fileBuffer, fileName);
  }

  try {
    // Upload the file to the specified bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    // Retrieve public url
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Failed to generate public URL for uploaded receipt.');
    }

    return publicUrlData.publicUrl;
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Supabase Upload failed in production:', err.message);
      throw err;
    }
    console.warn('⚠️ Supabase Upload failed. Saving file to local storage fallback. Error:', err.message);
    return saveLocally(fileBuffer, fileName);
  }
}

function saveLocally(fileBuffer, fileName) {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, fileBuffer);
  return `/uploads/${fileName}`;
}

export { uploadReceipt };
