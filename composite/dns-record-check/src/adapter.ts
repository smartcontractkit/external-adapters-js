import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/types'
import { Validator } from '@chainlink/external-adapter'
import { Requester } from '@chainlink/external-adapter'
import DNS from '@chainlink/dns-query'
import { DNSResponse, DNSResponseAnswer } from '@chainlink/dns-query/dist/types'
import { makeConfig } from './config'

const inputParams = {
  record: true,
}

const execute: ExecuteWithConfig = async (input, config) => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { record } = validator.validated.data

  const dnsExecute = DNS.makeExecute(DNS.makeConfig())
  const dnsResponse = await dnsExecute(input)
  const dnsData: DNSResponse = { ...dnsResponse.data }
  const foundRecord = dnsData.Answer.find((ans: DNSResponseAnswer) => ans.data.includes(record))

  return Requester.success(jobRunID, {
    status: 200,
    data: {
      result: !!foundRecord,
    },
  })
}

export const makeExecute: ExecuteFactory = (config?: Config) => (input) =>
  execute(input, config || makeConfig())
