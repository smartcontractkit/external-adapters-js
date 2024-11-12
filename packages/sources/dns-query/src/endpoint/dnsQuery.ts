import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { DNSQueryResponse } from './../types'

export const supportedEndpoints = ['dnsQuery']

export const description = 'DNS Query lets query DNS over HTTPS (DoH)'

export type TInputParameters = { name: string; type: string; do: string; cd: string }
export const inputParameters: InputParameters<TInputParameters> = {
  name: {
    required: true,
    description: 'Query Name, eg. "example.com"',
  },
  type: {
    required: true,
    description: 'Query Type (either a numeric value or text), eg. "TXT"',
  },
  do: {
    required: false,
    description:
      'DO bit - set if client wants DNSSEC data (either boolean or numeric value), eg. "true"',
  },
  cd: {
    required: false,
    description:
      'CD bit - set to disable validation (either boolean or numeric value), eg. "false"',
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)

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

  const result = await Requester.request<DNSQueryResponse>({
    url: config.api?.url,
    headers,
    params,
  })

  const data = { ...result.data, result: result.data }

  return Requester.success(
    jobRunID,
    {
      status: 200,
      data,
    },
    config.verbose,
  )
}
