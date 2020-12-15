import {
  ExecuteFactory,
  Config,
  DNSResponseAnswer,
  AdapterRequest,
  Execute,
} from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'

export enum DNSProviders {
  cloudfare = 'https://cloudflare-dns.com/dns-query',
  google = 'https://dns.google/dns-query',
}

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
  execute: Execute
}

const customParams = {
  name: true,
  type: true,
  do: false,
  cd: false,
  // Any additional parameters required by the underlying adapters. Needs to be an object
  additional: false,
}

export const make: ExecuteFactory<DNSConfig> = (config) => async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error
  if (!config) throw new Error('No configuration supplied')

  const jobRunID = validator.validated.id
  const { name, type, do: doBit, cd: cdBit, additional } = validator.validated.data

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
    url: config.api.url,
    headers,
    params,
  }

  const dnsResult = await Requester.request(dnsReqConfig)
  const adapterRequest: AdapterRequest = {
    id: jobRunID,
    data: Object.assign({}, dnsResult.data, additional),
  }
  const adapterResponse = await config.execute(adapterRequest)

  return Requester.success(jobRunID, {
    status: 200,
    data: adapterResponse,
  })
}
