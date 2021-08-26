import chaiModule from 'chai'
import { chaiEthers } from 'chai-ethers'
import spies from 'chai-spies'
chaiModule.use(chaiEthers)
chaiModule.use(spies)

export = chaiModule
