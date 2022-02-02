import * as _1forge from '@chainlink/1forge-adapter'
import * as accuweather from '@chainlink/accuweather-adapter'
import * as ada_balance from '@chainlink/ada-balance-adapter'
import * as alphachain from '@chainlink/alphachain-adapter'
import * as alphavantage from '@chainlink/alphavantage-adapter'
import * as amberdata from '@chainlink/amberdata-adapter'
import * as anyblock from '@chainlink/anyblock-adapter'
import * as ap_election from '@chainlink/ap-election-adapter'
import * as bea from '@chainlink/bea-adapter'
import * as binance from '@chainlink/binance-adapter'
import * as binance_dex from '@chainlink/binance-dex-adapter'
import * as bitex from '@chainlink/bitex-adapter'
import * as bitso from '@chainlink/bitso-adapter'
import * as blockchain_com from '@chainlink/blockchain.com-adapter'
import * as blockchair from '@chainlink/blockchair-adapter'
import * as blockcypher from '@chainlink/blockcypher-adapter'
import * as blockstream from '@chainlink/blockstream-adapter'
import * as bravenewcoin from '@chainlink/bravenewcoin-adapter'
import * as btc_com from '@chainlink/btc.com-adapter'
import * as cache_gold from '@chainlink/cache.gold-adapter'
import * as cfbenchmarks from '@chainlink/cfbenchmarks-adapter'
import * as chain_reserve_wallet from '@chainlink/chain-reserve-wallet-adapter'
import * as coinapi from '@chainlink/coinapi-adapter'
import * as coinbase from '@chainlink/coinbase-adapter'
import * as coincodex from '@chainlink/coincodex-adapter'
import * as coingecko from '@chainlink/coingecko-adapter'
import * as coinlore from '@chainlink/coinlore-adapter'
import * as coinmarketcap from '@chainlink/coinmarketcap-adapter'
import * as coinmetrics from '@chainlink/coinmetrics-adapter'
import * as coinpaprika from '@chainlink/coinpaprika-adapter'
import * as coinranking from '@chainlink/coinranking-adapter'
import * as covid_tracker from '@chainlink/covid-tracker-adapter'
import * as cryptoapis from '@chainlink/cryptoapis-adapter'
import * as cryptoapis_v2 from '@chainlink/cryptoapis-v2-adapter'
import * as cryptocompare from '@chainlink/cryptocompare-adapter'
import * as cryptoid from '@chainlink/cryptoid-adapter'
import * as cryptomkt from '@chainlink/cryptomkt-adapter'
import * as currencylayer from '@chainlink/currencylayer-adapter'
import * as curve from '@chainlink/curve-adapter'
import * as deribit from '@chainlink/deribit-adapter'
import * as dns_query from '@chainlink/dns-query-adapter'
import * as durin from '@chainlink/durin-adapter'
import * as dwolla from '@chainlink/dwolla-adapter'
import * as dxfeed from '@chainlink/dxfeed-adapter'
import * as dxfeed_secondary from '@chainlink/dxfeed-secondary-adapter'
import * as enzyme from '@chainlink/enzyme-adapter'
import * as eodhistoricaldata from '@chainlink/eodhistoricaldata-adapter'
import * as eth_balance from '@chainlink/eth-balance-adapter'
import * as etherchain from '@chainlink/etherchain-adapter'
import * as etherscan from '@chainlink/etherscan-adapter'
import * as ethgasstation from '@chainlink/ethgasstation-adapter'
import * as ethgaswatch from '@chainlink/ethgaswatch-adapter'
import * as expert_car_broker from '@chainlink/expert-car-broker-adapter'
import * as fcsapi from '@chainlink/fcsapi-adapter'
import * as finage from '@chainlink/finage-adapter'
import * as finnhub from '@chainlink/finnhub-adapter'
import * as fixer from '@chainlink/fixer-adapter'
import * as flightaware from '@chainlink/flightaware-adapter'
import * as fmpcloud from '@chainlink/fmpcloud-adapter'
import * as gemini from '@chainlink/gemini-adapter'
import * as genesis_adapter from '@chainlink/genesis-volatility-adapter'
import * as geodb from '@chainlink/geodb-adapter'
import * as google_bigquery from '@chainlink/google-bigquery-adapter'
import * as graphql from '@chainlink/graphql-adapter'
import * as iex_adapter from '@chainlink/iex-cloud-adapter'
import * as intrinio from '@chainlink/intrinio-adapter'
import * as ipfs from '@chainlink/ipfs-adapter'
import * as json_adapter from '@chainlink/json-rpc-adapter'
import * as kaiko from '@chainlink/kaiko-adapter'
import * as layer2_sequencer_health from '@chainlink/layer2-sequencer-health-adapter'
import * as lcx from '@chainlink/lcx-adapter'
import * as linkpool from '@chainlink/linkpool-adapter'
import * as lition from '@chainlink/lition-adapter'
import * as lotus from '@chainlink/lotus-adapter'
import * as marketstack from '@chainlink/marketstack-adapter'
import * as messari from '@chainlink/messari-adapter'
import * as metalsapi from '@chainlink/metalsapi-adapter'
import * as mycryptoapi from '@chainlink/mycryptoapi-adapter'
import * as ncfx from '@chainlink/ncfx-adapter'
import * as nikkei from '@chainlink/nikkei-adapter'
import * as nomics from '@chainlink/nomics-adapter'
import * as oilpriceapi from '@chainlink/oilpriceapi-adapter'
import * as onchain_gas from '@chainlink/onchain-gas-adapter'
import * as openexchangerates from '@chainlink/openexchangerates-adapter'
import * as orchid_adapter from '@chainlink/orchid-bandwidth-adapter'
import * as paxos from '@chainlink/paxos-adapter'
import * as paypal from '@chainlink/paypal-adapter'
import * as poa from '@chainlink/poa-adapter'
import * as polygon from '@chainlink/polygon-adapter'
import * as reduce from '@chainlink/reduce-adapter'
import * as renvm_adapter_address from '@chainlink/renvm-address-set-adapter'
import * as satoshitango from '@chainlink/satoshitango-adapter'
import * as snowflake from '@chainlink/snowflake-adapter'
import * as sochain from '@chainlink/sochain-adapter'
import * as spectral_macro_score from '@chainlink/spectral-macro-score-adapter'
import * as sportsdataio from '@chainlink/sportsdataio-adapter'
import * as stasis from '@chainlink/stasis-adapter'
import * as synthetix_debt_pool from '@chainlink/synthetix-debt-pool-adapter'
import * as taapi from '@chainlink/taapi-adapter'
import * as terra_view_function from '@chainlink/terra-view-function-adapter'
import * as therundown from '@chainlink/therundown-adapter'
import * as tiingo from '@chainlink/tiingo-adapter'
import * as tradermade from '@chainlink/tradermade-adapter'
import * as tradingeconomics from '@chainlink/tradingeconomics-adapter'
import * as trueusd from '@chainlink/trueusd-adapter'
import * as twelvedata from '@chainlink/twelvedata-adapter'
import * as unibit from '@chainlink/unibit-adapter'
import * as uniswap_v2 from '@chainlink/uniswap-v2-adapter'
import * as uniswap_v3 from '@chainlink/uniswap-v3-adapter'
import * as upvest from '@chainlink/upvest-adapter'
import * as uscpi_one from '@chainlink/uscpi-one-adapter'
import * as view_function from '@chainlink/view-function-adapter'
import * as wbtc_adapter_address from '@chainlink/wbtc-address-set-adapter'
import * as wootrade from '@chainlink/wootrade-adapter'
import * as wrapped from '@chainlink/wrapped-adapter'
import * as xbto from '@chainlink/xbto-adapter'

