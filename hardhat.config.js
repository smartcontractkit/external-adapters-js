// Hardhat configuration
// See (https://hardhat.org/config/) for more details.

const { TESTING_PRIVATE_KEY } = require('./packages/core/test-helpers/src/hardhat_config.json')

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 31337,
      accounts: [
        {
          privateKey: TESTING_PRIVATE_KEY,
          balance: '10000000000000000000000',
        },
      ],
    },
  },
  // NOTE: The compiler isn't currently used, but this suppresses a warning
  solidity: {
    version: '0.5.15',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
}
