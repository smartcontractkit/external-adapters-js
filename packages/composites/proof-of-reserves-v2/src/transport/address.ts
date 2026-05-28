import objectPath from 'object-path'
import { RequestParams } from '../endpoint/reserves'
import { checkAddressList } from '../utils/validation'
import { Fetcher, Stringifier } from './types'
import { getRipcord } from './utils'

type AddressListConfig = RequestParams['addressLists'][number]

type AddressListResult = {
  addressArray: unknown[]
  ripcord?: boolean
}

class AddressList {
  fetchFromProvider: Fetcher
  shortJsonForError: Stringifier

  addressListResult: Promise<AddressListResult>

  constructor({
    config,
    fetchFromProvider,
    shortJsonForError,
  }: {
    config: AddressListConfig
    fetchFromProvider: Fetcher
    shortJsonForError: Stringifier
  }) {
    this.fetchFromProvider = fetchFromProvider
    this.shortJsonForError = shortJsonForError
    this.addressListResult = this._fetchAddressListResult(config)
  }

  async getAddressListResult(): Promise<AddressListResult> {
    return this.addressListResult
  }

  private async _fetchAddressListResult(config: AddressListConfig): Promise<AddressListResult> {
    checkAddressList(config)

    if (config.fixed !== undefined) {
      // Was already validated to be a JSON array string in validation.
      return JSON.parse(config.fixed)
    }

    const addressResponseData = await this.fetchFromProvider(
      config.provider,
      JSON.parse(config.params),
    )
    const addressArray = objectPath.get(addressResponseData, config.addressArrayPath)
    const ripcord = getRipcord(addressResponseData, config.ripcord)

    if (addressArray === undefined) {
      throw new Error(
        `Address array not found at path '${
          config.addressArrayPath
        }' in response '${this.shortJsonForError(addressResponseData)}' from provider '${
          config.provider
        }'`,
      )
    }
    if (!Array.isArray(addressArray)) {
      throw new Error(
        `Expected an array of addresses at path ${
          config.addressArrayPath
        } in response from provider ${config.provider}. Found '${this.shortJsonForError(
          addressArray,
        )}'.`,
      )
    }

    return { addressArray, ripcord }
  }
}

export class AddressListRepo {
  addressListMap: Record<string, AddressList>

  constructor({
    config,
    fetchFromProvider,
    shortJsonForError,
  }: {
    config: AddressListConfig[]
    fetchFromProvider: Fetcher
    shortJsonForError: Stringifier
  }) {
    this.addressListMap = Object.fromEntries(
      config.map((addressListConfig) => [
        addressListConfig.name,
        new AddressList({
          config: addressListConfig,
          fetchFromProvider,
          shortJsonForError,
        }),
      ]),
    )
  }

  async getAddressListResult(name: string | undefined): Promise<AddressListResult> {
    if (name === undefined) {
      return { addressArray: [] }
    }
    // Validation guarantees that the name is present in the config.
    const addressList = this.addressListMap[name]!
    return addressList.getAddressListResult()
  }
}
