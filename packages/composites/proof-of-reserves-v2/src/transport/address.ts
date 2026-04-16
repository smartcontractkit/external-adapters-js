import objectPath from 'object-path'
import { RequestParams } from '../endpoint/reserves'
import { checkAddressList } from '../utils/validation'
import { Fetcher, Stringifier } from './types'

type AddressListConfig = RequestParams['addressLists'][number]

class AddressList {
  fetchFromProvider: Fetcher
  shortJsonForError: Stringifier

  addressArray: Promise<unknown[]>

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
    this.addressArray = this._fetchAddressArray(config)
  }

  async getAddressArray(): Promise<unknown[]> {
    return this.addressArray
  }

  private async _fetchAddressArray(config: AddressListConfig): Promise<unknown[]> {
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

    return addressArray
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

  async getAddressArray(name: string | undefined): Promise<unknown[] | undefined> {
    if (name === undefined) {
      return undefined
    }
    // Validation guarantees that the name is present in the config.
    const addressList = this.addressListMap[name]!
    return addressList.getAddressArray()
  }
}
