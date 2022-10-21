type MergePropertiesArgs = [
  string,
  Record<string, any>,
  Record<string, any>,
  Record<string, true>,
  Record<string, true>,
  Record<string, true>,
  string,
]
type ExpectedMergePropertiesOutput = any
export const mergePropertiesTable: [MergePropertiesArgs, ExpectedMergePropertiesOutput][] = [
  [
    [
      'source', // basePackageType
      {}, //base
      { ENABLE_CACHE: { type: 'string' } }, //additional
      {}, // collisionIgnoreList
      {}, // forceRenameList
      {}, //collisionPackageTypeList
      'collideMe', // collisionNamespace
    ],
    { ENABLE_CACHE: { type: 'string', originalKey: 'ENABLE_CACHE' } },
  ],
  [
    [
      'source', // basePackageType
      {}, //base
      { ENABLE_CACHE: { type: 'string' } }, //additional
      {}, // collisionIgnoreList
      {}, // forceRenameList
      {}, //collisionPackageTypeList
      'collideMe', // collisionNamespace
    ],
    { ENABLE_CACHE: { type: 'string', originalKey: 'ENABLE_CACHE' } },
  ],
  [
    [
      'source', // basePackageType
      { ENABLE_CACHE: { type: 'string' } }, //base
      { ENABLE_CACHE: { type: 'string' } }, //additional
      {}, // collisionIgnoreList
      {}, // forceRenameList
      {}, //collisionPackageTypeList
      'collideMe', // collisionNamespace
    ],
    {
      // there's no original key because the base properties aren't modified
      // this is fine though because we assume the original base properties start
      // with an empty object
      ENABLE_CACHE: { type: 'string' },
      COLLIDE_ME_ENABLE_CACHE: { type: 'string', originalKey: 'ENABLE_CACHE' },
    },
  ],
  [
    [
      'source', // basePackageType
      { ENABLE_CACHE: { type: 'string' } }, //base
      { ENABLE_CACHE: { type: 'string' } }, //additional
      { ENABLE_CACHE: true }, // collisionIgnoreList
      {}, // forceRenameList
      {}, //collisionPackageTypeList
      'collideMe', // collisionNamespace
    ],
    {
      ENABLE_CACHE: { type: 'string' },
    },
  ],
  [
    [
      'source', // basePackageType
      {}, //base
      { ENABLE_CACHE: { type: 'string' } }, //additional
      { ENABLE_CACHE: true }, // collisionIgnoreList
      { ENABLE_CACHE: true }, // forceRenameList
      {}, //collisionPackageTypeList
      'collideMe', // collisionNamespace
    ],
    {},
  ],
  [
    [
      'source', // basePackageType
      {}, //base
      { ENABLE_CACHE: { type: 'string' } }, //additional
      {}, // collisionIgnoreList
      {}, // forceRenameList
      { source: true }, //collisionPackageTypeList
      'collideMe', // collisionNamespace
    ],
    {
      ENABLE_CACHE: { type: 'string', originalKey: 'ENABLE_CACHE' },
    },
  ],

  [
    [
      'source', // basePackageType
      { ENABLE_CACHE: { type: 'string' } }, //base
      { ENABLE_CACHE: { type: 'string' } }, //additional
      {}, // collisionIgnoreList
      {}, // forceRenameList
      { source: true }, //collisionPackageTypeList
      'collideMe', // collisionNamespace
    ],
    {
      ENABLE_CACHE: { type: 'string' },
      COLLIDE_ME_ENABLE_CACHE: { type: 'string', originalKey: 'COLLIDE_ME_ENABLE_CACHE' },
    },
  ],

  [
    [
      'source', // basePackageType
      {}, //base
      { ENABLE_CACHE: { type: 'string' } }, //additional
      {}, // collisionIgnoreList
      { ENABLE_CACHE: true }, // forceRenameList
      {}, //collisionPackageTypeList
      '1forge', // collisionNamespace
    ],
    { ONEFORGE_ENABLE_CACHE: { type: 'string', originalKey: 'ENABLE_CACHE' } },
  ],
]
