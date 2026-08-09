import { S3Client } from "bun"
import { nanoid } from "nanoid"
import { transliterate as tr } from "transliteration"

import { cfAccountId, r2AccessKey, r2Bucket, r2Domain, r2SecretKey } from "env"

type AssetType = "images" | "videos" | "documents" | "archives" | "others"

interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicUrl: string
}

export class StorageValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StorageValidationError"
  }
}

export class StorageUploadError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = "StorageUploadError"
    this.cause = cause
  }
}

export class StorageDeleteError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = "StorageDeleteError"
    this.cause = cause
  }
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 50 * 1024 * 1024
const RETRY_DELAY_MS = 2000

const VALID_IMAGE_SIGNATURES = [
  { signature: [0xff, 0xd8, 0xff], ext: "jpg" },
  { signature: [0x89, 0x50, 0x4e, 0x47], ext: "png" },
  { signature: [0x47, 0x49, 0x46, 0x38], ext: "gif" },
  { signature: [0x52, 0x49, 0x46, 0x46], ext: "webp" },
]

const VALID_VIDEO_SIGNATURES = [
  { signature: [0x00, 0x00, 0x00], ext: "mp4" },
  { signature: [0x1a, 0x45, 0xdf, 0xa3], ext: "webm" },
  { signature: [0x46, 0x4c, 0x56], ext: "flv" },
]

class R2Storage {
  private client: S3Client
  private publicUrl: string

  constructor(config: R2Config) {
    this.client = new S3Client({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      bucket: config.bucketName,
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    })
    this.publicUrl = config.publicUrl.startsWith("http")
      ? config.publicUrl
      : `https://${config.publicUrl}`
  }

