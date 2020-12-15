import { Execute, DNSResponseAnswer, AdapterResponse } from '@chainlink/types'
import { Validator } from '@chainlink/external-adapter'
import { dns } from '@chainlink/ea-factories'

const customParams = {
  Answer: true,
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { Answer } = validator.validated.data

  const record = 'adex-publisher'
  const publisher = Answer.find((ans: DNSResponseAnswer) => {
    return ans.data.includes(record)
  })

  const response: AdapterResponse = {
    jobRunID,
    statusCode: 200,
    data: !!publisher,
    result: !!publisher,
  }
  return response
}

export const makeExecute = (): any => {
  const { DNSProviders, make } = dns
  const config = {
    endpoint: DNSProviders.Cloudfare,
    execute,
  }
  return make(config)
}
