import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/types'
import { Validator } from '@chainlink/ea-bootstrap'
import { Requester } from '@chainlink/ea-bootstrap'
import * as DNS from '@chainlink/dns-query-adapter'
import { DNSQueryResponse, DNSAnswer } from '@chainlink/dns-query-adapter/dist/types'
import { makeConfig } from './config'

const inputParams = {
  name: ['name', 'record'],
  type: true,
  do: false,
  cd: false,
}

const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParams)

  const jobRunID = validator.validated.id
  const { name } = validator.validated.data

  const dnsExecute = DNS.makeExecute(config)
  const dnsResponse = await dnsExecute(input, context)
  const dnsData: DNSQueryResponse = { ...dnsResponse.result }
  const foundRecord = dnsData.Answer.find((ans: DNSAnswer) => ans.name.includes(name))

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
