/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `../idl/yield_vault.json`.
 */
export type YieldVault = {
  address: 'eUSXyKoZ6aGejYVbnp3wtWQ1E8zuokLAJPecPxxtgG3'
  metadata: {
    name: 'yieldVault'
    version: '1.1.1'
    spec: '0.1.0'
    description: 'yieldVault'
  }
  instructions: [
    {
      name: 'confirmAuthorityTransfer'
      docs: [
        'Confirm the authority transfer for the controller.',
        'Only the controller.authority can call this instruction.',
        '# Arguments',
        '',
        '* `ctx`- The accounts needed by instruction.',
        '',
      ]
      discriminator: [191, 70, 42, 162, 189, 10, 15, 247]
      accounts: [
        {
          name: 'authority'
          docs: ['#1 Authored call accessible only to the signer matching Controller.authority']
          signer: true
          relations: ['controller']
        },
        {
          name: 'payer'
          docs: ['#2 Payer of the transaction']
          writable: true
          signer: true
        },
        {
          name: 'controller'
          docs: ['#3 Top level Controller account managing the program']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 78, 84, 82, 79, 76, 76, 69, 82]
              },
            ]
          }
        },
        {
          name: 'proposedNewAuthority'
          docs: ['#4 Address of the proposed new authority to be confirmed']
          relations: ['controller']
        },
      ]
      args: []
    },
    {
      name: 'editController'
      docs: [
        'Edit the controller of the Yield Program.',
        'Only the controller.authority can call this instruction.',
        '# Arguments',
        '',
        '* `ctx`- The accounts needed by instruction.',
        '* `fields` - The fields to be edited.',
        '* `fields.vesting_period_in_seconds` - The yield vesting period in seconds.',
        '* `fields.cooldown_period_in_seconds` - The unlock withdraw cooldown period in seconds.',
        '* `fields.fast_cooldown_cutoff` - The fast cooldown cutoff.',
        '* `fields.fast_cooldown_period_in_seconds` - The fast cooldown period in seconds.',
        '',
      ]
      discriminator: [132, 153, 227, 60, 132, 180, 226, 209]
      accounts: [
        {
          name: 'authority'
          docs: ['#1 Authored call accessible only to the signer matching Controller.authority']
          signer: true
          relations: ['controller']
        },
        {
          name: 'payer'
          docs: ['#2 Payer of the transaction']
          writable: true
          signer: true
        },
        {
          name: 'controller'
          docs: ['#3 Top level Controller account managing the program']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 78, 84, 82, 79, 76, 76, 69, 82]
              },
            ]
          }
        },
      ]
      args: [
        {
          name: 'fields'
          type: {
            defined: {
              name: 'editControllerFields'
            }
          }
        },
      ]
    },
    {
      name: 'editMetadata'
      docs: [
        'Edit the metadata for eUSX mint.',
        'Only the controller.authority can call this instruction.',
        '# Arguments',
        '',
        '* `ctx`- The accounts needed by instruction.',
        '* `fields` - The fields to be edited.',
        '* `fields.name` - The name of the eUSX mint.',
        '* `fields.symbol` - The symbol of the eUSX mint.',
        '* `fields.uri` - The URI of the eUSX mint metadata.',
      ]
      discriminator: [178, 218, 211, 66, 85, 42, 99, 45]
      accounts: [
        {
          name: 'authority'
          docs: ['#1 Authored call accessible only to the signer matching Controller.authority']
          signer: true
          relations: ['controller']
        },
        {
          name: 'payer'
          docs: ['#2 Payer of the transaction']
          writable: true
          signer: true
        },
        {
          name: 'controller'
          docs: ['#3 Top level Controller account managing the program']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 78, 84, 82, 79, 76, 76, 69, 82]
              },
            ]
          }
        },
        {
          name: 'metadata'
          docs: ['#4 metadata account']
          writable: true
        },
        {
          name: 'tokenMetadataProgram'
          docs: ['#5 Token Metadata Program']
          address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
        },
      ]
      args: [
        {
          name: 'fields'
          type: {
            defined: {
              name: 'editMetadataFields'
            }
          }
        },
      ]
    },
    {
      name: 'editPermissionedAccount'
      docs: [
        "Edit the permissioned account's permissions.",
        'Only the controller.authority can call this instruction.',
        '# Arguments',
        '',
        '* `ctx`- The accounts needed by instruction.',
        '* `fields` - The fields to be edited.',
        '* `fields.can_send_yield` - harvester',
        '',
      ]
      discriminator: [74, 199, 98, 183, 46, 196, 224, 210]
      accounts: [
        {
          name: 'authority'
          docs: ['#1 Authored call accessible only to the signer matching Controller.authority']
          signer: true
          relations: ['controller']
        },
        {
          name: 'payer'
          docs: ['#2 Payer of the transaction']
          writable: true
          signer: true
        },
        {
          name: 'controller'
          docs: ['#3 Top level Controller account managing the program']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 78, 84, 82, 79, 76, 76, 69, 82]
              },
            ]
          }
        },
        {
          name: 'permissionedParty'
          docs: ['#4 Address of the permissioned party']
        },
        {
          name: 'permissionedAccount'
          docs: ['#5 Permissioned account to edit']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [
                  80,
                  69,
                  82,
                  77,
                  73,
                  83,
                  83,
                  73,
                  79,
                  78,
                  69,
                  68,
                  95,
                  65,
                  67,
                  67,
                  79,
                  85,
                  78,
                  84,
                ]
              },
              {
                kind: 'account'
                path: 'permissionedParty'
              },
            ]
          }
        },
      ]
      args: [
        {
          name: 'fields'
          type: {
            defined: {
              name: 'editPermissionFields'
            }
          }
        },
      ]
    },
    {
      name: 'editProgramFreezeStatus'
      docs: [
        'Freeze or unfreeze the program.',
        'Only the controller.authority can call this instruction.',
        '# Arguments',
        '',
        '* `ctx`- The accounts needed by instruction.',
        '* `is_frozen` - The freeze status of the program.',
        '',
      ]
      discriminator: [29, 202, 0, 135, 36, 221, 162, 73]
      accounts: [
        {
          name: 'authority'
          docs: ['#1 Authored call accessible only to the signer matching Controller.authority']
          signer: true
          relations: ['controller']
        },
        {
          name: 'payer'
          docs: ['#2 Payer of the transaction']
          writable: true
          signer: true
        },
        {
          name: 'controller'
          docs: ['#3 Top level Controller account managing the program']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 78, 84, 82, 79, 76, 76, 69, 82]
              },
            ]
          }
        },
      ]
      args: [
        {
          name: 'isFrozen'
          type: 'bool'
        },
      ]
    },
    {
      name: 'initializeAuthorityTransfer'
      docs: [
        'Initialize the authority transfer for the controller.',
        'Only the controller.authority can call this instruction.',
        '# Arguments',
        '',
        '* `ctx`- The accounts needed by instruction.',
        '',
      ]
      discriminator: [60, 146, 106, 171, 144, 253, 153, 35]
      accounts: [
        {
          name: 'authority'
          docs: ['#1 Authored call accessible only to the signer matching Controller.authority']
          signer: true
          relations: ['controller']
        },
        {
          name: 'payer'
          docs: ['#2 Payer of the transaction']
          writable: true
          signer: true
        },
        {
          name: 'controller'
          docs: ['#3 Top level Controller account managing the program']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 78, 84, 82, 79, 76, 76, 69, 82]
              },
            ]
          }
        },
        {
          name: 'proposedNewAuthority'
          docs: ['#4 Address of the proposed new authority']
        },
      ]
      args: []
    },
    {
      name: 'initializeController'
      docs: [
        'Initialize the controller of the Yield Program.',
        'This should be called immediately after the program is deployed.',
        '# Arguments',
        '',
        '* `ctx`- The accounts needed by instruction.',
        '* `fields` - The fields to be initialized.',
        '* `fields.mint_decimals` - The eUSX mint decimals.',
        '* `fields.vesting_period_in_seconds` - The yield vesting period in seconds.',
        '* `fields.cooldown_period_in_seconds` - The unlock withdraw cooldown period in seconds.',
        '* `fields.fast_cooldown_cutoff` - The fast cooldown cutoff.',
        '* `fields.fast_cooldown_period_in_seconds` - The fast cooldown period in seconds.',
        '',
      ]
      discriminator: [137, 255, 100, 190, 201, 247, 241, 81]
      accounts: [
        {
          name: 'authority'
          docs: ['#1 Authored call accessible only to the signer matching authorized address.']
          signer: true
        },
        {
          name: 'payer'
          docs: ['#2 Payer of the transaction']
          writable: true
          signer: true
        },
        {
          name: 'controller'
          docs: ['#3 Top level Controller account managing the program']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 78, 84, 82, 79, 76, 76, 69, 82]
              },
            ]
          }
        },
        {
          name: 'shareMint'
          docs: ['#4 The eUSX mint managed by the Controller account, controlled by the controller']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [83, 72, 65, 82, 69, 95, 77, 73, 78, 84]
              },
            ]
          }
        },
        {
          name: 'systemProgram'
          docs: ['#5 System program, required for account creation']
          address: '11111111111111111111111111111111'
        },
        {
          name: 'tokenProgram'
          docs: ['#6 Token program, required for mint creation']
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        },
      ]
      args: [
        {
          name: 'fields'
          type: {
            defined: {
              name: 'initControllerFields'
            }
          }
        },
      ]
    },
    {
      name: 'initializeMetadata'
      docs: [
        'Initialize the metadata for eUSX mint.',
        'Only the controller.authority can call this instruction.',
        '# Arguments',
        '',
        '* `ctx`- The accounts needed by instruction.',
        '* `fields` - The fields to be initialized.',
        '* `fields.name` - The name of the eUSX mint.',
        '* `fields.symbol` - The symbol of the eUSX mint.',
        '* `fields.uri` - The URI of the eUSX mint metadata.',
      ]
      discriminator: [35, 215, 241, 156, 122, 208, 206, 212]
      accounts: [
        {
          name: 'authority'
          docs: ['#1 Authored call accessible only to the signer matching Controller.authority']
          signer: true
          relations: ['controller']
        },
        {
          name: 'payer'
          docs: ['#2 Payer of the transaction']
          writable: true
          signer: true
        },
        {
          name: 'controller'
          docs: ['#3 Top level Controller account managing the program']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 78, 84, 82, 79, 76, 76, 69, 82]
              },
            ]
          }
        },
        {
          name: 'shareMint'
          docs: ['#4 eUSX mint']
          writable: true
          relations: ['controller']
        },
        {
          name: 'metadata'
          docs: ['#5 metadata account']
          writable: true
        },
        {
          name: 'tokenMetadataProgram'
          docs: ['#6 Token Metadata Program']
          address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'fields'
          type: {
            defined: {
              name: 'initMetadataFields'
            }
          }
        },
      ]
    },
    {
      name: 'initializePermissionedAccount'
      docs: [
        'Initialize the permissioned account to store permissions.',
        'Only the controller.authority can call this instruction.',
        '',
        'The permissioned account PDA is derived from the permissioned party, and stores the',
        'permitted actions for the permissioned party.',
        '# Arguments',
        '',
        '* `ctx`- The accounts needed by instruction.',
        '* `permissions` - The permission fields for the permissioned account.',
        '* `permissions.can_send_yield` - harvester',
        '',
      ]
      discriminator: [183, 7, 55, 76, 75, 68, 182, 46]
      accounts: [
        {
          name: 'authority'
          docs: ['#1 Authored call accessible only to the signer matching Controller.authority']
          signer: true
          relations: ['controller']
        },
        {
          name: 'payer'
          docs: ['#2 Payer of the transaction']
          writable: true
          signer: true
        },
        {
          name: 'controller'
          docs: ['#3 Top level Controller account managing the program']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 78, 84, 82, 79, 76, 76, 69, 82]
              },
            ]
          }
        },
        {
          name: 'permissionedParty'
          docs: ['#4 Address of the permissioned party']
        },
        {
          name: 'permissionedAccount'
          docs: ['#5 Permissioned account with a PDA derived from permissioned_party']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [
                  80,
                  69,
                  82,
                  77,
                  73,
                  83,
                  83,
                  73,
                  79,
                  78,
                  69,
                  68,
                  95,
                  65,
                  67,
                  67,
                  79,
                  85,
                  78,
                  84,
                ]
              },
              {
                kind: 'account'
                path: 'permissionedParty'
              },
            ]
          }
        },
        {
          name: 'systemProgram'
          docs: ['#6 System program, required for account creation']
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'permissions'
          type: {
            defined: {
              name: 'initPermissionFields'
            }
          }
        },
      ]
    },
    {
      name: 'initializeVestingSchedule'
      docs: [
        'Initialize the vesting schedule for controlling the vesting of yield.',
        'Only the controller.authority can call this instruction.',
        '# Arguments',
        '',
        '* `ctx`- The accounts needed by instruction.',
        '',
      ]
      discriminator: [138, 203, 174, 154, 16, 126, 177, 27]
      accounts: [
        {
          name: 'authority'
          docs: ['#1 Authored call accessible only to the signer matching Controller.authority']
          signer: true
          relations: ['controller']
        },
        {
          name: 'payer'
          docs: ['#2 Payer of the transaction']
          writable: true
          signer: true
        },
        {
          name: 'controller'
          docs: ['#3 Top level Controller account managing the program']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 78, 84, 82, 79, 76, 76, 69, 82]
              },
            ]
          }
        },
        {
          name: 'vestingSchedule'
          docs: ['#4 Vesting schedule account managing yield vesting']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [86, 69, 83, 84, 73, 78, 71, 95, 83, 67, 72, 69, 68, 85, 76, 69]
              },
            ]
          }
        },
        {
          name: 'systemProgram'
          docs: ['#5 System program, required for account creation']
          address: '11111111111111111111111111111111'
        },
      ]
      args: []
    },
    {
      name: 'initializeYieldPool'
      docs: [
        'Initialize the yield pool for keeping track of the yield pool accounting.',
        'Only the controller.authority can call this instruction.',
        '# Arguments',
        '',
        '* `ctx`- The accounts needed by instruction.',
        '',
      ]
      discriminator: [32, 7, 57, 189, 201, 125, 93, 149]
      accounts: [
        {
          name: 'authority'
          docs: ['#1 Authored call accessible only to the signer matching Controller.authority']
          signer: true
          relations: ['controller']
        },
        {
          name: 'payer'
          docs: ['#2 Payer of the transaction']
          writable: true
          signer: true
        },
        {
          name: 'controller'
          docs: ['#3 Top level Controller account managing the program']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 78, 84, 82, 79, 76, 76, 69, 82]
              },
            ]
          }
        },
        {
          name: 'yieldPool'
          docs: ['#4 yield pool account keeping track of accounting']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [89, 73, 69, 76, 68, 95, 80, 79, 79, 76]
              },
            ]
          }
        },
        {
          name: 'assetVault'
          docs: ['#5 The vault where the USX assets are locked, controlled by the controller']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [65, 83, 83, 69, 84, 95, 86, 65, 85, 76, 84]
              },
            ]
          }
        },
        {
          name: 'assetMint'
          docs: ['#6 The USX mint']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [82, 69, 68, 69, 69, 77, 65, 66, 76, 69]
              },
            ]
          }
        },
        {
          name: 'systemProgram'
          docs: ['#7 System program, required for account creation']
          address: '11111111111111111111111111111111'
        },
        {
          name: 'tokenProgram'
          docs: ['#8 Token program, required for token account creation']
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        },
      ]
      args: []
    },
    {
      name: 'lock'
      docs: [
        'Lock the USX assets and receive eUSX shares.',
        'This is a permissionless instruction.',
        '# Arguments',
        '',
        '* `ctx`- The accounts needed by instruction.',
        '* `asset_amount` - The amount of USX to be locked.',
        '',
      ]
      discriminator: [21, 19, 208, 43, 237, 62, 255, 87]
      accounts: [
        {
          name: 'user'
          docs: ['#1 Lock assets into the yield pool']
          writable: true
          signer: true
        },
        {
          name: 'payer'
          docs: ['#2 Payer of the transaction']
          writable: true
          signer: true
        },
        {
          name: 'controller'
          docs: ['#3 Top level Controller account managing the program']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 78, 84, 82, 79, 76, 76, 69, 82]
              },
            ]
          }
        },
        {
          name: 'vestingSchedule'
          docs: ['#4 Vesting schedule account managing yield vesting']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [86, 69, 83, 84, 73, 78, 71, 95, 83, 67, 72, 69, 68, 85, 76, 69]
              },
            ]
          }
        },
        {
          name: 'shareMint'
          docs: ['#5 eUSX mint, checked by the controller']
          writable: true
          relations: ['controller']
        },
        {
          name: 'userShares'
          docs: ["#6 User's eUSX token account, mint and owner checked"]
          writable: true
        },
        {
          name: 'assetMint'
          docs: ["#7 User's USX mint, checked by the yield pool"]
          relations: ['yieldPool']
        },
        {
          name: 'assetVault'
          docs: ["#8 Yield program's USX vault"]
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [65, 83, 83, 69, 84, 95, 86, 65, 85, 76, 84]
              },
            ]
          }
        },
        {
          name: 'yieldPool'
          docs: ['#9 Yield pool account managing accounting']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [89, 73, 69, 76, 68, 95, 80, 79, 79, 76]
              },
            ]
          }
        },
        {
          name: 'userAssets'
          docs: ["#10 User's USX token account, mint and owner checked"]
          writable: true
        },
        {
          name: 'tokenProgram'
          docs: ['#11 Token program, required for token transfers']
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        },
      ]
      args: [
        {
          name: 'assetAmount'
          type: 'u64'
        },
      ]
    },
    {
      name: 'transferInYield'
      docs: [
        'Transfer in yield which starts a new round of yield vesting.',
        'Only a permissioned account can call this instruction.',
        '# Arguments',
        '',
        '* `ctx`- The accounts needed by instruction.',
        '* `asset_amount` - The amount of USX to be transferred in.',
        '',
      ]
      discriminator: [41, 24, 250, 54, 30, 135, 145, 59]
      accounts: [
        {
          name: 'harvester'
          docs: ['#1 Harvester is a permissioned party, checked by permissioned account']
          signer: true
        },
        {
          name: 'payer'
          docs: ['#2 Payer of the transaction']
          writable: true
          signer: true
        },
        {
          name: 'permissionedAccount'
          docs: ['#3 Permissioned account bound to the harvester']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [
                  80,
                  69,
                  82,
                  77,
                  73,
                  83,
                  83,
                  73,
                  79,
                  78,
                  69,
                  68,
                  95,
                  65,
                  67,
                  67,
                  79,
                  85,
                  78,
                  84,
                ]
              },
              {
                kind: 'account'
                path: 'harvester'
              },
            ]
          }
        },
        {
          name: 'controller'
          docs: ['#4 Top level Controller account managing the program']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 78, 84, 82, 79, 76, 76, 69, 82]
              },
            ]
          }
        },
        {
          name: 'vestingSchedule'
          docs: ['#5 Vesting schedule account managing yield vesting']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [86, 69, 83, 84, 73, 78, 71, 95, 83, 67, 72, 69, 68, 85, 76, 69]
              },
            ]
          }
        },
        {
          name: 'harvesterAssets'
          docs: ["#6 Harvester's USX account, owner and mint checked"]
          writable: true
        },
        {
          name: 'assetMint'
          docs: ['#7 USX mint, checked by the yield pool']
          relations: ['yieldPool']
        },
        {
          name: 'assetVault'
          docs: ["#8 Yield program's USX vault"]
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [65, 83, 83, 69, 84, 95, 86, 65, 85, 76, 84]
              },
            ]
          }
        },
        {
          name: 'yieldPool'
          docs: ['#9 Yield pool account managing accounting']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [89, 73, 69, 76, 68, 95, 80, 79, 79, 76]
              },
            ]
          }
        },
        {
          name: 'tokenProgram'
          docs: ['#10 Token program, required for token transfers']
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        },
      ]
      args: [
        {
          name: 'assetAmount'
          type: 'u64'
        },
      ]
    },
    {
      name: 'unlock'
      docs: [
        'Unlock the eUSX shares and receive USX assets.',
        'The USX assets are locked in a cooldown escrow for a period of time.',
        'This is a permissionless instruction.',
        '# Arguments',
        '',
        '* `ctx`- The accounts needed by instruction.',
        '* `share_amount` - The amount of eUSX shares to be unlocked.',
        '',
      ]
      discriminator: [101, 155, 40, 21, 158, 189, 56, 203]
      accounts: [
        {
          name: 'user'
          docs: ['#1 Unlock assets from the yield pool']
          signer: true
        },
        {
          name: 'payer'
          docs: ['#2 Payer of the transaction']
          writable: true
          signer: true
        },
        {
          name: 'controller'
          docs: ['#3 Top level Controller account managing the program']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 78, 84, 82, 79, 76, 76, 69, 82]
              },
            ]
          }
        },
        {
          name: 'vestingSchedule'
          docs: ['#4 Vesting schedule account managing yield vesting']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [86, 69, 83, 84, 73, 78, 71, 95, 83, 67, 72, 69, 68, 85, 76, 69]
              },
            ]
          }
        },
        {
          name: 'shareMint'
          docs: ['#5 The eUSX mint, checked by the controller']
          writable: true
          relations: ['controller']
        },
        {
          name: 'userShares'
          docs: ["#6 User's eUSX token account, mint and owner checked"]
          writable: true
        },
        {
          name: 'assetMint'
          docs: ['#7 The USX mint, checked by the yield pool']
          relations: ['yieldPool']
        },
        {
          name: 'assetVault'
          docs: ["#8 Yield program's USX vault"]
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [65, 83, 83, 69, 84, 95, 86, 65, 85, 76, 84]
              },
            ]
          }
        },
        {
          name: 'yieldPool'
          docs: ['#9 Yield pool account keeping track of accounting']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [89, 73, 69, 76, 68, 95, 80, 79, 79, 76]
              },
            ]
          }
        },
        {
          name: 'cooldownEscrow'
          docs: ['#10 Escrow account with a PDA derived from the user']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 79, 76, 68, 79, 87, 78, 95, 69, 83, 67, 82, 79, 87]
              },
              {
                kind: 'account'
                path: 'user'
              },
            ]
          }
        },
        {
          name: 'cooldownEscrowVault'
          docs: ['#11 USX account to keep the assets during cooldown, controlled by the PDA']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [
                  67,
                  79,
                  79,
                  76,
                  68,
                  79,
                  87,
                  78,
                  95,
                  69,
                  83,
                  67,
                  82,
                  79,
                  87,
                  95,
                  86,
                  65,
                  85,
                  76,
                  84,
                ]
              },
              {
                kind: 'account'
                path: 'user'
              },
            ]
          }
        },
        {
          name: 'tokenProgram'
          docs: ['#12 Token program, required for token transfers']
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        },
        {
          name: 'systemProgram'
          docs: ['#13 System program, required for account creation']
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'shareAmount'
          type: 'u64'
        },
      ]
    },
    {
      name: 'withdraw'
      docs: [
        'Withdraw all the USX assets from the cooldown escrow after the cooldown period.',
        'This is a permissionless instruction.',
        '# Arguments',
        '',
        '* `ctx`- The accounts needed by instruction.',
        '',
      ]
      discriminator: [183, 18, 70, 156, 148, 109, 161, 34]
      accounts: [
        {
          name: 'user'
          docs: ['#1 Withdraw assets from the cooldown escrow']
          signer: true
        },
        {
          name: 'payer'
          docs: ['#2 Payer of the transaction']
          writable: true
          signer: true
        },
        {
          name: 'controller'
          docs: ['#3 Top level Controller account managing the program']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 78, 84, 82, 79, 76, 76, 69, 82]
              },
            ]
          }
        },
        {
          name: 'assetMint'
          docs: ['#4 The USX mint, checked by the cooldown escrow']
          relations: ['cooldownEscrow']
        },
        {
          name: 'userAssets'
          docs: ["#5 User's USX token account, mint and owner checked"]
          writable: true
        },
        {
          name: 'cooldownEscrow'
          docs: ['#6 Cooldown escrow bound to the user']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [67, 79, 79, 76, 68, 79, 87, 78, 95, 69, 83, 67, 82, 79, 87]
              },
              {
                kind: 'account'
                path: 'user'
              },
            ]
          }
        },
        {
          name: 'cooldownEscrowVault'
          docs: ['#7 Cooldown escrow vault bound to the user']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [
                  67,
                  79,
                  79,
                  76,
                  68,
                  79,
                  87,
                  78,
                  95,
                  69,
                  83,
                  67,
                  82,
                  79,
                  87,
                  95,
                  86,
                  65,
                  85,
                  76,
                  84,
                ]
              },
              {
                kind: 'account'
                path: 'user'
              },
            ]
          }
        },
        {
          name: 'tokenProgram'
          docs: ['#8 Token program, required for token transfers']
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        },
      ]
      args: []
    },
  ]
  accounts: [
    {
      name: 'controller'
      discriminator: [184, 79, 171, 0, 183, 43, 113, 110]
    },
    {
      name: 'cooldownEscrow'
      discriminator: [33, 77, 148, 155, 188, 243, 149, 148]
    },
    {
      name: 'permissionedAccount'
      discriminator: [155, 189, 86, 246, 89, 218, 143, 27]
    },
    {
      name: 'vestingSchedule'
      discriminator: [130, 200, 173, 148, 39, 75, 243, 147]
    },
    {
      name: 'yieldPool'
      discriminator: [118, 216, 37, 206, 197, 189, 27, 100]
    },
  ]
  events: [
    {
      name: 'confirmAuthorityTransferEvent'
      discriminator: [239, 178, 28, 126, 49, 50, 91, 183]
    },
    {
      name: 'editControllerEvent'
      discriminator: [142, 25, 132, 229, 111, 235, 12, 243]
    },
    {
      name: 'editPermissionedAccountEvent'
      discriminator: [41, 159, 239, 106, 42, 187, 200, 213]
    },
    {
      name: 'editProgramFreezeStatusEvent'
      discriminator: [176, 199, 3, 156, 140, 222, 29, 202]
    },
    {
      name: 'initializeAuthorityTransferEvent'
      discriminator: [87, 106, 217, 74, 230, 245, 115, 76]
    },
    {
      name: 'initializeControllerEvent'
      discriminator: [236, 159, 123, 225, 71, 177, 241, 0]
    },
    {
      name: 'initializePermissionedAccountEvent'
      discriminator: [47, 169, 103, 2, 140, 230, 127, 66]
    },
    {
      name: 'initializeVestingScheduleEvent'
      discriminator: [198, 11, 6, 102, 65, 217, 35, 114]
    },
    {
      name: 'initializeYieldPoolEvent'
      discriminator: [199, 241, 74, 40, 88, 142, 251, 195]
    },
    {
      name: 'lockEvent'
      discriminator: [76, 37, 6, 186, 14, 42, 253, 15]
    },
    {
      name: 'transferInYieldEvent'
      discriminator: [29, 47, 92, 217, 235, 180, 239, 175]
    },
    {
      name: 'unlockEvent'
      discriminator: [105, 1, 235, 144, 68, 123, 75, 123]
    },
    {
      name: 'withdrawEvent'
      discriminator: [22, 9, 133, 26, 160, 44, 71, 192]
    },
  ]
  errors: [
    {
      code: 6000
      name: 'programFrozen'
      msg: 'The program is currently in Frozen state.'
    },
    {
      code: 6001
      name: 'invalidMintDecimals'
      msg: 'The provided mint decimals is invalid.'
    },
    {
      code: 6002
      name: 'invalidVestingPeriod'
      msg: 'The provided vesting period is invalid.'
    },
    {
      code: 6003
      name: 'invalidCooldownPeriod'
      msg: 'The provided cooldown period is invalid.'
    },
    {
      code: 6004
      name: 'programFreezeStatusUnchanged'
      msg: 'Invalid freeze status change: program is already in this status.'
    },
    {
      code: 6005
      name: 'lastVestingNotEnded'
      msg: 'Last vesting has not ended yet'
    },
    {
      code: 6006
      name: 'invalidCurrentBlockTime'
      msg: 'Current block time is invalid'
    },
    {
      code: 6007
      name: 'invalidOwner'
      msg: 'The provided token account is not owner by the expected party.'
    },
    {
      code: 6008
      name: 'invalidAuthority'
      msg: 'Only the Program authority can access this instruction.'
    },
    {
      code: 6009
      name: 'invalidPermissions'
      msg: 'Permissions must be provided.'
    },
    {
      code: 6010
      name: 'invalidPermissionRights'
      msg: 'Account does not have permission to perform the operation.'
    },
    {
      code: 6011
      name: 'invalidAssetMint'
      msg: 'The provided asset mint is invalid'
    },
    {
      code: 6012
      name: 'invalidShareMint'
      msg: 'The provided share mint is invalid'
    },
    {
      code: 6013
      name: 'cooldownNotEnded'
      msg: 'The cooldown period is not ended yet.'
    },
    {
      code: 6014
      name: 'invalidAmount'
      msg: 'The amount cannot be 0'
    },
    {
      code: 6015
      name: 'insufficientFunds'
      msg: 'The balance of the provided account is not enough to fulfill the operation.'
    },
    {
      code: 6016
      name: 'mathError'
      msg: 'Math error.'
    },
    {
      code: 6017
      name: 'zeroShareAmount'
      msg: 'Cannot mint zero share.'
    },
    {
      code: 6018
      name: 'invalidAuthorityTransfer'
      msg: 'Invalid authority transfer request.'
    },
  ]
  types: [
    {
      name: 'confirmAuthorityTransferEvent'
      docs: ['Event called in [instructions::confirm_authority_transfer::handler].']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'controller'
            docs: ['The controller.']
            type: 'pubkey'
          },
          {
            name: 'newAuthority'
            docs: ['The new authority.']
            type: 'pubkey'
          },
        ]
      }
    },
    {
      name: 'controller'
      serialization: 'bytemuck'
      repr: {
        kind: 'c'
        packed: true
      }
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'authority'
            type: 'pubkey'
          },
          {
            name: 'bump'
            type: 'u8'
          },
          {
            name: 'shareMint'
            type: 'pubkey'
          },
          {
            name: 'shareMintDecimals'
            type: 'u8'
          },
          {
            name: 'vestingPeriodInSeconds'
            type: 'u64'
          },
          {
            name: 'cooldownPeriodInSeconds'
            type: 'u64'
          },
          {
            name: 'proposedNewAuthority'
            type: 'pubkey'
          },
          {
            name: 'hasProposedAuthority'
            type: 'u8'
          },
          {
            name: 'isFrozen'
            type: 'u8'
          },
          {
            name: 'fastCooldownCutoff'
            type: 'u64'
          },
          {
            name: 'fastCooldownPeriodInSeconds'
            type: 'u64'
          },
          {
            name: 'reserved'
            type: {
              array: ['u8', 112]
            }
          },
        ]
      }
    },
    {
      name: 'cooldownEscrow'
      serialization: 'bytemuck'
      repr: {
        kind: 'c'
        packed: true
      }
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'user'
            type: 'pubkey'
          },
          {
            name: 'bump'
            type: 'u8'
          },
          {
            name: 'assetMint'
            type: 'pubkey'
          },
          {
            name: 'assetAmount'
            type: 'u64'
          },
          {
            name: 'cooldownEnd'
            type: 'u64'
          },
          {
            name: 'reserved'
            type: {
              array: ['u8', 128]
            }
          },
        ]
      }
    },
    {
      name: 'editControllerEvent'
      docs: ['Event called in [instructions::edit_controller::handler].']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'controller'
            docs: ['The controller.']
            type: 'pubkey'
          },
          {
            name: 'vestingPeriodInSeconds'
            docs: ['The new vesting period in seconds.']
            type: 'u64'
          },
          {
            name: 'cooldownPeriodInSeconds'
            docs: ['The new cooldown period in seconds.']
            type: 'u64'
          },
        ]
      }
    },
    {
      name: 'editControllerFields'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'vestingPeriodInSeconds'
            type: {
              option: 'u64'
            }
          },
          {
            name: 'cooldownPeriodInSeconds'
            type: {
              option: 'u64'
            }
          },
          {
            name: 'fastCooldownCutoff'
            type: {
              option: 'u64'
            }
          },
          {
            name: 'fastCooldownPeriodInSeconds'
            type: {
              option: 'u64'
            }
          },
        ]
      }
    },
    {
      name: 'editMetadataFields'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'name'
            type: 'string'
          },
          {
            name: 'symbol'
            type: 'string'
          },
          {
            name: 'uri'
            type: 'string'
          },
        ]
      }
    },
    {
      name: 'editPermissionFields'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'canSendYield'
            type: {
              option: 'bool'
            }
          },
        ]
      }
    },
    {
      name: 'editPermissionedAccountEvent'
      docs: ['Event called in [instructions::edit_permissioned_account::handler].']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'controller'
            docs: ['The controller.']
            type: 'pubkey'
          },
          {
            name: 'permissionedParty'
            docs: ['The permissioned party.']
            type: 'pubkey'
          },
          {
            name: 'permissionedAccount'
            docs: ['The permissioned account PDA.']
            type: 'pubkey'
          },
          {
            name: 'canSendYield'
            type: 'bool'
          },
        ]
      }
    },
    {
      name: 'editProgramFreezeStatusEvent'
      docs: ['Event called in [instructions::edit_program_freeze_status::handler].']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'controller'
            docs: ['The controller.']
            type: 'pubkey'
          },
          {
            name: 'isFrozen'
            docs: ['The freeze status.']
            type: 'bool'
          },
        ]
      }
    },
    {
      name: 'initControllerFields'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'mintDecimals'
            type: 'u8'
          },
          {
            name: 'vestingPeriodInSeconds'
            type: 'u64'
          },
          {
            name: 'cooldownPeriodInSeconds'
            type: 'u64'
          },
          {
            name: 'fastCooldownCutoff'
            type: 'u64'
          },
          {
            name: 'fastCooldownPeriodInSeconds'
            type: 'u64'
          },
        ]
      }
    },
    {
      name: 'initMetadataFields'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'name'
            type: 'string'
          },
          {
            name: 'symbol'
            type: 'string'
          },
          {
            name: 'uri'
            type: 'string'
          },
        ]
      }
    },
    {
      name: 'initPermissionFields'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'canSendYield'
            type: 'bool'
          },
        ]
      }
    },
    {
      name: 'initializeAuthorityTransferEvent'
      docs: ['Event called in [instructions::initialize_authority_transfer::handler].']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'controller'
            docs: ['The controller.']
            type: 'pubkey'
          },
          {
            name: 'newAuthority'
            docs: ['The new authority.']
            type: 'pubkey'
          },
        ]
      }
    },
    {
      name: 'initializeControllerEvent'
      docs: ['Event called in [instructions::initialize_controller::handler].']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'controller'
            docs: ['The controller being created.']
            type: 'pubkey'
          },
          {
            name: 'authority'
            docs: ['The authority.']
            type: 'pubkey'
          },
          {
            name: 'shareMint'
            docs: ['The shares mint.']
            type: 'pubkey'
          },
          {
            name: 'shareMintDecimals'
            docs: ['The shares mint decimals.']
            type: 'u8'
          },
          {
            name: 'vestingPeriodInSeconds'
            docs: ['The vesting period in seconds.']
            type: 'u64'
          },
          {
            name: 'cooldownPeriodInSeconds'
            docs: ['The cooldown period in seconds.']
            type: 'u64'
          },
        ]
      }
    },
    {
      name: 'initializePermissionedAccountEvent'
      docs: ['Event called in [instructions::initialize_permissioned_account::handler].']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'controller'
            docs: ['The controller.']
            type: 'pubkey'
          },
          {
            name: 'permissionedParty'
            docs: ['The permissioned party.']
            type: 'pubkey'
          },
          {
            name: 'permissionedAccount'
            docs: ['The permissioned account PDA.']
            type: 'pubkey'
          },
          {
            name: 'canSendYield'
            type: 'bool'
          },
        ]
      }
    },
    {
      name: 'initializeVestingScheduleEvent'
      docs: ['Event called in [instructions::initialize_vesting_schedule::handler].']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'controller'
            docs: ['The controller.']
            type: 'pubkey'
          },
          {
            name: 'vestingSchedule'
            docs: ['The vesting schedule.']
            type: 'pubkey'
          },
        ]
      }
    },
    {
      name: 'initializeYieldPoolEvent'
      docs: ['Event called in [instructions::initialize_yield_pool::handler].']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'controller'
            docs: ['The controller.']
            type: 'pubkey'
          },
          {
            name: 'yieldPool'
            docs: ['The yield pool.']
            type: 'pubkey'
          },
          {
            name: 'assetVault'
            docs: ['The asset vault initialized.']
            type: 'pubkey'
          },
          {
            name: 'assetMint'
            docs: ['The asset mint.']
            type: 'pubkey'
          },
        ]
      }
    },
    {
      name: 'lockEvent'
      docs: ['Event called in [instructions::lock::handler].']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'controller'
            docs: ['The controller.']
            type: 'pubkey'
          },
          {
            name: 'yieldPool'
            docs: ['The yield pool.']
            type: 'pubkey'
          },
          {
            name: 'user'
            docs: ['The user account.']
            type: 'pubkey'
          },
          {
            name: 'assetAmount'
            docs: ['The amount of assets locked.']
            type: 'u64'
          },
          {
            name: 'shareAmount'
            docs: ['The amount of shares minted.']
            type: 'u64'
          },
          {
            name: 'unvestedAmount'
            docs: ['Unvested asset amount.']
            type: 'u64'
          },
          {
            name: 'totalAssetsBefore'
            docs: [
              'Total assets in the yield pool before the lock.',
              'This includes the unvested yield which cannot be claimed.',
            ]
            type: 'u128'
          },
          {
            name: 'sharesSupplyBefore'
            docs: ['Shares supply before the lock.']
            type: 'u128'
          },
          {
            name: 'totalAssetsAfter'
            docs: ['total assets in the yield pool after the lock.']
            type: 'u128'
          },
          {
            name: 'sharesSupplyAfter'
            docs: ['Shares supply after the lock.']
            type: 'u128'
          },
        ]
      }
    },
    {
      name: 'permissionedAccount'
      serialization: 'bytemuck'
      repr: {
        kind: 'c'
        packed: true
      }
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'bump'
            type: 'u8'
          },
          {
            name: 'canSendYield'
            type: 'u8'
          },
          {
            name: 'reserved'
            type: {
              array: ['u8', 128]
            }
          },
        ]
      }
    },
    {
      name: 'transferInYieldEvent'
      docs: ['Event called in [instructions::transfer_in_yield::handler].']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'controller'
            docs: ['The controller.']
            type: 'pubkey'
          },
          {
            name: 'yieldPool'
            docs: ['The yield pool.']
            type: 'pubkey'
          },
          {
            name: 'harvester'
            docs: ['The harvester.']
            type: 'pubkey'
          },
          {
            name: 'assetAmount'
            docs: ['The amount of assets transferred.']
            type: 'u64'
          },
          {
            name: 'totalAssetsBefore'
            docs: ['Total assets in the yield pool before the transfer.']
            type: 'u128'
          },
          {
            name: 'totalAssetsAfter'
            docs: ['Total assets in the yield pool after the transfer.']
            type: 'u128'
          },
          {
            name: 'vestingStartTime'
            docs: ['Vesting start time.']
            type: 'u64'
          },
          {
            name: 'vestingEndTime'
            docs: ['Vesting end time.']
            type: 'u64'
          },
        ]
      }
    },
    {
      name: 'unlockEvent'
      docs: ['Event called in [instructions::unlock::handler].']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'controller'
            docs: ['The controller.']
            type: 'pubkey'
          },
          {
            name: 'yieldPool'
            docs: ['The yield pool.']
            type: 'pubkey'
          },
          {
            name: 'user'
            docs: ['The user account.']
            type: 'pubkey'
          },
          {
            name: 'assetAmount'
            docs: ['The amount of assets unlocked.']
            type: 'u64'
          },
          {
            name: 'shareAmount'
            docs: ['The amount of shares burned.']
            type: 'u64'
          },
          {
            name: 'unvestedAmount'
            docs: ['Unvested assets amount.']
            type: 'u64'
          },
          {
            name: 'totalAssetsBefore'
            docs: ['Total assets in the yield pool before the unlock.']
            type: 'u128'
          },
          {
            name: 'sharesSupplyBefore'
            docs: ['Shares supply before the unlock.']
            type: 'u128'
          },
          {
            name: 'totalAssetsAfter'
            docs: ['total assets in the yield pool after the unlock.']
            type: 'u128'
          },
          {
            name: 'sharesSupplyAfter'
            docs: ['Shares supply after the unlock.']
            type: 'u128'
          },
          {
            name: 'cooldownEscrowAssetAmount'
            docs: ['The assets amount in the cooldown escrow.']
            type: 'u64'
          },
          {
            name: 'cooldownEnd'
            docs: ['The cooldown end time.']
            type: 'u64'
          },
          {
            name: 'isInitNeeded'
            type: 'bool'
          },
        ]
      }
    },
    {
      name: 'vestingSchedule'
      serialization: 'bytemuck'
      repr: {
        kind: 'c'
        packed: true
      }
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'bump'
            type: 'u8'
          },
          {
            name: 'vestingAmount'
            type: 'u64'
          },
          {
            name: 'startTime'
            type: 'u64'
          },
          {
            name: 'endTime'
            type: 'u64'
          },
          {
            name: 'reserved'
            type: {
              array: ['u8', 128]
            }
          },
        ]
      }
    },
    {
      name: 'withdrawEvent'
      docs: ['Event called in [instructions::withdraw::handler].']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'controller'
            docs: ['The controller.']
            type: 'pubkey'
          },
          {
            name: 'user'
            docs: ['The user account.']
            type: 'pubkey'
          },
          {
            name: 'assetAmount'
            docs: ['The amount of assets withdrawn.']
            type: 'u64'
          },
        ]
      }
    },
    {
      name: 'yieldPool'
      serialization: 'bytemuck'
      repr: {
        kind: 'c'
        packed: true
      }
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'bump'
            type: 'u8'
          },
          {
            name: 'assetMint'
            type: 'pubkey'
          },
          {
            name: 'assetMintDecimals'
            type: 'u8'
          },
          {
            name: 'assetVault'
            type: 'pubkey'
          },
          {
            name: 'assetVaultBump'
            type: 'u8'
          },
          {
            name: 'totalAssets'
            type: 'u128'
          },
          {
            name: 'sharesSupply'
            type: 'u128'
          },
          {
            name: 'reserved'
            type: {
              array: ['u8', 512]
            }
          },
        ]
      }
    },
  ]
  constants: [
    {
      name: 'assetVaultNamespace'
      type: 'bytes'
      value: '[65, 83, 83, 69, 84, 95, 86, 65, 85, 76, 84]'
    },
    {
      name: 'controllerNamespace'
      type: 'bytes'
      value: '[67, 79, 78, 84, 82, 79, 76, 76, 69, 82]'
    },
    {
      name: 'cooldownEscrowNamespace'
      type: 'bytes'
      value: '[67, 79, 79, 76, 68, 79, 87, 78, 95, 69, 83, 67, 82, 79, 87]'
    },
    {
      name: 'cooldownEscrowVaultNamespace'
      type: 'bytes'
      value: '[67, 79, 79, 76, 68, 79, 87, 78, 95, 69, 83, 67, 82, 79, 87, 95, 86, 65, 85, 76, 84]'
    },
    {
      name: 'permissionedAccountNamespace'
      type: 'bytes'
      value: '[80, 69, 82, 77, 73, 83, 83, 73, 79, 78, 69, 68, 95, 65, 67, 67, 79, 85, 78, 84]'
    },
    {
      name: 'shareMintNamespace'
      type: 'bytes'
      value: '[83, 72, 65, 82, 69, 95, 77, 73, 78, 84]'
    },
    {
      name: 'usxRedeemableMintNamespace'
      type: 'bytes'
      value: '[82, 69, 68, 69, 69, 77, 65, 66, 76, 69]'
    },
    {
      name: 'vestingScheduleNamespace'
      type: 'bytes'
      value: '[86, 69, 83, 84, 73, 78, 71, 95, 83, 67, 72, 69, 68, 85, 76, 69]'
    },
    {
      name: 'yieldPoolNamespace'
      type: 'bytes'
      value: '[89, 73, 69, 76, 68, 95, 80, 79, 79, 76]'
    },
  ]
}
