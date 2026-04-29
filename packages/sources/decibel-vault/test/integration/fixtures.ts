import nock from 'nock'

const MODULE_ADDRESS = '0x50ead22afd6ffd9769e3b3d6e0e64a2a350d68e8b102c4e72e33d0b8cfdfdb06'

// Vault IDs for different test scenarios
export const VAULT_ID_HAPPY = '0x06ad70a9a4f30349b489791e2f2bcf58363dad30e54a9d2d4095d6213d7a9bf9'
export const VAULT_ID_CUSTOM_DECIMALS =
  '0x1111111111111111111111111111111111111111111111111111111111111111'
export const VAULT_ID_NAV_ZERO =
  '0x2222222222222222222222222222222222222222222222222222222222222222'
export const VAULT_ID_SHARES_ZERO =
  '0x3333333333333333333333333333333333333333333333333333333333333333'

type ViewBody = {
  function: string
  arguments: string[]
}

const isNavCall = (body: ViewBody) =>
  body.function === `${MODULE_ADDRESS}::vault::get_vault_net_asset_value`

const isSharesCall = (body: ViewBody) =>
  body.function === `${MODULE_ADDRESS}::vault::get_vault_num_shares`

export const mockAptosViewCalls = (rpcUrl: string): nock.Scope =>
  nock(rpcUrl, { encodedQueryParams: true })
    .persist()
    // Happy path: NAV for VAULT_ID_HAPPY
    .post('/view', (body: ViewBody) => isNavCall(body) && body.arguments[0] === VAULT_ID_HAPPY)
    .reply(200, ['41230251777103'], ['Content-Type', 'application/json'])
    .persist()
    .post('/view', (body: ViewBody) => isSharesCall(body) && body.arguments[0] === VAULT_ID_HAPPY)
    .reply(200, ['39015665777277'], ['Content-Type', 'application/json'])
    .persist()
    // Custom decimals: same values but different vault id
    .post(
      '/view',
      (body: ViewBody) => isNavCall(body) && body.arguments[0] === VAULT_ID_CUSTOM_DECIMALS,
    )
    .reply(200, ['41230251777103'], ['Content-Type', 'application/json'])
    .persist()
    .post(
      '/view',
      (body: ViewBody) => isSharesCall(body) && body.arguments[0] === VAULT_ID_CUSTOM_DECIMALS,
    )
    .reply(200, ['39015665777277'], ['Content-Type', 'application/json'])
    .persist()
    // NAV zero scenario
    .post('/view', (body: ViewBody) => isNavCall(body) && body.arguments[0] === VAULT_ID_NAV_ZERO)
    .reply(200, ['0'], ['Content-Type', 'application/json'])
    .persist()
    .post(
      '/view',
      (body: ViewBody) => isSharesCall(body) && body.arguments[0] === VAULT_ID_NAV_ZERO,
    )
    .reply(200, ['1000000'], ['Content-Type', 'application/json'])
    .persist()
    // Shares zero scenario
    .post(
      '/view',
      (body: ViewBody) => isNavCall(body) && body.arguments[0] === VAULT_ID_SHARES_ZERO,
    )
    .reply(200, ['100000'], ['Content-Type', 'application/json'])
    .persist()
    .post(
      '/view',
      (body: ViewBody) => isSharesCall(body) && body.arguments[0] === VAULT_ID_SHARES_ZERO,
    )
    .reply(200, ['0'], ['Content-Type', 'application/json'])
    .persist()
