import { DNSResponse, Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

export enum DNSProviders {
  Cloudfare = 'cloudfare',
  Google = 'google',
}

export const endpoints: Record<string, string> = {
  [DNSProviders.Cloudfare]: 'https://cloudflare-dns.com/dns-query',
  [DNSProviders.Google]: 'https://dns.google/dns-query',
}

export const inputParams = {
  name: true,
  type: true,
  do: false,
  cd: false,
}

export const execute: Execute = async (input) => {
  try {
    const validator = new Validator(input, inputParams)
    if (validator.error) throw validator.error

    const dnsProvider = util.getRequiredEnv('DNS_PROVIDER')
    if (!Object.values(DNSProviders).includes(dnsProvider))
      throw new Error(`Unknown DNS Provider: ${dnsProvider}`)

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

    const result = await Requester.request({
      url: endpoints[dnsProvider],
      headers,
      params,
    })

    const data: DNSResponse = { ...result.data }

    return Requester.success(jobRunID, {
      status: 200,
      data: data,
    })
  } catch (e) {
    console.error(e)
  }
}
