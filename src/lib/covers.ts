import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

let _r2: S3Client | null = null

function getR2(): S3Client {
  if (!_r2) {
    _r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return _r2
}

const BUCKET = () => process.env.R2_BUCKET_NAME!

/** Download a cover from sourceUrl and upload to R2. Returns the R2 key or null. */
export async function cacheCoverToR2(sourceUrl: string, bookId: string): Promise<string | null> {
  if (!sourceUrl || !process.env.R2_ACCOUNT_ID) return null

  const key = `covers/${bookId}.jpg`
  const r2 = getR2()

  // Already cached?
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET(), Key: key }))
    return key
  } catch {}

  // Fetch from source
  try {
    const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 2000) return null // skip placeholder images

    await r2.send(new PutObjectCommand({
      Bucket:       BUCKET(),
      Key:          key,
      Body:         buffer,
      ContentType:  'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    }))

    return key
  } catch (err) {
    console.error('[covers] R2 upload failed:', err)
    return null
  }
}

/** Return the public URL for a cached cover */
export function coverPublicUrl(r2Key: string): string {
  return `${process.env.R2_PUBLIC_URL}/${r2Key}`
}
