const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Tipos de archivo permitidos
const ALLOWED_MIMETYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  pdf: ['application/pdf'],
  document: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

const ALL_ALLOWED = [
  ...ALLOWED_MIMETYPES.image,
  ...ALLOWED_MIMETYPES.pdf,
  ...ALLOWED_MIMETYPES.document,
];

// Configurar cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Almacenamiento en memoria (para luego subir a S3)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALL_ALLOWED.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 20 * 1024 * 1024, // 20MB
  }
});

/**
 * Determina el tipo de mensaje según el mimetype
 */
const getMessageType = (mimetype) => {
  if (ALLOWED_MIMETYPES.image.includes(mimetype)) return 'IMAGE';
  if (ALLOWED_MIMETYPES.pdf.includes(mimetype)) return 'PDF';
  return 'TEXT';
};

/**
 * Sube un archivo a S3 y retorna la URL pública
 */
const uploadToS3 = async (file, folder = 'chat-files') => {
  const ext = path.extname(file.originalname);
  const key = `${folder}/${uuidv4()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ContentDisposition: `inline; filename="${file.originalname}"`,
  });

  await s3Client.send(command);

  return {
    url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`,
    key,
    type: getMessageType(file.mimetype),
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
  };
};

/**
 * Elimina un archivo de S3
 */
const deleteFromS3 = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  });
  await s3Client.send(command);
};

/**
 * POST /api/upload
 * Sube un archivo y retorna la URL
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se proporcionó ningún archivo' });
    }

    const result = await uploadToS3(req.file);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Error al subir el archivo' });
  }
};

module.exports = { upload, uploadFile, uploadToS3, deleteFromS3, getMessageType };
