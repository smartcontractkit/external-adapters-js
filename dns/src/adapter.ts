import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'

const customParams = {
  name: true,
  type: true,
  do: false,
  cd: false,
}

const baseUrl = 'https://cloudflare-dns.com/dns-query'

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { name, type, do: doBit, cd: cdBit } = validator.validated.data

  const params = {
    name,
    type,
    ...(doBit && { do: doBit }),
    ...(cdBit && { cd: cdBit }),
  }
  const headers = {
    Accept: 'application/dns-json',
  }

  const config = {
    url: baseUrl,
    headers,
    params,
  }

  try {
    const result = await Requester.request(config)
    const response = {
      status: 200,
      data: result.data,
    }
    return Requester.success(jobRunID, response)
  } catch (e) {
    console.log(e)
  }
}
