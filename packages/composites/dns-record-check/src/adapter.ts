import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/types'
import { Validator } from '@chainlink/ea-bootstrap'
import { Requester } from '@chainlink/ea-bootstrap'
import DNS from '@chainlink/dns-query-adapter'
import { DNSQueryResponse, DNSAnswer } from '@chainlink/dns-query-adapter/dist/types'
import { makeConfig } from './config'

const inputParams = {
  record: true,
}

const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { record } = validator.validated.data

  const dnsExecute = DNS.makeExecute(config)
  const dnsResponse = await dnsExecute(input, context)
  const dnsData: DNSQueryResponse = { ...dnsResponse.data }
  const foundRecord = dnsData.Answer.find((ans: DNSAnswer) => ans.data.includes(record))

  return Requester.success(
    jobRunID,
    {
      status: 200,
      data: {
        result: !!foundRecord,
      },
    },
    config.verbose,
  )
}

export const makeExecute: ExecuteFactory<Config> = (config?: Config) => (input, context) =>
  execute(input, context, config || makeConfig())
