// Hardhat configuration
// See (https://hardhat.org/config/) for more details.

// const { MNEMONIC } = require('./test.env')
// const MNEMONIC = 'novel mobile inform nurse circle spoon cricket soup crowd clip hawk glad'
const { TESTING_PRIVATE_KEY } = require('./test-helpers/src/hardhat')

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
      // mnemonic: process.env.MNEMONIC,
      // count: 5,
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
