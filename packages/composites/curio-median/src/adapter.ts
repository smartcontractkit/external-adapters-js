import { Requester, Validator, Logger } from '@chainlink/ea-bootstrap'
import { AdapterRequest, AdapterResponse, Execute } from '@chainlink/types'
import * as expertCarBroker from '@chainlink/expert-car-broker-adapter'

const customParams = {
  feeds: true,
  allowedFaults: true,
  product: true
}

export const execute = async (input: AdapterRequest): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const feeds: number[] = validator.validated.data.feeds
  const allowedFaults = validator.validated.data.allowedFaults
  const product = validator.validated.data.product

  const endpoint = 'feed'
  const execute = expertCarBroker.makeExecute()
  const executes = feeds.map(feedId => execute({ id: jobRunID, data: { feedId, endpoint, product }}))

  const responses = await Promise.allSettled(executes)
  const rejected = (responses.filter(response => response.status === 'rejected') as PromiseRejectedResult[])
  rejected.forEach(response => Logger.error(response.reason))

  if (rejected.length > allowedFaults) {
    throw Error(`Number of faults (${rejected.length}) surpasses allowed faults (${allowedFaults})`)
  }

  const results = (responses.filter(response => response.status === 'fulfilled') as PromiseFulfilledResult<AdapterResponse>[])
    .map(response => response.value.result)

  const result = median(results)
  const response = { data: { result }, status: 200 }
  return Requester.success(jobRunID, response)
}

const median = (values: number[]): number => {
  if (values.length === 0) return 0
  values.sort((a, b) => a - b)
  const half = Math.floor(values.length / 2)
  if (values.length % 2) return values[half]
  return (values[half - 1] + values[half]) / 2.0
}

export const makeExecute = (): Execute => {
  return async (request: AdapterRequest) => execute(request)
}
