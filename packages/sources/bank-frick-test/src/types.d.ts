export interface Account {
  account: string // The account number of the account
  type: string // The type of the account
  iban: string // The iban of the account if exists
  customer: string // The customer data of the account which consists of the customer number and name
  currency: string // The account currency
  balance: number // The current account balance
  available: number // The available amount of the account as defined in the online banking
}
/**
 * Types representing what we send/receive from the bank frick api
 * See https://developers.bankfrick.li/docs#data-types for details
 */
export interface BankFrickAccountsResponseSchema {
  errors?: string[]
  date: Date
  moreResults: boolean
  resultSetSize: number
  accounts: Account[]
}
export interface BankFrickAccountsRequestSchema {
  firstPosition: number
  maxResults: number
}

/**
 * Types representing the input parameters and response of the adapter
 */
export interface AdapterInputParameters {
  ibanIDs: string[]
  signingAlgorithm?: SigningAlgorithm
}

/**
 * These are the options from the docs, but it's hard to see. See the first paragraph from this
 * page for details:  https://developers.bankfrick.li/docs#getting-started-signatures
 */
export type SigningAlgorithm = 'dsa-sha512' | 'rsa-sha256' | 'rsa-sha384' | 'rsa-sha512'
