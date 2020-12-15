import { Execute, DNSResponseAnswer, AdapterResponse } from '@chainlink/types'
import { Validator } from '@chainlink/external-adapter'
import { DNS } from '@chainlink/ea-factories'
import { util } from '@chainlink/ea-bootstrap'
import { DNSConfig } from '@chainlink/ea-factories/dist/factories/dns'

const customParams = {
  Answer: true,
  record: true,
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { Answer, record } = validator.validated.data

  const foundRecord = Answer.find((ans: DNSResponseAnswer) => ans.data.includes(record))

  const response: AdapterResponse = {
    jobRunID,
    statusCode: 200,
    data: !!foundRecord,
    result: !!foundRecord,
  }
  return response
}

export const makeExecute = (): Execute => {
  const { DNSProviders, make } = DNS
  const dnsProvider = util.getRequiredEnv('DNS_PROVIDER')
  if (!Object.keys(DNSProviders).includes(dnsProvider))
    throw new Error(`Unknown DNS Provider: ${dnsProvider}`)

  const config: DNSConfig = {
    api: {
      url: DNSProviders[dnsProvider],
    },
    execute,
  }
  return make(config)
}
