import { ethers } from 'ethers'
import { config } from '../../config'

export const CHAIN_OPTIONS = ['arbitrum', 'botanix', 'avalanche'] as const
export type ChainKey = (typeof CHAIN_OPTIONS)[number]

export type AdapterSettings = typeof config.settings

export type ChainResolvedSettings = {
  rpcUrl?: string
  chainId: number
  dataStoreAddress: string
  gmReaderAddress: string
  glvReaderAddress: string
  tokenMetadataUrl?: string
  marketMetadataUrl?: string
}

export const getResolvedChainSettings = (
  settings: AdapterSettings,
  chain: ChainKey,
): ChainResolvedSettings => {
  switch (chain) {
    case 'botanix':
      return {
        rpcUrl: settings.BOTANIX_RPC_URL,
        chainId: settings.BOTANIX_CHAIN_ID,
        dataStoreAddress: settings.BOTANIX_DATASTORE_CONTRACT_ADDRESS,
        gmReaderAddress: settings.BOTANIX_GM_READER_CONTRACT_ADDRESS,
        glvReaderAddress: settings.BOTANIX_GLV_READER_CONTRACT_ADDRESS,
        tokenMetadataUrl: settings.BOTANIX_TOKENS_INFO_URL,
        marketMetadataUrl: settings.BOTANIX_MARKETS_INFO_URL,
      }
    case 'avalanche':
      return {
        rpcUrl: settings.AVALANCHE_RPC_URL,
        chainId: settings.AVALANCHE_CHAIN_ID,
        dataStoreAddress: settings.AVALANCHE_DATASTORE_CONTRACT_ADDRESS,
        gmReaderAddress: settings.AVALANCHE_GM_READER_CONTRACT_ADDRESS,
        glvReaderAddress: settings.AVALANCHE_GLV_READER_CONTRACT_ADDRESS,
        tokenMetadataUrl: settings.AVALANCHE_TOKENS_INFO_URL,
        marketMetadataUrl: settings.AVALANCHE_MARKETS_INFO_URL,
      }
    case 'arbitrum':
      return {
        rpcUrl: settings.ARBITRUM_RPC_URL,
        chainId: settings.ARBITRUM_CHAIN_ID,
        dataStoreAddress: settings.ARBITRUM_DATASTORE_CONTRACT_ADDRESS,
        gmReaderAddress: settings.ARBITRUM_GM_READER_CONTRACT_ADDRESS,
        glvReaderAddress: settings.ARBITRUM_GLV_READER_CONTRACT_ADDRESS,
        tokenMetadataUrl: settings.ARBITRUM_TOKENS_INFO_URL,
        marketMetadataUrl: settings.ARBITRUM_MARKETS_INFO_URL,
      }
    default:
      throw new Error(`Unsupported chain: ${chain}`)
  }
}

export class ChainContextFactory {
  private readonly providers = new Map<ChainKey, ethers.JsonRpcProvider>()
  private readonly dataStores = new Map<ChainKey, ethers.Contract>()
  private readonly gmReaders = new Map<ChainKey, ethers.Contract>()
  private readonly glvReaders = new Map<ChainKey, ethers.Contract>()

  constructor(private readonly settings: AdapterSettings) {}

  private getChainSettings(chain: ChainKey): ChainResolvedSettings {
    return getResolvedChainSettings(this.settings, chain)
  }

  getProvider(chain: ChainKey): ethers.JsonRpcProvider {
    if (!this.providers.has(chain)) {
      const { rpcUrl, chainId } = this.getChainSettings(chain)
      this.providers.set(chain, new ethers.JsonRpcProvider(rpcUrl, chainId))
    }
    return this.providers.get(chain)!
  }

  getDataStoreAddress(chain: ChainKey): string {
    return this.getChainSettings(chain).dataStoreAddress
  }

  getDataStore(chain: ChainKey): ethers.Contract {
    if (!this.dataStores.has(chain)) {
      const dataStoreAddress = this.getDataStoreAddress(chain)
      const contract = new ethers.Contract(
        dataStoreAddress,
        ['function getBytes32(bytes32 key) view returns (bytes32)'],
        this.getProvider(chain),
      )
      this.dataStores.set(chain, contract)
    }
    return this.dataStores.get(chain)!
  }

  getReaderContract(chain: ChainKey, abi: ethers.InterfaceAbi): ethers.Contract {
    if (!this.gmReaders.has(chain)) {
      const { gmReaderAddress } = this.getChainSettings(chain)
      this.gmReaders.set(chain, new ethers.Contract(gmReaderAddress, abi, this.getProvider(chain)))
    }
    return this.gmReaders.get(chain)!
  }

  getGlvReaderContract(chain: ChainKey, abi: ethers.InterfaceAbi): ethers.Contract {
    if (!this.glvReaders.has(chain)) {
      const { glvReaderAddress } = this.getChainSettings(chain)
      this.glvReaders.set(
        chain,
        new ethers.Contract(glvReaderAddress, abi, this.getProvider(chain)),
      )
    }
    return this.glvReaders.get(chain)!
  }
}
