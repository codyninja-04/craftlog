// Currencies people can pick for material costs. Amounts are stored as plain
// numbers, so changing this only changes how they're shown.
export const CURRENCIES = [
  { code: 'USD', label: 'US dollar' },
  { code: 'SGD', label: 'Singapore dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British pound' },
  { code: 'AUD', label: 'Australian dollar' },
  { code: 'CAD', label: 'Canadian dollar' },
  { code: 'NZD', label: 'New Zealand dollar' },
  { code: 'MYR', label: 'Malaysian ringgit' },
  { code: 'INR', label: 'Indian rupee' },
  { code: 'JPY', label: 'Japanese yen' },
] as const
