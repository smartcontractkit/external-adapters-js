import { buildTable } from './table'
import { TextRow } from './types'

export const paramHeaders: TextRow = [
  'Required?',
  'Name',
  'Description',
  'Type',
  'Options',
  'Default',
]

export const inputParamHeaders: TextRow = [
  'Required?',
  'Name',
  'Aliases',
  'Description',
  'Type',
  'Options',
  'Default',
  'Depends On',
  'Not Valid With',
]

const balanceInputParams = [
  [
    '✅',
    'addresses',
    '',
    'Array of objects with address information as defined below',
    'array',
    '',
    '',
    '',
    '',
  ],
  ['', 'confirmations', '', 'Confirmations parameter', 'number', '', '`6`', '', ''],
  ['', 'dataPath', '', 'Path where to find the addresses array', 'string', '', '`result`', '', ''],
]

const addressesInputParams = [
  ['✅', 'address', 'Address to query', 'string', '', ''],
  [
    '',
    'chain',
    'Chain to query (Ethereum testnet is Rinkeby)',
    'string',
    '`mainnet`, `testnet`',
    '`mainnet`',
  ],
  [
    '',
    'coin',
    'Currency to query',
    'string',
    'Ex. `bch`, `btc`, `btsv`, `eth`, `ltc`, `zec`',
    '`btc`',
  ],
]

export function getBalanceTable(): string {
  const inputParamTable = buildTable(balanceInputParams, inputParamHeaders)
  const addressesTable = buildTable(addressesInputParams, paramHeaders)
  return (
    inputParamTable +
    '\n\nAddress objects within `addresses` have the following properties:\n\n' +
    addressesTable
  )
}
