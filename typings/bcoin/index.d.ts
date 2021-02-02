declare module 'bcoin' {
  export type Base58String = string
  export type Bech32String = string
  export type AddressString = Base58String | Bech32String

  export type Hash = Buffer | string

  export class Address {
  }

  export class Script {
    constructor(code: Buffer | Array | object)

    static fromAddress(address: Address | AddressString): Script

    sha256(): Buffer
    sha256(enc: 'hex'): string
  }
}
