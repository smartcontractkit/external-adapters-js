import { RoundManagement, CryptoMarketFactory } from '@augurproject/smart'
import { Logger, Requester } from '@chainlink/ea-bootstrap'
import { BigNumber, Contract } from 'ethers'
import { AdapterResponse } from '@chainlink/types'
import { ethers, deployments, getNamedAccounts } from 'hardhat'
import { expect, spy } from './chai-setup'
import { execute } from '../../src/adapter'
import { Config } from '../../src/config'
import { DateTime, Settings } from 'luxon'

async function addRounds(
  factory: CryptoMarketFactory,
  maxRounds: number,
  skipFirstRounds = 0,
): Promise<DateTime> {
  const coins = await factory.getCoins()
  const start = DateTime.fromObject({
    year: 2021,
    month: 8,
    day: 1,
    hour: 16,
    millisecond: 10, // setting this in purpose to make sure we're handling seconds properly
    zone: 'America/New_York',
  })

  for (let coin of coins.slice(1)) {
    let roundId = 1
    let phaseId = 1
    let currentRound = new RoundManagement(phaseId, roundId)
    const fakePrice = await ethers.getContract(`PriceFeed${coin.name}`)

    for (; roundId < maxRounds; ++roundId) {
      if (roundId >= skipFirstRounds) {
        const roundDate = BigNumber.from(Math.floor(start.plus({ days: roundId }).toSeconds()))
        await fakePrice.addRound(currentRound.id, roundId, roundDate, roundDate, roundId)
      }
      currentRound = currentRound.nextRound()
    }
  }

  return start.plus({ days: maxRounds - 1 })
}

describe('Augur Crypto Adapter', () => {
  let poke: (contractAddress: string) => Promise<AdapterResponse>
  before('poke', async () => {
    const { deployer } = await getNamedAccounts()
    const signer = await ethers.getSigner(deployer)

    const config = {
      ...Requester.getDefaultConfig(''),
      verbose: true,
      signer,
    }

    poke = (contractAddress: string) => {
      return execute(
        {
          id: '1',
          data: {
            method: 'poke',
            contractAddress,
          },
        },
        {},
        config,
      )
    }
  })

  beforeEach('fixtures', async () => {
    await deployments.fixture(['SetPriceFeeds', 'ConfigureCryptoMarketFactory'])
  })

  describe('add initial round', async () => {
    let factory: CryptoMarketFactory
    let coinCount: number
    beforeEach('factories', async () => {
      factory = (await ethers.getContract('CryptoMarketFactory')) as CryptoMarketFactory
      const coins = await factory.getCoins()
      coinCount = coins.length - 1
      // mock luxon datetime
      Settings.now = () => new Date('August 1, 2021').valueOf()
    })

    beforeEach(() => {
      spy.on(Logger, ['warn'])
    })

    afterEach(() => {
      spy.restore()
    })

    beforeEach(async () => {
      await addRounds(factory, 1)
    })

    it('creates initial markets on first poke', async () => {
      expect(coinCount).to.be.equal(6)
      await poke(factory.address)
      let nextResolutionTime = DateTime.fromObject({
        year: 2021,
        month: 8,
        day: 6,
        hour: 16,
        zone: 'America/New_York',
      })
      expect(await factory.nextResolutionTime()).to.equal(
        BigNumber.from(nextResolutionTime.toSeconds()),
      )

      // Should be one market for each coin after the 1st run
      expect(await factory.marketCount()).to.equal(1 + coinCount * 1)

      await poke(factory.address)
      expect(await factory.marketCount()).to.equal(1 + coinCount * 1)
      expect(Logger.warn).to.have.been.called.with('Augur: Next resolution time is in the future')
    })

    describe('progressing through rounds', function () {
      this.timeout(0)
      beforeEach(async () => {
        // Set up initial markets from the round set up in the beforeEach
        await poke(factory.address)
      })

      it('cannot yet resolve rounds after 5 days', async () => {
        const roundUpdatedAt = await addRounds(factory, 5, 1)
        const now = roundUpdatedAt.plus({ minutes: 15 }).toMillis()
        spy.on(Settings, 'now', () => now)
        await poke(factory.address)
        expect(Logger.warn).to.have.been.called.with('Augur: Next resolution time is in the future')
        expect(await factory.marketCount()).to.equal(1 + coinCount * 1)
      })

      it('resolves old round and creates a new round after 6 days', async () => {
        const roundUpdatedAt = await addRounds(factory, 6, 1)
        const now = roundUpdatedAt.plus({ minutes: 15 }).toMillis()
        spy.on(Settings, 'now', () => now)
        await poke(factory.address)
        expect(await factory.marketCount()).to.equal(1 + coinCount * 2)

        let nextResolutionTime = DateTime.fromObject({
          year: 2021,
          month: 8,
          day: 13,
          hour: 16,
          zone: 'America/New_York',
        })
        expect(await factory.nextResolutionTime()).to.equal(
          BigNumber.from(nextResolutionTime.toSeconds()),
        )
      })
    })
  })
})
