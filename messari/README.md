# Chainlink External Adapter for Messari

## Input Params

- `market`, `to`, or `quote`: The symbol of the currency to query
- `endpoint`: Optional endpoint param (defaults to "dominance", one of "dominance")

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "status": { "elapsed": 0, "timestamp": "2020-10-16T21:56:41.34652374Z" },
    "data": {
      "id": "1e31218a-e44e-4285-820c-8282ee222035",
      "symbol": "BTC",
      "name": "Bitcoin",
      "slug": "bitcoin",
      "_internal_temp_agora_id": "9793eae6-f374-46b4-8764-c2d224429791",
      "market_data": {
        "price_usd": 11339.844688158693,
        "price_btc": 1,
        "price_eth": 30.956592169822965,
        "volume_last_24_hours": 25584148590.883194,
        "real_volume_last_24_hours": 1537197652.3401384,
        "volume_last_24_hours_overstatement_multiple": 16.64336954453151,
        "percent_change_usd_last_24_hours": -1.306850196556349,
        "percent_change_btc_last_24_hours": 0,
        "percent_change_eth_last_24_hours": 1.7108890727187405,
        "ohlcv_last_1_hour": {
          "open": 11310.430216709034,
          "high": 11344.959437161715,
          "low": 11302.263020648597,
          "close": 11336.189586094082,
          "volume": 30135278.183017552
        },
        "ohlcv_last_24_hour": {
          "open": 11520.443168605381,
          "high": 11618.219539851567,
          "low": 11203.205528019129,
          "close": 11339.844688158695,
          "volume": 1954666063.8125713
        },
        "last_trade_at": "2020-10-16T21:56:40.56Z"
      },
      "marketcap": {
        "marketcap_dominance_percent": 60.069606944599904,
        "current_marketcap_usd": 209990589618.87787,
        "y_2050_marketcap_usd": 237885868788.00708,
        "y_plus10_marketcap_usd": 233100848057.96408,
        "liquid_marketcap_usd": 209904385920.929,
        "realized_marketcap_usd": 117003906260.77763,
        "volume_turnover_last_24_hours_percent": 0.7321040691516607
      },
      "supply": {
        "y_2050": 20986335.65,
        "y_plus10": 20564200.23,
        "liquid": 18517804.02,
        "circulating": 18525408.92628823,
        "y_2050_issued_percent": 88.23743377038764,
        "annual_inflation_percent": 1.8153026656775328,
        "stock_to_flow": 55.0872324988718,
        "y_plus10_issued_percent": 90.04874399630371
      },
      "blockchain_stats_24_hours": {
        "count_of_active_addresses": 1035214,
        "transaction_volume": 6298221325.247776,
        "adjusted_transaction_volume": 2986253052.921463,
        "nvt": 32.852873342737595,
        "adjusted_nvt": 78.80926738553207,
        "median_tx_value": 104.76228920244306,
        "median_tx_fee": 1.38030974868498,
        "count_of_tx": 330320,
        "count_of_payments": 886164,
        "new_issuance": 11756475.474767871,
        "average_difficulty": 19298087186262.547,
        "kilobytes_added": 208340.103,
        "count_of_blocks_added": 166
      },
      "market_data_liquidity": {
        "clearing_prices_to_sell": [
          {
            "amount_usd": 100000,
            "clearing_price": 11327.170269027947,
            "percent_move": -0.0035402931501149915
          },
          {
            "amount_usd": 1000000,
            "clearing_price": 11323.561005951227,
            "percent_move": -0.03540293150114991
          },
          {
            "amount_usd": 2000000,
            "clearing_price": 11319.55071364376,
            "percent_move": -0.07080586300229982
          },
          {
            "amount_usd": 5000000,
            "clearing_price": 11309.115740475394,
            "percent_move": -0.16292599090624882
          },
          {
            "amount_usd": 10000000,
            "clearing_price": 11292.919917550342,
            "percent_move": -0.30590300247042995
          },
          {
            "amount_usd": 20000000,
            "clearing_price": 11259.78707301717,
            "percent_move": -0.5984003406974185
          }
        ],
        "marketcap": [
          {
            "amount_sold_usd": 100000,
            "percent_move": -0.0035402931501149915,
            "marketcap_usd": 209840461211.43698
          },
          {
            "amount_sold_usd": 1000000,
            "percent_move": -0.03540293150114991,
            "marketcap_usd": 209773598137.0182
          },
          {
            "amount_sold_usd": 2000000,
            "percent_move": -0.07080586300229982,
            "marketcap_usd": 209699305832.10843
          },
          {
            "amount_sold_usd": 5000000,
            "percent_move": -0.16292599090624882,
            "marketcap_usd": 209505993687.02957
          },
          {
            "amount_sold_usd": 10000000,
            "percent_move": -0.30590300247042995,
            "marketcap_usd": 209205959444.44522
          },
          {
            "amount_sold_usd": 20000000,
            "percent_move": -0.5984003406974185,
            "marketcap_usd": 208592159950.5771
          }
        ],
        "asset_bid_depth": [
          { "percent": 0.01, "amount": 249.60798970621906 },
          { "percent": 0.05, "amount": 1469.0960733559798 },
          { "percent": 1, "amount": 2443.1935887390205 },
          { "percent": 2, "amount": 3506.143191327913 },
          { "percent": 4, "amount": 5186.080843985219 },
          { "percent": 6, "amount": 5711.4497588245995 },
          { "percent": 8, "amount": 6327.131808512655 },
          { "percent": 10, "amount": 6786.2086570768815 }
        ],
        "usd_bid_depth": [
          { "percent": 0.01, "amount": 2824624.847712206 },
          { "percent": 0.05, "amount": 16558084.062357087 },
          { "percent": 1, "amount": 27398695.076170884 },
          { "percent": 2, "amount": 38921765.24203778 },
          { "percent": 4, "amount": 56395872.49802514 },
          { "percent": 6, "amount": 60815043.09793759 },
          { "percent": 8, "amount": 65937353.740454964 },
          { "percent": 10, "amount": 69184136.16710888 }
        ],
        "updated_at": "2020-10-16T00:00:00Z"
      },
      "all_time_high": {
        "price": 20089,
        "at": "2017-12-17",
        "days_since": 1034,
        "percent_down": 43.59329669828122,
        "breakeven_multiple": 1.772838938398885
      },
      "cycle_low": {
        "price": 3126.679993636258,
        "at": "2018-12-15",
        "percent_up": 262.4145307273341,
        "days_since": 671
      },
      "token_sale_stats": {
        "sale_proceeds_usd": null,
        "sale_start_date": null,
        "sale_end_date": null,
        "roi_since_sale_usd_percent": null,
        "roi_since_sale_btc_percent": null,
        "roi_since_sale_eth_percent": null
      },
      "staking_stats": {
        "staking_yield_percent": null,
        "staking_type": null,
        "staking_minimum": null,
        "tokens_staked": null,
        "tokens_staked_percent": null,
        "real_staking_yield_percent": null
      },
      "mining_stats": {
        "mining_algo": "SHA-256",
        "network_hash_rate": "148805 PH/s",
        "available_on_nicehash_percent": 0.3891681871194641,
        "1_hour_attack_cost": 702046.0104986998,
        "24_hours_attack_cost": 16849104.251968797,
        "attack_appeal": 12435.648759107842,
        "mining_revenue_native": 1020.5194365899998,
        "mining_revenue_usd": 11749916.89289309,
        "average_difficulty": 19298087186262.55
      },
      "developer_activity": {
        "stars": 45504,
        "watchers": 3574,
        "commits_last_3_months": 197,
        "commits_last_1_year": 1725,
        "lines_added_last_3_months": 23868,
        "lines_added_last_1_year": 104734,
        "lines_deleted_last_3_months": 5811,
        "lines_deleted_last_1_year": 84991
      },
      "roi_data": {
        "percent_change_last_1_week": 2.2692010543684917,
        "percent_change_last_1_month": 3.17570897643982,
        "percent_change_last_3_months": 23.276400233252424,
        "percent_change_last_1_year": 40.26659507468979,
        "percent_change_btc_last_1_week": 0,
        "percent_change_btc_last_1_month": 0,
        "percent_change_btc_last_3_months": 0,
        "percent_change_btc_last_1_year": 0,
        "percent_change_eth_last_1_week": 2.362122105481602,
        "percent_change_eth_last_1_month": 3.2715916217054795,
        "percent_change_eth_last_3_months": -20.353629899520506,
        "percent_change_eth_last_1_year": -31.944677431485562,
        "percent_change_month_to_date": 6.463709885183985,
        "percent_change_quarter_to_date": 6.463709885183985,
        "percent_change_year_to_date": 56.94442501993338
      },
      "roi_by_year": {
        "2019_usd_percent": 84.31304513582634,
        "2018_usd_percent": -71.97733095391189,
        "2017_usd_percent": 1288.3583079532318,
        "2016_usd_percent": 122.7436967497104,
        "2015_usd_percent": 36.57414623314594,
        "2014_usd_percent": -57.325668136700024,
        "2013_usd_percent": 5429.205396499734,
        "2012_usd_percent": 164.8,
        "2011_usd_percent": 1420.27027
      },
      "risk_metrics": {
        "sharpe_ratios": {
          "last_30_days": 1.7106449806024484,
          "last_90_days": 1.7807440622953739,
          "last_1_year": 0.5436307034167559,
          "last_3_years": 0.38804543036309225
        },
        "volatility_stats": {
          "volatility_last_30_days": 0.3258112513970604,
          "volatility_last_90_days": 0.48877572231277855,
          "volatility_last_1_year": 0.7476523680137406,
          "volatility_last_3_years": 0.8133632130334729
        }
      },
      "misc_data": {
        "private_market_price_usd": null,
        "vladimir_club_cost": 23777537.25557927,
        "btc_current_normalized_supply_price_usd": 11331.542626282286,
        "btc_y2050_normalized_supply_price_usd": 11331.542626282286,
        "asset_created_at": "2009-01-03",
        "asset_age_days": 4304,
        "categories": ["Payments"],
        "sectors": ["Currencies"],
        "tags": [""]
      },
      "lend_rates": {
        "bitfinex": 4.9813,
        "blockfi": 3.2,
        "celsius": 4.41,
        "coinlist": 2.92,
        "cryptocom": 6,
        "poloniex": 2.8105
      },
      "borrow_rates": { "coinlist": 3.65 },
      "loan_data": {
        "originated_last_24_hours_usd": null,
        "outstanding_debt_usd": null,
        "repaid_last_24_hours_usd": null,
        "collateralized_last_24_hours_usd": null,
        "collateral_liquidated_last_24_hours_usd": null
      },
      "reddit": { "active_user_count": 2737, "subscribers": 1698547 },
      "on_chain_data": {
        "txn_count_last_24_hours": 337702,
        "transfer_count_last_24_hours": 894070,
        "txn_volume_last_24_hours_usd": 6298221325.247776,
        "active_addresses": 1035214,
        "total_fees_last_24_hours_usd": 883046.68105192,
        "total_fees_last_24_hours": 76.76943659,
        "average_fee_usd": 2.614869562667534,
        "median_fee_usd": 1.38030974868498,
        "average_transfer_value_usd": 7044.438753686206,
        "median_transfer_value_usd": 104.76228920244306,
        "adjusted_nvt": 79.77013176,
        "issuance_last_24_hours_usd": 10855561.044345416,
        "issuance_rate": 1.86004,
        "hash_rate": 144856280.72214702,
        "block_count": 151,
        "block_size_bytes_total": 190710047,
        "block_size_bytes_average": 1262980.44370861
      },
      "exchange_flows": {
        "supply_exchange_usd": 15543162946.14101,
        "flow_in_exchange_native_units_inclusive": 33125.40616561,
        "flow_in_exchange_usd_inclusive": 381027675.4961752,
        "flow_in_exchange_native_units": 24054.50565433,
        "flow_in_exchange_usd": 276688905.4539139,
        "flow_out_exchange_native_units_inclusive": 51357.80588376,
        "flow_out_exchange_usd_inclusive": 590747334.436873,
        "flow_out_exchange_native_units": 42286.90537248,
        "flow_out_exchange_usd": 486408564.39461166
      },
      "alert_messages": null
    },
    "result": 60.069606944599904
  },
  "result": 60.069606944599904,
  "statusCode": 200
}
```
