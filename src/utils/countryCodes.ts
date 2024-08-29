import countries from 'i18n-iso-countries';

// Load the English language data
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

export const convertNumericToAlpha2 = (numericCode: string): string => {
  return countries.numericToAlpha2(numericCode) || 'Unknown';
};

export const countryCodeToFlag = (numericCode: string): string => {
  const alpha2Code = convertNumericToAlpha2(numericCode);
  if (alpha2Code === 'Unknown') return '🏳️';
  
  const codePoints = alpha2Code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const getCountryFlagAndCode = (numericCode: string): string => {
  const alpha2Code = convertNumericToAlpha2(numericCode);
  const flag = countryCodeToFlag(numericCode);
  return `${flag} ${alpha2Code}`;
};