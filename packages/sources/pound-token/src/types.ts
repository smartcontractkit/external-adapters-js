//See https://developers.bankfrick.li/docs#data-types for details
export interface Account {
  account: string //The account number of the account
  type: string //The type of the account
  iban: string //The iban of the account if exists
  customer: string //The customer data of the account which consists of the customer number and name
  currency: string //The account currency
  balance: number //The current account balance
  available: number //The available amount of the account as defined in the online banking
}

export interface Accounts {
  date: string //The balance date (today)
  moreResults: boolean //Attribute indicates that more results are available on the server
  resultSetSize: number //Number of results in the returned result set
  accounts: Account[] //The list of accounts
}
//These are the options from the docs:
export type SigningAlgorithm = 'rsa-sha256' | 'rsa-sha384' | 'rsa-sha512'

// /v2/accounts
//
