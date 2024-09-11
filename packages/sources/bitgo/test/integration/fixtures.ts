import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://localhost:2322', {
    encodedQueryParams: true,
  })
    .persist()
    .get(`/tbtc/wallet`)
    .query({
      limit: 100,
      prevId: '',
    })
    .reply(
      200,
      () => ({
        wallets: [
          {
            id: '66d72213cfe30bf7df925c1029801f0f',
            users: [
              {
                user: '66d7216f014fe3e546d3cf234712f714',
                permissions: ['admin', 'spend', 'view'],
              },
            ],
            coin: 'tbtc',
            label: 'Test Wallet ',
            m: 2,
            n: 3,
            keys: [
              '66d72213cfe30bf7df925c13a3036e9b',
              '66d72213cfe30bf7df925c17a8d9db41',
              '66d72214cfe30bf7df925c1a81eceb81',
            ],
            keySignatures: {},
            enterprise: '66d72170014fe3e546d3d10a4fc93149',
            organization: '66d72170014fe3e546d3d13882d27bf8',
            bitgoOrg: 'BitGo Trust',
            tags: ['66d72213cfe30bf7df925c1029801f0f', '66d72170014fe3e546d3d10a4fc93149'],
            disableTransactionNotifications: false,
            freeze: {},
            deleted: false,
            approvalsRequired: 1,
            isCold: true,
            coinSpecific: {},
            admin: {},
            clientFlags: [],
            walletFlags: [],
            allowBackupKeySigning: false,
            recoverable: false,
            startDate: '2024-09-03T14:49:55.000Z',
            type: 'custodial',
            buildDefaults: {},
            customChangeKeySignatures: {},
            hasLargeNumberOfAddresses: false,
            multisigType: 'onchain',
            hasReceiveTransferPolicy: false,
            config: {},
            receiveAddress: {
              id: '66d725bf824ab8597edbf18f5432d101',
              address: 'tb1qq93j04yg2klrfnfhhmr7k6ha0kz9qmm6p5gmrvhtpsc4l620h8cq8gzqfr',
              chain: 20,
              index: 2,
              coin: 'tbtc',
              wallet: '66d72213cfe30bf7df925c1029801f0f',
              proof:
                '18426974636f696e205369676e6564204d6573736167653a0aa2344c4379695042583148384c773456674568436e42516436753447716731635076534c3135727a414d735654364d704559754b475a796a726b71456164774570746231717139336a30347967326b6c72666e6668686d72376b366861306b7a39716d6d367035676d72766874707363346c3632306838637138677a71667232396530393563322d626437302d343033632d626436662d346163363662303565316238',
              signature:
                'IO1ihnEB6IMNt07l39lsLvzO26Ccu4oU6k4yCA8IQ63eTnZXC5YY4efQIy+i0MZVRRsb8TBKC6owpf5Xf/Ut3Nk=',
              coinSpecific: {
                witnessScript:
                  '522102919833a66f051c5c28b98d46ad4aface96546745d5a99b3957d44ed43036900a2102abef566219c8d4230f0ee4f032bf7da7807c7f5aeff83ad65595cb130bdd1111210316c91c5d993a9c939fde3ec69c4ed7f572bfd2a164602851a7e5b28b196b039453ae',
              },
            },
            balance: 3990,
            balanceString: '3990',
            rbfBalance: 0,
            rbfBalanceString: '0',
            confirmedBalance: 3990,
            confirmedBalanceString: '3990',
            spendableBalance: 3990,
            spendableBalanceString: '3990',
            unspentCount: 0,
          },
          {
            id: '66d747d3d1206912ec4f626771a89e5c',
            users: [
              {
                user: '66d7216f014fe3e546d3cf234712f714',
                permissions: ['admin', 'spend', 'view'],
              },
            ],
            coin: 'tbtc',
            label: 'Test BTC Wallet 2',
            m: 2,
            n: 3,
            keys: [
              '66d747d3d1206912ec4f626a9d1c4bb0',
              '66d747d3d1206912ec4f62713b3c4c6b',
              '66d747d4d1206912ec4f64b246329820',
            ],
            keySignatures: {},
            enterprise: '66d72170014fe3e546d3d10a4fc93149',
            organization: '66d72170014fe3e546d3d13882d27bf8',
            bitgoOrg: 'BitGo Trust',
            tags: ['66d747d3d1206912ec4f626771a89e5c', '66d72170014fe3e546d3d10a4fc93149'],
            disableTransactionNotifications: false,
            freeze: {},
            deleted: false,
            approvalsRequired: 1,
            isCold: true,
            coinSpecific: {},
            admin: {},
            clientFlags: [],
            walletFlags: [],
            allowBackupKeySigning: false,
            recoverable: false,
            startDate: '2024-09-03T17:30:59.000Z',
            type: 'custodial',
            buildDefaults: {},
            customChangeKeySignatures: {},
            hasLargeNumberOfAddresses: false,
            multisigType: 'onchain',
            hasReceiveTransferPolicy: false,
            config: {},
            receiveAddress: {
              id: '66d85a88c41c42eb9579b9e1aaa1d476',
              address: 'tb1qm4et3f642cct77s99zmwctl9mmdaemprwlndylpusl2lmesl62aq3kzg6s',
              chain: 20,
              index: 2,
              coin: 'tbtc',
              wallet: '66d747d3d1206912ec4f626771a89e5c',
              proof:
                '18426974636f696e205369676e6564204d6573736167653a0aa2424750316a396931394a6b4a54573751387a715134757251515361354c6e70665154513957353976506b45504c346561624858507a3274516b774a7a53516742746231716d346574336636343263637437377339397a6d7763746c396d6d6461656d7072776c6e64796c7075736c326c6d65736c36326171336b7a67367332396530393563322d626437302d343033632d626436662d346163363662303565316238',
              signature:
                'H4NvPaVnUFk+m2LEV30qNxWUgoUQ8OEFrjTGtJSl0GrIcpz4fKZ6aeEsN0xxWxAUf1FyMHFiPLDnzzgau9Bqp2A=',
              coinSpecific: {
                witnessScript:
                  '5221027ea3cccd4f0d7bc09916be124198cea1dd89af999bfdcb1eacd6eeee413c62e5210358b6d42234b9e9714a29837f37e3b1615622c9cc72ab44c6f6ceb0fbacf5ebfb2102ab5f9f50e58201e96383d6c68f9c82416039cc5fb81d641f5f01071c6b3694ca53ae',
              },
            },
            balance: 2990,
            balanceString: '2990',
            rbfBalance: 0,
            rbfBalanceString: '0',
            confirmedBalance: 2990,
            confirmedBalanceString: '2990',
            spendableBalance: 2990,
            spendableBalanceString: '2990',
            unspentCount: 0,
          },
        ],
        coin: 'tbtc',
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
    .get(`/tbtc/wallet/66d72213cfe30bf7df925c1029801f0f/addresses`)
    .query({
      limit: 100,
      prevId: '',
    })
    .reply(
      200,
      () => ({
        coin: 'tbtc',
        totalAddressCount: 2,
        addresses: [
          {
            id: '66d72215cfe30bf7df925c981123001f',
            address: 'tb1q44alsfkysj4zxvwk6ktwjq3c0wysrxmunmxkh3n84dpqfg85l7msqn8a83',
            chain: 20,
            index: 1,
            coin: 'tbtc',
            wallet: '66d72213cfe30bf7df925c1029801f0f',
            proof:
              '18426974636f696e205369676e6564204d6573736167653a0aa24d76366d394c68424b5072436665447871516177657634747a4a6274464e5878687031654c7356765a7461774e4e7a6b6d666e5a52793462624b716e46454758746231713434616c73666b79736a347a7876776b366b74776a7133633077797372786d756e6d786b68336e3834647071666738356c376d73716e3861383332396530393563322d626437302d343033632d626436662d346163363662303565316238',
            signature:
              'HzcjZ4INXMI33fZd2kqXEdIHTFvZ+ERo9PS+6dP0cqW6IFniQcCjCIOp05l2gTYnAE4lmGVvKz8pNGpn65F73Ho=',
            coinSpecific: {
              witnessScript:
                '522102d7adf186cc5469b5fd3973e67ddabeefe3663f435a8cf250d8f3e819de24c8e92102b4edbfeb4c690838931f86fedb9fc0b1cfb87e807a50fc0771669fdf0edfb8cc21033baf60660244e1c528cd686909d018f3659742c8979d39c11acdc289d3fd784253ae',
            },
          },
          {
            id: '66d725bf824ab8597edbf18f5432d101',
            address: 'tb1qq93j04yg2klrfnfhhmr7k6ha0kz9qmm6p5gmrvhtpsc4l620h8cq8gzqfr',
            chain: 20,
            index: 2,
            coin: 'tbtc',
            wallet: '66d72213cfe30bf7df925c1029801f0f',
            proof:
              '18426974636f696e205369676e6564204d6573736167653a0aa2344c4379695042583148384c773456674568436e42516436753447716731635076534c3135727a414d735654364d704559754b475a796a726b71456164774570746231717139336a30347967326b6c72666e6668686d72376b366861306b7a39716d6d367035676d72766874707363346c3632306838637138677a71667232396530393563322d626437302d343033632d626436662d346163363662303565316238',
            signature:
              'IO1ihnEB6IMNt07l39lsLvzO26Ccu4oU6k4yCA8IQ63eTnZXC5YY4efQIy+i0MZVRRsb8TBKC6owpf5Xf/Ut3Nk=',
            coinSpecific: {
              witnessScript:
                '522102919833a66f051c5c28b98d46ad4aface96546745d5a99b3957d44ed43036900a2102abef566219c8d4230f0ee4f032bf7da7807c7f5aeff83ad65595cb130bdd1111210316c91c5d993a9c939fde3ec69c4ed7f572bfd2a164602851a7e5b28b196b039453ae',
            },
          },
        ],
        count: 2,
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
    .get(`/tbtc/wallet/66d747d3d1206912ec4f626771a89e5c/addresses`)
    .query({
      limit: 100,
      prevId: '',
    })
    .reply(
      200,
      () => ({
        coin: 'tbtc',
        totalAddressCount: 2,
        addresses: [
          {
            id: '66d747d5d1206912ec4f6560d93307b4',
            address: 'tb1qa5c93xvk45m34lqe52sfcu2ls9n7zexy9g9rhn6emzzr4t7hv35qwulqce',
            chain: 20,
            index: 1,
            coin: 'tbtc',
            wallet: '66d747d3d1206912ec4f626771a89e5c',
            proof:
              '18426974636f696e205369676e6564204d6573736167653a0aa248694a6e793868387847466437614b79784c647643634e655058755863626f4b76315964696a78786a674653364a52346470667868423673316e617645754d6274623171613563393378766b34356d33346c7165353273666375326c73396e377a65787939673972686e36656d7a7a72347437687633357177756c71636532396530393563322d626437302d343033632d626436662d346163363662303565316238',
            signature:
              'H4CpLonpuSLY/vI7jm0hK///G0ZmhqcFnURjK5iHi4tqKASZ/ABMdVd5t9kjXHlifAgZ0AR/2Nx72HtsJZB4lmU=',
            coinSpecific: {
              witnessScript:
                '52210343da003dd9f29ae6e3128a36df064fc74f6553d69cd479d79d7c36945be294b621024dc0605a8eb9b1cd57dcdce6d4e987d4687f6bdbfde0e76fb617db71bf77e8992102fc25e4e96a7f050cc52ee176776b4eaf7cd7af3c51a0d9ae8963a5e0ffcfcbbf53ae',
            },
          },
          {
            id: '66d85a88c41c42eb9579b9e1aaa1d476',
            address: 'tb1qm4et3f642cct77s99zmwctl9mmdaemprwlndylpusl2lmesl62aq3kzg6s',
            chain: 20,
            index: 2,
            coin: 'tbtc',
            wallet: '66d747d3d1206912ec4f626771a89e5c',
            proof:
              '18426974636f696e205369676e6564204d6573736167653a0aa2424750316a396931394a6b4a54573751387a715134757251515361354c6e70665154513957353976506b45504c346561624858507a3274516b774a7a53516742746231716d346574336636343263637437377339397a6d7763746c396d6d6461656d7072776c6e64796c7075736c326c6d65736c36326171336b7a67367332396530393563322d626437302d343033632d626436662d346163363662303565316238',
            signature:
              'H4NvPaVnUFk+m2LEV30qNxWUgoUQ8OEFrjTGtJSl0GrIcpz4fKZ6aeEsN0xxWxAUf1FyMHFiPLDnzzgau9Bqp2A=',
            coinSpecific: {
              witnessScript:
                '5221027ea3cccd4f0d7bc09916be124198cea1dd89af999bfdcb1eacd6eeee413c62e5210358b6d42234b9e9714a29837f37e3b1615622c9cc72ab44c6f6ceb0fbacf5ebfb2102ab5f9f50e58201e96383d6c68f9c82416039cc5fb81d641f5f01071c6b3694ca53ae',
            },
          },
        ],
        count: 2,
        nextBatchPrevId: 'next',
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
    .get(`/tbtc/wallet/66d747d3d1206912ec4f626771a89e5c/addresses`)
    .query({
      limit: 100,
      prevId: 'next',
    })
    .reply(
      200,
      () => ({
        coin: 'tbtc',
        totalAddressCount: 1,
        addresses: [
          {
            id: '66d85a88c41c42eb9579b9e1aaa1d476',
            address: 'tb1qm4et3f642cct77s99zmwctl9mmdaemprwlndylpusl2lmesl62aq3kzg6s1',
            chain: 20,
            index: 2,
            coin: 'tbtc',
            wallet: '66d747d3d1206912ec4f626771a89e5c',
            proof:
              '18426974636f696e205369676e6564204d6573736167653a0aa2424750316a396931394a6b4a54573751387a715134757251515361354c6e70665154513957353976506b45504c346561624858507a3274516b774a7a53516742746231716d346574336636343263637437377339397a6d7763746c396d6d6461656d7072776c6e64796c7075736c326c6d65736c36326171336b7a67367332396530393563322d626437302d343033632d626436662d346163363662303565316238',
            signature:
              'H4NvPaVnUFk+m2LEV30qNxWUgoUQ8OEFrjTGtJSl0GrIcpz4fKZ6aeEsN0xxWxAUf1FyMHFiPLDnzzgau9Bqp2A=',
            coinSpecific: {
              witnessScript:
                '5221027ea3cccd4f0d7bc09916be124198cea1dd89af999bfdcb1eacd6eeee413c62e5210358b6d42234b9e9714a29837f37e3b1615622c9cc72ab44c6f6ceb0fbacf5ebfb2102ab5f9f50e58201e96383d6c68f9c82416039cc5fb81d641f5f01071c6b3694ca53ae',
            },
          },
        ],
        count: 1,
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
