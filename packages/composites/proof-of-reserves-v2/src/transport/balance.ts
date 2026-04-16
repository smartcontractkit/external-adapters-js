import objectPath from 'object-path'
import { RequestParams } from '../endpoint/reserves'
import { FixedPoint, getFixedPointFromResult } from '../utils/fixed-point'
import { Fetcher, Stringifier } from './types'

type BalanceSourceConfig = RequestParams['balanceSources'][number]

export class BalanceSource {
  config: BalanceSourceConfig
  defaultDecimals: number
  fetchFromProvider: Fetcher
  shortJsonForError: Stringifier

  constructor({
    config,
    defaultDecimals,
    fetchFromProvider,
    shortJsonForError,
  }: {
    config: BalanceSourceConfig
    defaultDecimals: number
    fetchFromProvider: Fetcher
    shortJsonForError: Stringifier
  }) {
    this.config = config
    this.defaultDecimals = defaultDecimals
    this.fetchFromProvider = fetchFromProvider
    this.shortJsonForError = shortJsonForError
  }

  async fetchBalances(addressArray: unknown[] | undefined): Promise<{
    balances: FixedPoint[]
    addressCount: number | undefined
  }> {
    const balanceProviderParams = JSON.parse(this.config.params)

    if (this.config.addressArrayPath !== undefined) {
      objectPath.set(balanceProviderParams, this.config.addressArrayPath, addressArray)
    }

    const responseData = await this.fetchFromProvider(this.config.provider, balanceProviderParams)

    const balanceArray: Record<string, unknown>[] =
      this.config.balancesArrayPath !== undefined
        ? objectPath.get(responseData, this.config.balancesArrayPath)
        : [responseData]
    if (balanceArray === undefined) {
      throw new Error(
        `Balances array not found at path '${
          this.config.balancesArrayPath
        }' in response '${this.shortJsonForError(responseData)}' from provider '${
          this.config.provider
        }'`,
      )
    }

    if (!Array.isArray(balanceArray)) {
      throw new Error(
        `Expected an array of balance items at path '${
          this.config.balancesArrayPath
        }' in response from provider '${this.config.provider}'. Found '${this.shortJsonForError(
          balanceArray,
        )}'.`,
      )
    }

    const balances: FixedPoint[] = balanceArray.map((item) => {
      try {
        return getFixedPointFromResult({
          result: item,
          amountPath: this.config.balancePath,
          decimalsPath: this.config.decimalsPath,
          defaultDecimals: this.defaultDecimals,
        })
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(
          `Error getting balance: ${errorMessage} for element '${this.shortJsonForError(
            item,
          )}' in response from provider '${this.config.provider}'`,
        )
      }
    })

    return {
      balances,
      addressCount: this.config.balancesArrayPath !== undefined ? balanceArray.length : undefined,
    }
  }
}

export class BalanceSourceRepo {
  balanceSourceMap: Record<string, BalanceSource>

  constructor({
    config,
    defaultDecimals,
    fetchFromProvider,
    shortJsonForError,
  }: {
    config: BalanceSourceConfig[]
    defaultDecimals: number
    fetchFromProvider: Fetcher
    shortJsonForError: Stringifier
  }) {
    this.balanceSourceMap = Object.fromEntries(
      config.map((balanceSourceConfig) => [
        balanceSourceConfig.name,
        new BalanceSource({
          config: balanceSourceConfig,
          defaultDecimals,
          fetchFromProvider,
          shortJsonForError,
        }),
      ]),
    )
  }

  async fetchBalances(
    name: string,
    addressArray: unknown[] | undefined,
  ): Promise<{
    balances: FixedPoint[]
    addressCount: number | undefined
  }> {
    // Validation guarantees that the name is present in the config.
    const balanceSource = this.balanceSourceMap[name]!
    return balanceSource.fetchBalances(addressArray)
  }
}
