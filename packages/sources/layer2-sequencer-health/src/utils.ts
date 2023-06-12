import { util } from '@chainlink/ea-bootstrap'
import { ExtendedConfig } from './config'

export interface ResponseSchema {
  result: number
}

export async function retry<T>({
  promise,
  retryConfig,
}: {
  promise: () => Promise<T>
  retryConfig: ExtendedConfig['retryConfig']
}): Promise<T> {
  let numTries = 0
  let error
  while (numTries < retryConfig.numRetries) {
    try {
      return await promise()
    } catch (e) {
      error = e
      numTries++
      await util.sleep(retryConfig.retryInterval)
    }
  }
  throw error
}

export function race<T>({
  promise,
  timeout,
  error,
}: {
  promise: Promise<T>
  timeout: number
  error: string
}): Promise<T> {
  let timer: NodeJS.Timeout

  return Promise.race([
    new Promise((_, reject) => {
      timer = setTimeout(reject, timeout, error)
    }) as Promise<T>,
    promise.then((value) => {
      clearTimeout(timer)
      return value
    }),
  ])
}
