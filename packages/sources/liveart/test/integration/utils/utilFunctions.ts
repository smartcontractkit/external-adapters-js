import { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'

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
