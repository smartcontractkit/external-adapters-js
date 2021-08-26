import '@nomiclabs/hardhat-ethers'
import 'hardhat-deploy'
import 'hardhat-contract-sizer'
import 'hardhat-abi-exporter'
import 'hardhat-docgen'

import resolve from 'resolve'
import path from 'path'

import { HardhatUserConfig } from 'hardhat/config'

const smartPath = resolve.sync('@augurproject/smart', { basedir: __dirname })

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
export const NO_OWNER = '0x0000000000000000000000000000000000000001'

export const config: HardhatUserConfig = {
  external: {
    contracts: [
      {
        artifacts: path.resolve(smartPath, '../../dist/artifacts'),
        deploy: path.resolve(smartPath, '../../dist/deploy'),
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
    owner: {
      default: 0,
      maticMainnet: NO_OWNER,
    },
    protocol: {
      default: 0,
      maticMainnet: NULL_ADDRESS,
    },
    linkNode: {
      default: 0,
      maticMainnet: '0x6FBD37365bac1fC61EAb2b35ba4024B32b136be6',
    },
  },
  networks: {
    hardhat: {},
  },
  paths: {
    tests: './test/hardhat',
  },
  solidity: {
    compilers: [
      {
        version: '0.7.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.6.0',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.5.15',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
}
export default config
