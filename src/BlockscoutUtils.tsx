import axios from 'axios';

export interface TokenBalance {
  balance: string;
  contractAddress: string;
  decimals: string;
  name: string;
  symbol: string;
  type: string;
}

export async function getERC20Balances(address: string): Promise<TokenBalance[]> {
  try {
    const response = await axios.get(`https://explorer.kinto.xyz/api?module=account&action=tokenlist&address=${address}`);
    if (response.data.status === '1' && Array.isArray(response.data.result)) {
      console.log('ERC20 balances:', response.data.result);
      return response.data.result.filter((token: TokenBalance) => 
        token && token.type === 'ERC-20'
      );
  }
    return [];
  } catch (error) {
    console.error('Error fetching ERC20 balances:', error);
    return [];
  }
}

export function formatTokenBalance(balance: string, decimals: string): string {
  const value = parseInt(balance) / Math.pow(10, parseInt(decimals));
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}