export default {
  _1forge,
  accuweather,
  ada_balance,
  alphachain,
  alphavantage,
  amberdata,
  anyblock,
  ap_election,
  bea,
  binance,
  binance_dex,
  bitex,
  bitso,
  blockchain_com,
  blockchair,
  blockcypher,
  blockstream,
  bravenewcoin,
  btc_com,
  cache_gold,
  cfbenchmarks,
  chain_reserve_wallet,
  coinapi,
  coinbase,
  coincodex,
  coingecko,
  coinlore,
  coinmarketcap,
  coinmetrics,
  coinpaprika,
  coinranking,
  covid_tracker,
  cryptoapis,
  cryptoapis_v2,
  cryptocompare,
  cryptoid,
  cryptomkt,
  currencylayer,
  curve,
  deribit,
  dns_query,
  durin,
  dwolla,
  dxfeed,
  dxfeed_secondary,
  enzyme,
  eodhistoricaldata,
  eth_balance,
  etherchain,
  etherscan,
  ethgasstation,
  ethgaswatch,
  expert_car_broker,
  fcsapi,
  finage,
  finnhub,
  fixer,
  flightaware,
  fmpcloud,
  gemini,
  genesis_adapter,
  geodb,
  google_bigquery,
  graphql,
  iex_adapter,
  intrinio,
  ipfs,
  json_adapter,
  kaiko,
  layer2_sequencer_health,
  lcx,
  linkpool,
  lition,
  lotus,
  marketstack,
  messari,
  metalsapi,
  mycryptoapi,
  ncfx,
  nikkei,
  nomics,
  oilpriceapi,
  onchain_gas,
  openexchangerates,
  orchid_adapter,
  paxos,
  paypal,
  poa,
  polygon,
  reduce,
  renvm_adapter_address,
  satoshitango,
  snowflake,
  sochain,
  spectral_macro_score,
  sportsdataio,
  stasis,
  synthetix_debt_pool,
  taapi,
  terra_view_function,
  therundown,
  tiingo,
  tradermade,
  tradingeconomics,
  trueusd,
  twelvedata,
  unibit,
  uniswap_v2,
  uniswap_v3,
  upvest,
  uscpi_one,
  view_function,
  wbtc_adapter_address,
  wootrade,
  wrapped,
  xbto,
}
