import fs from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fileTypeFromBuffer } from "file-type";
import crypto from "crypto";
import appConfig from "@/config";

const s3Client = new S3Client({
  region: "auto",
  endpoint: appConfig.services.cloudflare.r2Endpoint,
  credentials: {
    accessKeyId: appConfig.services.cloudflare.r2AccessKeyId,
    secretAccessKey: appConfig.services.cloudflare.r2SecretAccessKey,
  },
});

export interface UploadResponse {
  name: string;
  hash: string;
  size: string;
  fileNames: string[];
}

// Helper function to extract format from data URL
function extractFormatFromDataUrl(base64String: string): {
  format: string | null;
  cleanBase64: string;
} {
  const dataUrlMatch = base64String.match(
    /^data:image\/([a-zA-Z]+);base64,(.+)$/,
  );
  if (dataUrlMatch) {
    return {
      format: dataUrlMatch[1].toLowerCase(),
      cleanBase64: dataUrlMatch[2],
    };
  }
  return {
    format: null,
    cleanBase64: base64String,
  };
}

// Helper function to get MIME type from format
function getMimeTypeFromFormat(format: string): string {
  const mimeTypes: { [key: string]: string } = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    tiff: "image/tiff",
    svg: "image/svg+xml",
  };
  return mimeTypes[format] || "image/jpeg";
}

// New function to upload a single base64 image with better type detection
export async function uploadBase64Image(
  userUUID: string,
  base64Image: string,
  originalFileName?: string,
  expectedFormat?: string, // Optional: specify expected format
): Promise<UploadResponse> {
  try {
    // Extract format from data URL if present
    const { format: dataUrlFormat, cleanBase64 } =
      extractFormatFromDataUrl(base64Image);

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(cleanBase64, "base64");

    // Try to detect file type from buffer
    const detectedType = await fileTypeFromBuffer(fileBuffer);

    let finalFormat: string;
    let finalMime: string;

    // Priority order: expectedFormat > dataUrlFormat > detectedType > default to png
    if (expectedFormat) {
      finalFormat = expectedFormat.toLowerCase();
      finalMime = getMimeTypeFromFormat(finalFormat);
      console.log(`Using expected format: ${finalFormat}`);
    } else if (dataUrlFormat) {
      finalFormat = dataUrlFormat;
      finalMime = getMimeTypeFromFormat(finalFormat);
      console.log(`Using data URL format: ${finalFormat}`);
    } else if (detectedType) {
      finalFormat = detectedType.ext;
      finalMime = detectedType.mime;
      console.log(`Using detected format: ${finalFormat}`);
    } else {
      // Default to PNG since it's lossless and widely supported
      finalFormat = "png";
      finalMime = "image/png";
      console.log(
        `Using default format: ${finalFormat} (could not detect type)`,
      );
    }

    const randomSuffix = crypto.randomUUID().slice(0, 8);
    const baseName = originalFileName
      ? originalFileName.replace(/\.[^/.]+$/, "") // Remove extension if present
      : "generated-image";

    const newFileName = `${baseName}-${randomSuffix}.${finalFormat}`;
    const objectKey = `${userUUID}/${newFileName}`;

    console.log(
      `Uploading base64 image as ${newFileName} with MIME type ${finalMime}`,
    );

    // Upload file to Cloudflare R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: appConfig.services.cloudflare.r2BucketName,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: finalMime,
      }),
    );

    return {
      name: newFileName,
      hash: `${appConfig.services.cloudflare.r2Url}/${objectKey}`,
      size: fileBuffer.length.toString(),
      fileNames: [newFileName],
    } as UploadResponse;
  } catch (error) {
    console.error("Error during base64 image upload:", error);
    throw new Error("Base64 image upload failed.");
  }
}

// Updated function to upload multiple base64 images
export async function uploadBase64Images(
  userUUID: string,
  base64Images: string[],
  fileNames?: string[],
  expectedFormat?: string,
): Promise<UploadResponse[]> {
  try {
    if (base64Images.length === 0) {
      throw new Error("No base64 images provided");
    }

    // Upload images to Cloudflare R2
    const uploadResults = await Promise.all(
      base64Images.map(async (base64Image, index) => {
        const fileName = fileNames?.[index] || `image-${index + 1}`;
        return await uploadBase64Image(
          userUUID,
          base64Image,
          fileName,
          expectedFormat,
        );
      }),
    );

    console.log("Upload successful:", uploadResults);
    return uploadResults;
  } catch (error) {
    console.error("Error during batch upload:", error);
    throw new Error("Batch upload failed.");
  }
}

export async function uploadFilesInOutputs(
  userUUID: string,
  directoryPath: string,
): Promise<UploadResponse[]> {
  try {
    const outputsPath = path.join(directoryPath, "outputs");

    // Check if 'outputs' directory exists
    const stats = await fs.stat(outputsPath);
    if (!stats.isDirectory()) {
      throw new Error(
        `The 'outputs' directory does not exist at: ${outputsPath}`,
      );
    }

    // Read files from 'outputs'
    const fileNames = await fs.readdir(outputsPath);
    if (fileNames.length === 0) {
      throw new Error(
        `No files found in the 'outputs' directory at: ${outputsPath}`,
      );
    }

    // Upload files to Cloudflare R2
    const uploadResults = await Promise.all(
      fileNames.map(async (fileName) => {
        const filePath = path.join(outputsPath, fileName);
        const fileBuffer = await fs.readFile(filePath);

        // Detect file type
        const detectedType = await fileTypeFromBuffer(fileBuffer);
        if (!detectedType) {
          console.warn(`Skipping unknown file type: ${fileName}`);
          return null;
        }

        const { ext, mime } = detectedType;
        const randomSuffix = crypto.randomUUID().slice(0, 8);
        const newFileName = `${path.basename(fileName, path.extname(fileName))}-${randomSuffix}.${ext}`;
        const objectKey = `${userUUID}/${newFileName}`;

        console.log(
          `Uploading ${fileName} as ${newFileName} with MIME type ${mime}`,
        );

        // Upload file to Cloudflare R2
        await s3Client.send(
          new PutObjectCommand({
            Bucket: appConfig.services.cloudflare.r2BucketName,
            Key: objectKey,
            Body: fileBuffer,
            ContentType: mime,
          }),
        );

        // Get file size
        const { size } = await fs.stat(filePath);

        return {
          name: newFileName,
          hash: `${appConfig.services.cloudflare.r2Url}/${objectKey}`,
          size: size.toString(),
          fileNames: [newFileName],
        } as UploadResponse;
      }),
    );

    // Remove `null` values
    const validUploads: UploadResponse[] = uploadResults.filter(
      (upload): upload is UploadResponse => upload !== null,
    );

    console.log("Upload successful:", validUploads);
    return validUploads;
  } catch (error) {
    console.error("Error during upload:", error);
    throw new Error("Upload failed.");
  }
}
