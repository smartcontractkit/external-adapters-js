import { ExecuteWithConfig, InputParameters, Config } from '@chainlink/ea-bootstrap'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import * as DNS from '@chainlink/dns-query-adapter'
import { DNSQueryResponse, DNSAnswer } from '@chainlink/dns-query-adapter/dist/types'

export const supportedEndpoints = ['dnsQuery']

export type TInputParameters = {
  name: string
  type: string
  do?: boolean | 'false'
  cd?: boolean | 'false'
}

const inputParameters: InputParameters<TInputParameters> = {
  name: {
    aliases: ['record'],
    required: true,
    description: 'name of record, eg: "adex-publisher"',
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
      'CD bit - set to disable validation (either boolean or numeric value), eg. "false" ',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const { name } = validator.validated.data

  const dnsExecute = DNS.makeExecute(config)
  // TODO: makeExecute return types

  const dnsResponse = await dnsExecute(request as any, context)
  const dnsData: DNSQueryResponse = { ...(dnsResponse.result as any) }
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
