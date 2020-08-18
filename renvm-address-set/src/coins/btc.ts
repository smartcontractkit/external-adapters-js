import * as bitcoin from 'bitcoinjs-lib'

export const getNetwork = (
  network: string
): bitcoin.networks.Network | undefined => {
  switch (network) {
    case 'mainnet':
      return bitcoin.networks.bitcoin
    case 'testnet':
      return bitcoin.networks.testnet
    default:
      return
  }
}

export const p2pkh = (
  hash: Buffer,
  network: bitcoin.networks.Network
): bitcoin.payments.Payment => bitcoin.payments.p2pkh({ hash, network })
