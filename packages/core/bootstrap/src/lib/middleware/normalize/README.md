## Input Parameter Normalizing middleware

Changes input parameters keys to a standard alias.

e.g. given the following input parameter definition

```javascript
export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    required: true,
    type: 'string',
  },
}
```

Incoming `from` or `coin` keys would be renamed to `base`.
