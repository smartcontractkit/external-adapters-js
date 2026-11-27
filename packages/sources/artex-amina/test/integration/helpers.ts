import type { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'

import {
  API_HOST_SANDBOX,
  PORTFOLIO,
  agreementNumber,
  hmacSecret,
  password,
  userId,
} from './fixtures'

// The six credential settings and the recorded sandbox host.
export const BASE_ENV: Record<string, string> = {
  AMINA_USER_ID: userId,
  AMINA_PASSWORD: password,
  AMINA_HMAC_SECRET: hmacSecret,
  AMINA_AGREEMENT_NUMBER: agreementNumber,
  AMINA_PORTFOLIO: PORTFOLIO,
  AMINA_ISIN: 'US0378331005',
  API_ENDPOINT: API_HOST_SANDBOX,
}

export const FIXED_NOW = new Date('2001-01-01T11:11:11.111Z').getTime()

export const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type EnvSnapshot = Record<string, string | undefined>

export function setEnv(overrides: Record<string, string | undefined>): EnvSnapshot {
  const saved: EnvSnapshot = {}
  for (const [key, value] of Object.entries(overrides)) {
    saved[key] = process.env[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
  return saved
}

export function restoreEnv(saved: EnvSnapshot): void {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

// A fresh module registry gives a fresh adapter, so the access token and the
// refresh token held by the transport start empty for every scenario.
async function startAdapter(): Promise<TestAdapter> {
  jest.resetModules()
  const { TestAdapter: FreshTestAdapter } = await import(
    '@chainlink/external-adapter-framework/util/testing-utils'
  )
  const { adapter } = await import('../../src')
  adapter.rateLimiting = undefined
  return FreshTestAdapter.startWithMockedCache(adapter, {
    testAdapter: {} as TestAdapter,
  }) as Promise<TestAdapter>
}

export async function withAdapter<T>(
  overrides: Record<string, string | undefined>,
  run: (testAdapter: TestAdapter) => Promise<T>,
): Promise<T> {
  const saved = setEnv(overrides)
  const testAdapter = await startAdapter()
  try {
    return await run(testAdapter)
  } finally {
    await testAdapter.api.close()
    restoreEnv(saved)
  }
}

export async function importConfig() {
  jest.resetModules()
  return import('../../src/config')
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function waitFor(check: () => boolean, timeoutMs = 8000): Promise<void> {
  const started = process.hrtime.bigint()
  while (!check()) {
    if (Number(process.hrtime.bigint() - started) / 1e6 > timeoutMs) {
      throw new Error(`condition was not met within ${timeoutMs} ms`)
    }
    await sleep(25)
  }
}

export type CapturedRequest = {
  uri: string
  headers: Record<string, string>
}
