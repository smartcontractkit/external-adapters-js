import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('s3utils')

// Note: any issues with S3 calls may be related to credentials.
// Ensure policy is set up or CLI login is functional with > aws s3 ls

const KEY_PREFIX_REGEX = /^[0-9a-zA-Z!\-_.*'()/]+$/
const KEY_PREFIX_INVALID = ['../']

const BUCKET_REGEX = /^[0-9a-z\-.]+$/
const BUCKET_INVALID = ['..']

export function isValidBucket(bucketName: string): boolean {
  return (
    BUCKET_REGEX.test(bucketName) &&
    !BUCKET_INVALID.some((invalidSubstring) => bucketName.includes(invalidSubstring))
  )
}

export function isValidKeyPrefix(keyPrefix: string): boolean {
  // all chars in the string must match one in KEY_PREFIX_REGEX
  return (
    KEY_PREFIX_REGEX.test(keyPrefix) &&
    !KEY_PREFIX_INVALID.some((invalidSubstring) => keyPrefix.includes(invalidSubstring))
  )
}

export async function bucketExistsS3(s3Client: S3Client, bucket: string): Promise<boolean> {
  const command = new HeadBucketCommand({
    Bucket: bucket,
  })
  try {
    await s3Client.send(command)
    logger.debug(`Bucket found in S3: ${bucket}`)
    return true
  } catch (error) {
    logger.debug(`Bucket ${bucket} not found: ${error}`)
  }

  return false
}

export async function fileExistsS3(
  s3Client: S3Client,
  bucket: string,
  key: string,
): Promise<boolean> {
  const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  try {
    await s3Client.send(command)
    logger.debug(`File found in S3: ${key}`)
    return true
  } catch (error) {
    logger.debug(`File does not exist in S3: ${error}`)
  }

  return false
}

export async function getFileFromS3(
  s3Client: S3Client,
  bucket: string,
  key: string,
): Promise<{ content: string; lastModified: Date | undefined }> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  try {
    const response = await s3Client.send(command)

    if (!response.Body) {
      throw new Error('S3 response is missing a body')
    }

    return {
      content: await response.Body.transformToString(),
      lastModified: response.LastModified,
    }
  } catch (error) {
    throw new Error(`Failed to get file from S3: ${error}`)
  }
}
