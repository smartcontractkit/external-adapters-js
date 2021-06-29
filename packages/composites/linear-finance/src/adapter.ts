import { Requester, Validator } from '@chainlink/external-adapter'
import { Execute, ExecuteWithConfig } from '@chainlink/types'
import { makeConfig, Config } from './config'
import { parseData } from './csv'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'
import { AxiosResponse } from 'axios'
import * as fs from 'fs'

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID

  const csvData = await getCsvFile(config)
  const allocations = await parseData(csvData)

  const _execute = TokenAllocation.makeExecute()
  return await _execute({ id: jobRunID, data: { ...input.data, allocations } })
}

export const makeExecute = (config?: Config): Execute => {
  return async (request) => execute(request, config || makeConfig())
}

const getCsvFile = async (config: Config): Promise<string> => {
  const filePrefix = 'file://'
  if (config.csvURL.startsWith(filePrefix)) {
    return fs.readFileSync(config.csvURL.substring(filePrefix.length), 'utf-8')
  }

  const options = {
    ...config.api,
    baseURL: config.csvURL,
  }
  const response = (await Requester.request(options)) as AxiosResponse<unknown>
  return response.data as string
}
