import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { makeConfig } from './config'
import { DNSQueryResponse } from './types'

export const inputParams = {
  name: true,
  type: true,
  do: false,
  cd: false,
}

const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, inputParams)
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

  const result = await Requester.request({
    url: config.api?.url,
    headers,
    params,
  })

  const data: DNSQueryResponse = { ...result.data }

  return Requester.success(jobRunID, {
    status: 200,
    data: data,
  })
}

export const makeExecute: ExecuteFactory<Config> = (config?: Config) => (input) =>
  execute(input, config || makeConfig())
