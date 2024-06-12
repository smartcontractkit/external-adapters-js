import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

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
