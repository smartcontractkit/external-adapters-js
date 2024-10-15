import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://localhost:3324', {
    encodedQueryParams: true,
  })
    .persist()
    .get(`/v2/vaults/b0bb5449c1e4926542ce693b4db2e883/wallets?limit=1`)
    .reply(
      200,
      () => ({
        data: [
          {
            assets: [
              {
                assetType: 'ETHHOL',
                availableBalance: {
                  assetType: 'ETHHOL',
                  currentPrice: '2356.13472983921',
                  currentUSDValue: '4712.27',
                  quantity: '2',
                },
                totalBalance: {
                  assetType: 'ETHHOL',
                  currentPrice: '2356.13472983921',
                  currentUSDValue: '4712.27',
                  quantity: '2',
                },
              },
            ],
            depositAddress: {
              address: '0xEc8907aDA68E963C4AD7C7F11a1a846cfd2fA50A',
              addressId: 'de050174b244c21d49955985a206a3bc',
              addressSignaturePayload:
                '7b225465787441646472657373223a22307845633839303761444136384539363343344144374337463131613161383436636664326641353041227d',
              addressID: 'de050174b244c21d49955985a206a3bc',
              signature:
                '32df3a0f3d49692060f7b8e3e6bf7ef28102cdb564d4dc3ec1007fd85418a2ca706dbc8db212bcb27b97ec50e0315ad066cad0051b52fa6c16b922e7152e6f03',
            },
            isDefault: true,
            networkId: 'ETHHOL',
            subaccountId: '0ec207d4-9b4e-4428-9a6e-bfd52cdb0d0c',
            type: 'WALLET',
            vaultId: '123',
            vaultName: 'ETH ETF',
            walletId: '78dd7ad4a149fc2457492867d5938b99',
            walletName: 'CETH Wallet 1',
          },
        ],
        page: {
          next: '/v2/vaults/b0bb5449c1e4926542ce693b4db2e883/wallets?afterId=78dd7ad4a149fc2457492867d5938b99&limit=1',
        },
      }),
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()
    .get(
      `/v2/vaults/b0bb5449c1e4926542ce693b4db2e883/wallets?afterId=78dd7ad4a149fc2457492867d5938b99&limit=1`,
    )
    .reply(200, () => ({
      data: [
        {
          assets: [
            {
              assetType: 'ETHHOL',
              availableBalance: {
                assetType: 'ETHHOL',
                currentPrice: '2356.13472983921',
                currentUSDValue: '2827.36',
                quantity: '1.2',
              },
              totalBalance: {
                assetType: 'ETHHOL',
                currentPrice: '2356.13472983921',
                currentUSDValue: '2827.36',
                quantity: '1.2',
              },
            },
          ],
          depositAddress: {
            address: '0x77928478770209020dE7e36E02b905d1CA9f92BE',
            addressId: '6592549429f6bf0a038083e346a83e9e',
            addressSignaturePayload:
              '7b225465787441646472657373223a22307837373932383437383737303230393032306445376533364530326239303564314341396639324245227d',
            addressID: '6592549429f6bf0a038083e346a83e9e',
            signature:
              'c2883216ae925b1063ba0cbc41c7a307ce0533743bbdce8d01f068f2901b28b69eb003ad66d6a82381b69d052779437da731197126486f4a0d975636e4ba7f0b',
          },
          isDefault: false,
          networkId: 'ETHHOL',
          subaccountId: '0ec207d4-9b4e-4428-9a6e-bfd52cdb0d0c',
          type: 'WALLET',
          vaultId: '123',
          vaultName: 'ETH ETF',
          walletId: '47a04da2d276c25121e2c559535efc7e',
          walletName: 'CETH Wallet 2',
        },
      ],
      page: {
        next: '/v2/vaults/b0bb5449c1e4926542ce693b4db2e883/wallets?afterId=47a04da2d276c25121e2c559535efc7e&limit=1',
      },
    }))
    .persist()
    .get(
      `/v2/vaults/b0bb5449c1e4926542ce693b4db2e883/wallets?afterId=47a04da2d276c25121e2c559535efc7e&limit=1`,
    )
    .reply(200, () => ({
      data: [
        {
          assets: [
            {
              assetType: 'ETHHOL',
              availableBalance: {
                assetType: 'ETHHOL',
                currentPrice: '2356.13472983921',
                currentUSDValue: '1767.1',
                quantity: '0.75',
              },
              totalBalance: {
                assetType: 'ETHHOL',
                currentPrice: '2356.13472983921',
                currentUSDValue: '1767.1',
                quantity: '0.75',
              },
            },
          ],
          depositAddress: {
            address: '0xFd0F90034628aC5000bA8562196ff1F306c16584',
            addressId: '7efe3997f3b67fcab86511231d7fe43f',
            addressSignaturePayload:
              '7b225465787441646472657373223a22307846643046393030333436323861433530303062413835363231393666663146333036633136353834227d',
            addressID: '7efe3997f3b67fcab86511231d7fe43f',
            signature:
              'a384ac79e37e5619a5ed18d2094be6c4aed1f5db79effd1a4c3484640e446456fb4162721214c3891fde6eda21a6a8c8999b0a3e4b92e8b5bafd657363274009',
          },
          isDefault: false,
          networkId: 'ETH',
          subaccountId: '0ec207d4-9b4e-4428-9a6e-bfd52cdb0d0c',
          type: 'WALLET',
          vaultId: '123',
          vaultName: 'ETH ETF',
          walletId: '4f7a79a18ba97f6df336d3a5bf5112ba',
          walletName: 'CETH Wallet 3',
        },
      ],
      page: { next: null },
    }))
    .persist()