  async uploadImage(buffer: Buffer, _contentType: string): Promise<string> {
    if (buffer.length > MAX_IMAGE_SIZE) {
      throw new StorageValidationError(
        `Image size exceeds maximum allowed size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
      )
    }

    const extension = this.validateImageMagicBytes(buffer)
    if (!extension) {
      throw new StorageValidationError("Invalid image file type")
    }

    const processed = await this.processImage(buffer)
    const key = this.generateUniqueKey("images", "webp")
    await this.uploadWithRetry(processed, key, "image/webp")
    return `${this.publicUrl}/${key}`
  }

  async uploadVideo(buffer: Buffer, contentType: string): Promise<string> {
    if (buffer.length > MAX_VIDEO_SIZE) {
      throw new StorageValidationError(
        `Video size exceeds maximum allowed size of ${MAX_VIDEO_SIZE / 1024 / 1024}MB`,
      )
    }

    const extension = this.validateVideoMagicBytes(buffer)
    if (!extension) {
      throw new StorageValidationError("Invalid video file type")
    }

    const key = this.generateUniqueKey("videos", extension)
    await this.uploadWithRetry(buffer, key, contentType)
    return `${this.publicUrl}/${key}`
  }

  private generateUniqueKey(
    type: "images" | "videos",
    extension: string,
  ): string {
    const id = nanoid()
    return `contents/ai/${type}/${id}.${extension}`
  }

  private validateImageMagicBytes(buffer: Buffer): string | null {
    for (const { signature, ext } of VALID_IMAGE_SIGNATURES) {
      if (this.matchesSignature(buffer, signature)) {
        if (ext === "webp") {
          const webpCheck = buffer.subarray(8, 12).toString("ascii")
          if (webpCheck === "WEBP") {
            return ext
          }
          continue
        }
        return ext
      }
    }
    return null
  }

  private validateVideoMagicBytes(buffer: Buffer): string | null {
    for (const { signature, ext } of VALID_VIDEO_SIGNATURES) {
      if (ext === "mp4") {
        const ftypCheck = buffer.subarray(4, 8).toString("ascii")
        if (ftypCheck === "ftyp") {
          return ext
        }
        continue
      }
      if (this.matchesSignature(buffer, signature)) {
        return ext
      }
    }
    return null
  }

  private matchesSignature(buffer: Buffer, signature: number[]): boolean {
    if (buffer.length < signature.length) return false
    return signature.every((byte, index) => buffer[index] === byte)
  }

  private async processImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await new Bun.Image(buffer)
        .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .buffer()
    } catch (e) {
      throw new StorageUploadError(
        `Failed to process image: ${e instanceof Error ? e.message : "Unknown error"}`,
        e,
      )
    }
  }

  private async uploadSingle(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<void> {
    try {
      await this.client.file(key).write(buffer, { type: contentType })
    } catch (e) {
      throw new StorageUploadError(
        `Failed to upload to R2: ${e instanceof Error ? e.message : "Unknown error"}`,
        e,
      )
    }
  }

  private async uploadWithRetry(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<void> {
    try {
      await this.uploadSingle(buffer, key, contentType)
      return
    } catch {
      console.warn(`Upload failed, retrying in ${RETRY_DELAY_MS}ms...`)
    }

    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    await this.uploadSingle(buffer, key, contentType)
  }

  classifyFileType(mimeType: string, filename: string): AssetType {
    const lowerMime = mimeType.toLowerCase()
    const lowerFilename = filename.toLowerCase()

    if (lowerMime.startsWith("image/")) {
      return "images"
    }

    if (lowerMime.startsWith("video/")) {
      return "videos"
    }

    if (
      lowerMime.includes("pdf") ||
      lowerMime.includes("text/") ||
      lowerMime.includes("word") ||
      lowerMime.includes("excel") ||
      lowerMime.includes("powerpoint") ||
      lowerMime.includes("opendocument") ||
      lowerFilename.endsWith(".pdf") ||
      lowerFilename.endsWith(".doc") ||
      lowerFilename.endsWith(".docx") ||
      lowerFilename.endsWith(".txt") ||
      lowerFilename.endsWith(".rtf") ||
      lowerFilename.endsWith(".odt") ||
      lowerFilename.endsWith(".xls") ||
      lowerFilename.endsWith(".xlsx") ||
      lowerFilename.endsWith(".ppt") ||
      lowerFilename.endsWith(".pptx")
    ) {
      return "documents"
    }

    if (
      lowerMime.includes("zip") ||
      lowerMime.includes("rar") ||
      lowerMime.includes("7z") ||
      lowerMime.includes("gzip") ||
      lowerMime.includes("tar") ||
      lowerMime.includes("bzip") ||
      lowerFilename.endsWith(".zip") ||
      lowerFilename.endsWith(".rar") ||
      lowerFilename.endsWith(".7z") ||
      lowerFilename.endsWith(".gz") ||
      lowerFilename.endsWith(".tar") ||
      lowerFilename.endsWith(".bz2")
    ) {
      return "archives"
    }

    return "others"
  }

  async uploadAsset(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string,
    filename?: string,
  ): Promise<{ url: string; type: AssetType; size: number; key: string }> {
    const type = this.classifyFileType(mimeType, originalFilename)

    let uploadBuffer = buffer
    let uploadMimeType = mimeType

    if (type === "images") {
      uploadBuffer = await this.processImage(buffer)
      uploadMimeType = "image/webp"
      filename = filename
        ? `${filename.replace(/\.[^/.]+$/, "")}.webp`
        : this.generateAssetFilename(originalFilename, "webp")
    }

    const finalFilename =
      filename ?? this.generateAssetFilename(originalFilename, "bin")

    const key = `${type}/${finalFilename}`

    await this.uploadWithRetry(uploadBuffer, key, uploadMimeType)

    return {
      url: `${this.publicUrl}/${key}`,
      type,
      size: uploadBuffer.length,
      key,
    }
  }

  private generateAssetFilename(
    originalFilename: string,
    extension: string,
  ): string {
    const baseName = tr(originalFilename.replace(/\.[^/.]+$/, ""))
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_")
    return `${sanitizedBaseName}_${nanoid(6)}.${extension}`
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.client.file(key).delete()
    } catch (e) {
      throw new StorageDeleteError(
        `Failed to delete from R2: ${e instanceof Error ? e.message : "Unknown error"}`,
        e,
      )
    }
  }
}

let r2Instance: R2Storage | null = null

export function getR2Storage(): R2Storage {
  if (!r2Instance) {
    const config: R2Config = {
      accountId: cfAccountId,
      accessKeyId: r2AccessKey,
      secretAccessKey: r2SecretKey,
      bucketName: r2Bucket,
      publicUrl: r2Domain,
    }

    r2Instance = new R2Storage(config)
  }

  return r2Instance
}
