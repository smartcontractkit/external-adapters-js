# Chainlink External Adapter for CoinCodex

Price adapter to query the price of an asset in USD. Only USD is supported by CoinCodex as a quote currency.

## Input Params

- `base`, `from`, or `coin`: The symbol of the currency to query

## Output

```json
{
   "jobRunID":"1",
   "data":{
      "symbol":"ETH",
      "coin_name":"Ethereum",
      "shortname":"ethereum",
      "slug":"ethereum",
      "display_symbol":"ETH",
      "display":"true",
      "release_date":"2015-07-30",
      "ico_price":"0.311420000",
      "today_open":585.747073228,
      "market_cap_rank":2,
      "volume_rank":3,
      "description":"<p>Ethereum is a blockchain network that was launched in July of 2015. While there were numerous founders behind the project, Ethereum was initially proposed by Vitalik Buterin. In order to fund development, the project sold rights to ETH tokens in a sale that took place between July and August of 2014. The currency used by the participants to purchase ETH was Bitcoin. The Ethereum project raised approximately $16 million worth of BTC in its initial coin offering.</p>\n\n<p>Key Ethereum features:</p>\n\n<ul>\n\t<li>Launched in 2015 after a 2014 ICO that raised $16 million</li>\n\t<li>Leading smart contract and dApp platform</li>\n\t<li>Users can create custom tokens that run on top of Ethereum</li>\n\t<li>Ethereum uses proof-of-work but is transitioning to proof-of-stake</li>\n</ul>\n\n<p>Ethereum makes it possible for users to create smart contracts and <a href=\"/dapp-list/ethereum/\" target=\"_blank\">decentralized applications (dApps)</a>. Once these apps and contracts are deployed to the Ethereum network, they are executed exactly as programmed and are exceedingly difficult to censor.</p>\n\n<p>The Ethereum network is secured through proof-of-work, similarly to the design employed by <a href=\"/crypto/bitcoin/\" target=\"_blank\">Bitcoin</a>. However, the goal is for Ethereum to transition to proof-of-stake consensus to improve the scalability of the network and reduce the negative environmental impact of mining.</p>\n\n<p>ETH is the native asset of the Ethereum blockchain, and it is used to pay the fees necessary for sending transactions and interacting with dApps. However, ETH is not the only asset that can be sent through Ethereum &ndash; users can create custom tokens and set the parameters such as the maximum supply to their liking.&nbsp;</p>\n\n<p>In fact, this was one of the features that enabled Ethereum to get a lot traction within the cryptocurrency community. Ethereum&rsquo;s technology enabled projects to run <a href=\"/ico-calendar/\" target=\"_blank\">initial coin offerings (ICOs)</a>, and Ethereum continues to be the most popular platform for token sales.</p>\n\n<p>On Ethereum, users can also create <a href=\"/article/2354/what-are-non-fungible-tokens-nfts/\" target=\"_blank\">non-fungible tokens (NFTs)</a>, which is a unique use-case enabled by blockchain technology &ndash; NFTs are verifiably scarce digital objects, which is why they&rsquo;re sometimes called &ldquo;crypto collectibles&rdquo;. CryptoKitties is an example of a dApp that leverages NFTs.</p>\n\n<p>One of the major emerging trends in the Ethereum ecosystem is decentralized finance, commonly referred to with the abbreviation DeFi. This term refers to the numerous protocols built on top of Ethereum that allow users to lend, borrow, buy and sell their cryptocurrency without having to trust an intermediary in the process.&nbsp;</p>\n\n<p>On CoinCodex, you can stay up to date with the latest information regarding the Ethereum&nbsp;price, market cap and news.</p>\n",
      "price_high_24_usd":634.754677317,
      "price_low_24_usd":573.516677404,
      "start":"2014-06-01 00:00:00",
      "end":"2014-08-31 23:59:00",
      "is_promoted":"false",
      "message":"",
      "website":"https://www.ethereum.org/",
      "whitepaper":"",
      "total_supply":null,
      "supply":113663821,
      "platform":"ETH",
      "how_to_buy_url":null,
      "last_price_usd":599.183276922,
      "price_change_1H_percent":"0.310000000",
      "price_change_1D_percent":"-1.700000000",
      "price_change_7D_percent":"0.270000000",
      "price_change_30D_percent":"55.190000000",
      "price_change_90D_percent":"38.990000000",
      "price_change_180D_percent":"149.210000000",
      "price_change_365D_percent":"303.110000000",
      "price_change_YTD_percent":"359.340000000",
      "volume_24_usd":38669781267.691414,
      "trading_since":"2015-08-07 14:55:00",
      "stages_start":"2014-06-01 00:00:00",
      "stages_end":"2014-08-31 23:59:00",
      "include_supply":"true",
      "use_volume":"true",
      "ath_usd":"1570.13",
      "ath_date":"2018-01-13 22:20:00",
      "not_trading_since":null,
      "last_update":"2020-12-02 09:44:15",
      "initial_data":{
         "date":"2015-08-07 15:00:00",
         "price_usd":"3.46302",
         "price_btc":"0.0123809",
         "price_eth":"1"
      },
      "social":{
         "explorer":"https://etherscan.io/",
         "bitcointalk":"https://bitcointalk.org/index.php?topic=428589.0",
         "message board":"https://forum.ethereum.org/",
         "twitter":"https://twitter.com/ethereum",
         "reddit":"https://www.reddit.com/r/ethereum",
         "github":"https://github.com/ethereum",
         "chat":"https://gitter.im/orgs/ethereum/rooms",
         "explorer1":"https://www.etherchain.org/",
         "explorer2":"https://blockchair.com/ethereum",
         "explorer3":"https://coincodex.enjinx.io/eth/transactions"
      },
      "socials":[
         {
            "name":"explorer",
            "id":"156585",
            "coincodex_coin_symbol":"ETH",
            "coincodex_socials_id":"13",
            "value":"https://etherscan.io/",
            "label":"Etherscan",
            "order_by":"0"
         },
         {
            "name":"bitcointalk",
            "id":"156586",
            "coincodex_coin_symbol":"ETH",
            "coincodex_socials_id":"8",
            "value":"https://bitcointalk.org/index.php?topic=428589.0",
            "label":"",
            "order_by":"0"
         },
         {
            "name":"message board",
            "id":"156587",
            "coincodex_coin_symbol":"ETH",
            "coincodex_socials_id":"14",
            "value":"https://forum.ethereum.org/",
            "label":"",
            "order_by":"0"
         },
         {
            "name":"twitter",
            "id":"156588",
            "coincodex_coin_symbol":"ETH",
            "coincodex_socials_id":"3",
            "value":"https://twitter.com/ethereum",
            "label":"",
            "order_by":"0"
         },
         {
            "name":"reddit",
            "id":"156589",
            "coincodex_coin_symbol":"ETH",
            "coincodex_socials_id":"2",
            "value":"https://www.reddit.com/r/ethereum",
            "label":"",
            "order_by":"0"
         },
         {
            "name":"github",
            "id":"156590",
            "coincodex_coin_symbol":"ETH",
            "coincodex_socials_id":"9",
            "value":"https://github.com/ethereum",
            "label":"",
            "order_by":"0"
         },
         {
            "name":"chat",
            "id":"156591",
            "coincodex_coin_symbol":"ETH",
            "coincodex_socials_id":"15",
            "value":"https://gitter.im/orgs/ethereum/rooms",
            "label":"",
            "order_by":"0"
         },
         {
            "name":"explorer",
            "id":"156592",
            "coincodex_coin_symbol":"ETH",
            "coincodex_socials_id":"13",
            "value":"https://www.etherchain.org/",
            "label":"Etherchain",
            "order_by":"0"
         },
         {
            "name":"explorer",
            "id":"156593",
            "coincodex_coin_symbol":"ETH",
            "coincodex_socials_id":"13",
            "value":"https://blockchair.com/ethereum",
            "label":"Blockchair",
            "order_by":"0"
         },
         {
            "name":"explorer",
            "id":"156594",
            "coincodex_coin_symbol":"ETH",
            "coincodex_socials_id":"13",
            "value":"https://coincodex.enjinx.io/eth/transactions",
            "label":"CoinCodex",
            "order_by":"-1"
         }
      ],
      "result":599.183276922
   },
   "result":599.183276922,
   "statusCode":200
}
```
