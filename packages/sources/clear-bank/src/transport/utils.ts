export interface AccountsRequestSchema {
  PageNumber: number
  PageSize: number
}

export type ResponseSchema = {
  accounts: Account[]
}

export type Account = {
  id: string
  name: string
  currency: string[]
  balances: Balance[]
  minimumBalance: Balance
  status: 'NotProvided' | 'Enabled' | 'Closed' | 'Suspended' | 'CBRestricted'
  statusReason: string
  iban: string
  bban: string
  upic: string
  cuid: string
}

export type Balance = {
  name: string
  amount: number
  currency: string
  status: 'CLBD' | 'XPCD' | 'OTHR' | 'VALU'
  lastCommittedTransaction: string
}
