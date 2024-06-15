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
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })
  let response
  try {
    response = await s3Client.send(command)
  } catch (error) {
    throw new Error(`Failed to get file from S3: ${error}`)
  }

  if (!response.Body) {
    throw new Error('S3 response is missing a body')
  }

  const csvContentsStr = await response.Body.transformToString()
  return csvContentsStr
}
