import { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'
import { AxiosResponse } from 'axios'
import { ResponseSchema } from '../../src/transport/transport'

export function clearTestCache(testAdapter: TestAdapter) {
  // clear EA cache
  const keys = testAdapter.mockCache?.cache.keys()
  if (!keys) {
    throw new Error('unexpected failure 1')
  }
  for (const key of keys) {
    testAdapter.mockCache?.delete(key)
  }
}

export function createMockResponse(
  data: ResponseSchema,
  status: number = 200,
  statusText: string = 'OK',
): AxiosResponse<ResponseSchema> {
  return {
    data,
    status,
    statusText,
    headers: {},
    config: {} as any,
  }
}
