import { ExecuteFactory, Config, DNSResponseAnswer } from '@chainlink/types'
import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { logger } from '@chainlink/external-adapter'

export enum DNSProviders {
  Cloudfare = 'https://cloudflare-dns.com/dns-query',
  Google = 'https://dns.google/dns-query',
}

type DNSAdapterExecute = (dnsResponse: DNSResponse) => Promise<any>

type DNSResponseQuestion = {
  name: string
  type: number
}

type DNSResponse = {
  Status: number
  Question: DNSResponseQuestion[]
  Answer: DNSResponseAnswer[]
}

export type DNSConfig = Config & {
  endpoint: string
  execute: DNSAdapterExecute
}

const customParams = {
  name: true,
  type: true,
  do: false,
  cd: false,
}

export const make: ExecuteFactory<DNSConfig> = (config) => async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error
  if (!config) throw new Error('No configuration supplied')

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

  const dnsReqConfig = {
    url: config.endpoint,
    headers,
    params,
  }

  try {
    const dnsResult = await Requester.request(dnsReqConfig)
    const adapterResponse = config.execute(dnsResult.data)

    const response = {
      status: 200,
      data: adapterResponse,
    }
    return Requester.success(jobRunID, response)
  } catch (e) {
    console.log(e)
  }
}
