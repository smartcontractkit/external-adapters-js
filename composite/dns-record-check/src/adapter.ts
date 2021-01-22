import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/types'
import { Validator } from '@chainlink/external-adapter'
import { Requester } from '@chainlink/external-adapter'
import { dnsquery } from '@chainlink/ea/'
import { makeConfig } from './config'

const inputParams = {
  record: true,
}

const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { record } = validator.validated.data
  const dnsExecute = dnsquery.makeExecute(config)
  const dnsResponse = await dnsExecute(input)
  const dnsData: dnsquery.DNSQueryResponse = { ...dnsResponse.data }
  const foundRecord = dnsData.Answer.find((ans: dnsquery.DNSAnswer) => ans.data.includes(record))

  return Requester.success(jobRunID, {
    status: 200,
    data: {
      result: !!foundRecord,
    },
  })
}

export const makeExecute: ExecuteFactory<Config> = (config?: Config) => (input) =>
  execute(input, config || makeConfig())
