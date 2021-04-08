import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'
import { S3Client, SelectObjectContentCommand } from '@aws-sdk/client-s3'

export const NAME = 'lookup-address'

const customParams = {
  network: false,
  lookup_address: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const network = validator.validated.data.network || 'ETH'
  const lookupAddress = validator.validated.data.lookup_address
  const accessKeyId = util.getEnv('ACCESS_KEY')
  const secretAccessKey = util.getEnv('SECRET_KEY')

  const client = new S3Client({
    region: 'us-east-2',
    credentials: { accessKeyId, secretAccessKey },
  })
  const resp = await client.send(
    new SelectObjectContentCommand({
      Bucket: 'adapter-ciphertrace',
      Key: 'ciphertrace.csv',
      InputSerialization: {
        CSV: { FileHeaderInfo: 'USE' },
        CompressionType: 'NONE',
      },
      OutputSerialization: {
        JSON: { RecordDelimiter: ',' },
      },
      ExpressionType: 'SQL',
      Expression: 'SELECT * FROM s3object s',
    }),
  )

  const records = []
  if (resp.Payload)
    for await (const val of resp.Payload) {
      if (val.Records) records.push(val.Records?.Payload)
    }

  let recordString = Buffer.concat(records as Uint8Array[]).toString('utf8')
  recordString = `[${recordString.substring(0, recordString.length - 1)}]`

  const recordObject = JSON.parse(recordString)

  const result =
    recordObject.findIndex(
      (record: { Blockchain: string; Address: string }) =>
        record.Blockchain === network &&
        record.Address.toLowerCase() === lookupAddress.toLowerCase(),
    ) > -1

  return Requester.success(jobRunID, {
    data: config.verbose ? { result } : { result },
    result,
    status: 200,
  })
}
