const axios = require('axios')
const fs = require('fs/promises')

const main = async () => {
  const overridesFilePath = './src/config/overrides.json'

  const existingOverrides = JSON.parse(await fs.readFile(overridesFilePath, { encoding: 'utf8' }))[
    'coingecko'
  ]

  const response = await axios.get('https://api.coingecko.com/api/v3/coins/list')

  const mapped = response.data.reduce((acc, coin) => {
    const symbol = coin['symbol'].toUpperCase()
    if (!(symbol in acc)) {
      acc[symbol] = coin['id']
    } // Uncomment to add an array of duplicate symbols
    /*else {
            if (Array.isArray(acc[symbol])) {
                if (!acc[symbol].includes(coin['id'])) {
                    acc[symbol].push(coin['id'])
                }
            } else if (acc[symbol] !== coin['id']) {
                acc[symbol] = [acc[symbol], coin['id']]
            }
        }*/
    return acc
  }, existingOverrides)

  // Uncomment to flatten the overrides
  /*for (const symbol in mapped) {
        if (Array.isArray(mapped[symbol])) {
            mapped[symbol] = mapped[symbol][0]
        }
    }*/

  await fs.writeFile(overridesFilePath, JSON.stringify({ coingecko: mapped }, null, 2), {
    encoding: 'utf8',
  })
}

main().finally()
