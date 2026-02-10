import * as adaBalance from '@chainlink/ada-balance-adapter'
import * as amberdata from '@chainlink/amberdata-adapter'
import { adapter as avalanchePlatform } from '@chainlink/avalanche-platform-adapter'
import * as bitcoinJsonRpc from '@chainlink/bitcoin-json-rpc-adapter'
import * as blockchainCom from '@chainlink/blockchain.com-adapter'
import * as blockchair from '@chainlink/blockchair-adapter'
import * as btcCom from '@chainlink/btc.com-adapter'
import { adapter as ceffu } from '@chainlink/ceffu-adapter'
import * as cryptoapis from '@chainlink/cryptoapis-adapter'
import type { AdapterImplementation as v2AdapterImplementation } from '@chainlink/ea-bootstrap'
import * as ethBalance from '@chainlink/eth-balance-adapter'
import { adapter as ethBeacon } from '@chainlink/eth-beacon-adapter'
import { Adapter as v3AdapterImplementation } from '@chainlink/external-adapter-framework/adapter'
import { adapter as lotus } from '@chainlink/lotus-adapter'
import { adapter as polkadotBalance } from '@chainlink/polkadot-balance-adapter'
import { adapter as porIndexer } from '@chainlink/por-indexer-adapter'
import * as sochain from '@chainlink/sochain-adapter'
import { adapter as staderBalance } from '@chainlink/stader-balance-adapter'
import { adapter as tokenBalance } from '@chainlink/token-balance-adapter'
import { adapter as viewFunctionMultiChain } from '@chainlink/view-function-multi-chain-adapter'
import {
  adapterNamesV2 as balanceAdapterNamesV2,
  adapterNamesV3 as balanceAdapterNamesV3,
} from '../../src/utils/balance'
import {
  adapterNamesV2 as protocolAdapterNamesV2,
  adapterNamesV3 as protocolAdapterNamesV3,
} from '../../src/utils/protocol'

import * as celsiusAddressList from '@chainlink/celsius-address-list-adapter'
import * as chainReserveWallets from '@chainlink/chain-reserve-wallet-adapter'
import { adapter as coinbasePrime } from '@chainlink/coinbase-prime-adapter'
import { adapter as gemini } from '@chainlink/gemini-adapter'
import { adapter as ignitionAddressList } from '@chainlink/ignition-address-list-adapter'
import { adapter as moonbeamAddressList } from '@chainlink/moonbeam-address-list-adapter'
import { adapter as multiAddressList } from '@chainlink/multi-address-list-adapter'
import { adapter as porAddressList } from '@chainlink/por-address-list-adapter'
import { adapter as staderList } from '@chainlink/stader-address-list-adapter'
import * as swellList from '@chainlink/swell-address-list-adapter'
import { adapter as wBTC } from '@chainlink/wbtc-address-set-adapter'
import * as wrapped from '@chainlink/wrapped-adapter'

describe('Type safe adapter names', () => {
  describe('Balance adapters', () => {
    describe('Adapters V2 Names', () => {
      const expectedAdaptersV2: v2AdapterImplementation[] = [
        amberdata as unknown as v2AdapterImplementation,
        bitcoinJsonRpc as unknown as v2AdapterImplementation,
        blockchainCom as unknown as v2AdapterImplementation,
        blockchair as unknown as v2AdapterImplementation,
        btcCom as unknown as v2AdapterImplementation,
        cryptoapis as unknown as v2AdapterImplementation,
        sochain as unknown as v2AdapterImplementation,
        ethBalance as unknown as v2AdapterImplementation,
        adaBalance as unknown as v2AdapterImplementation,
      ]

      const adapterNamesV2 = balanceAdapterNamesV2

      it('should have the correct adapter names', () => {
        const expectedNames = expectedAdaptersV2.map((adapter) => adapter.NAME)
        const actualNames = Object.values(adapterNamesV2)
        expect(actualNames.sort()).toEqual(expectedNames.sort())
      })
    })

    describe('Adapters V3 Names', () => {
      const expectedAdaptersV3: v3AdapterImplementation[] = [
        polkadotBalance,
        staderBalance,
        ethBeacon,
        avalanchePlatform,
        lotus,
        porIndexer,
        tokenBalance,
        ceffu,
        viewFunctionMultiChain,
      ]

      const adapterNamesV3 = balanceAdapterNamesV3

      it('should have the correct adapter names', () => {
        const expectedNames = expectedAdaptersV3.map((adapter) => adapter.name)
        const actualNames = Object.values(adapterNamesV3)
        expect(actualNames.sort()).toEqual(expectedNames.sort())
      })
    })
  })

  describe('Protocol adapters', () => {
    describe('Adapters V2 Names', () => {
      const expectedAdaptersV2: v2AdapterImplementation[] = [
        celsiusAddressList as unknown as v2AdapterImplementation,
        chainReserveWallets as unknown as v2AdapterImplementation,
        wrapped as unknown as v2AdapterImplementation,
        swellList as unknown as v2AdapterImplementation,
      ]

      const adapterNamesV2 = protocolAdapterNamesV2

      it('should have the correct adapter names', () => {
        const expectedNames = expectedAdaptersV2.map((adapter) => adapter.NAME)
        const actualNames = Object.values(adapterNamesV2)
        expect(actualNames.sort()).toEqual(expectedNames.sort())
      })
    })

    describe('Adapters V3 Names', () => {
      const expectedAdaptersV3 = [
        moonbeamAddressList,
        staderList,
        wBTC,
        gemini,
        porAddressList,
        coinbasePrime,
        multiAddressList,
        ignitionAddressList,
      ]

      const adapterNamesV3 = protocolAdapterNamesV3

      it('should have the correct adapter names', () => {
        const expectedNames = expectedAdaptersV3.map((adapter) => adapter.name)
        const actualNames = Object.values(adapterNamesV3)
        expect(actualNames.sort()).toEqual(expectedNames.sort())
      })
    })
  })
})
