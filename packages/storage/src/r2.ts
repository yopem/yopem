import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3"
import { Result, TaggedError } from "better-result"
import { nanoid } from "nanoid"
import sharp from "sharp"
import { transliterate as tr } from "transliteration"
import {
  cfAccountId,
  r2AccessKey,
  r2Bucket,
  r2Domain,
  r2SecretKey,
} from "~env/hono"

type AssetType = "images" | "videos" | "documents" | "archives" | "others"

interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicUrl: string
}

export class StorageValidationError extends TaggedError(
  "StorageValidationError",
)<{
  message: string
}>() {}

export class StorageUploadError extends TaggedError("StorageUploadError")<{
  message: string
  cause?: unknown
}>() {}

export class StorageDeleteError extends TaggedError("StorageDeleteError")<{
  message: string
  cause?: unknown
}>() {}

export type StorageError =
  | StorageValidationError
  | StorageUploadError
  | StorageDeleteError

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
  private bucketName: string
  private publicUrl: string

  constructor(config: R2Config) {
    const clientConfig: S3ClientConfig = {
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }

    this.client = new S3Client(clientConfig)
    this.bucketName = config.bucketName
    this.publicUrl = config.publicUrl
  }

  uploadImage(
    buffer: Buffer,
    _contentType: string,
  ): Promise<Result<string, StorageValidationError | StorageUploadError>> {
    if (buffer.length > MAX_IMAGE_SIZE) {
      return Promise.resolve(
        Result.err(
          new StorageValidationError({
            message: `Image size exceeds maximum allowed size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
          }),
        ),
      )
    }

    const extension = this.validateImageMagicBytes(buffer)
    if (!extension) {
      return Promise.resolve(
        Result.err(
          new StorageValidationError({ message: "Invalid image file type" }),
        ),
      )
    }

    return Result.gen(
      async function* (this: R2Storage) {
        const processed = yield* await this.processImage(buffer)
        const key = this.generateUniqueKey("images", "webp")
        yield* await this.uploadWithRetry(processed, key, "image/webp")
        return Result.ok(`${this.publicUrl}/${key}`)
      }.bind(this),
    )
  }

  uploadVideo(
    buffer: Buffer,
    contentType: string,
  ): Promise<Result<string, StorageValidationError | StorageUploadError>> {
    if (buffer.length > MAX_VIDEO_SIZE) {
      return Promise.resolve(
        Result.err(
          new StorageValidationError({
            message: `Video size exceeds maximum allowed size of ${MAX_VIDEO_SIZE / 1024 / 1024}MB`,
          }),
        ),
      )
    }

    const extension = this.validateVideoMagicBytes(buffer)
    if (!extension) {
      return Promise.resolve(
        Result.err(
          new StorageValidationError({ message: "Invalid video file type" }),
        ),
      )
    }

    return Result.gen(
      async function* (this: R2Storage) {
        const key = this.generateUniqueKey("videos", extension)
        yield* await this.uploadWithRetry(buffer, key, contentType)
        return Result.ok(`${this.publicUrl}/${key}`)
      }.bind(this),
    )
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

  private processImage(
    buffer: Buffer,
  ): Promise<Result<Buffer, StorageUploadError>> {
    return Result.tryPromise({
      try: () =>
        sharp(buffer)
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer(),
      catch: (e) =>
        new StorageUploadError({
          message: `Failed to process image: ${e instanceof Error ? e.message : "Unknown error"}`,
          cause: e,
        }),
    })
  }

  private uploadWithRetry(
    buffer: Buffer,
    key: string,
    contentType: string,
    retryCount = 0,
  ): Promise<Result<void, StorageUploadError>> {
    return Result.tryPromise({
      try: async () => {
        try {
          const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
          })
          await this.client.send(command)
        } catch (error) {
          if (retryCount < 1) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
            const retryResult = await this.uploadWithRetry(
              buffer,
              key,
              contentType,
              retryCount + 1,
            )
            if (Result.isError(retryResult)) throw retryResult.error
            return
          }
          throw error
        }
      },
      catch: (e) =>
        new StorageUploadError({
          message: `Failed to upload to R2 after retry: ${e instanceof Error ? e.message : "Unknown error"}`,
          cause: e,
        }),
    })
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

  uploadAsset(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string,
  ): Promise<
    Result<
      { url: string; type: AssetType; size: number; key: string },
      StorageUploadError
    >
  > {
    return Result.gen(
      async function* (this: R2Storage) {
        const type = this.classifyFileType(mimeType, originalFilename)

        let uploadBuffer = buffer
        let uploadMimeType = mimeType
        let extension = originalFilename.split(".").pop() ?? "bin"

        if (type === "images") {
          uploadBuffer = yield* await this.processImage(buffer)
          uploadMimeType = "image/webp"
          extension = "webp"
        }

        const baseName = tr(originalFilename.replace(/\.[^/.]+$/, ""))
        const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_")
        const uniqueId = nanoid(6)
        const filename = `${sanitizedBaseName}_${uniqueId}.${extension}`
        const key = `${type}/${filename}`

        yield* await this.uploadWithRetry(uploadBuffer, key, uploadMimeType)

        const publicUrlWithProtocol = this.publicUrl.startsWith("http")
          ? this.publicUrl
          : `https://${this.publicUrl}`

        return Result.ok({
          url: `${publicUrlWithProtocol}/${key}`,
          type,
          size: uploadBuffer.length,
          key,
        })
      }.bind(this),
    )
  }

  deleteFile(key: string): Promise<Result<void, StorageDeleteError>> {
    return Result.tryPromise({
      try: async () => {
        const command = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
        await this.client.send(command)
      },
      catch: (e) =>
        new StorageDeleteError({
          message: `Failed to delete from R2: ${e instanceof Error ? e.message : "Unknown error"}`,
          cause: e,
        }),
    })
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
