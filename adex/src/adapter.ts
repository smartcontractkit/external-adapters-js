import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'

const customParams = {
  Answer: true,
}

type DNSAnswer = {
  name: string
  type: number
  TTL: number
  data: string
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { Answer } = validator.validated.data

  const record = 'adex-publisher'
  const publisher = Answer.find((ans: DNSAnswer) => ans.data.includes(record))

  const response = {
    status: 200,
    data: { result: !!publisher },
  }
  return Requester.success(jobRunID, response)
}
