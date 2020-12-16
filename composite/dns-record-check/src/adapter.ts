import { Execute, DNSResponseAnswer, AdapterRequest, DNSResponse } from '@chainlink/types'
import { Validator } from '@chainlink/external-adapter'
import DNS from '@chainlink/dns-query'
import { Requester } from '@chainlink/external-adapter'

const inputParams = {
  record: true,
  ...DNS.inputParams,
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { record, ...dnsInputParams } = validator.validated.data

  const dnsRequest: AdapterRequest = {
    id: jobRunID,
    data: dnsInputParams,
  }
  const dnsResponse = await DNS.execute(dnsRequest)
  const dnsData: DNSResponse = { ...dnsResponse.data }
  const foundRecord = dnsData.Answer.find((ans: DNSResponseAnswer) => ans.data.includes(record))

  return Requester.success(jobRunID, {
    status: 200,
    data: {
      result: !!foundRecord,
    },
  })
}

export default execute
