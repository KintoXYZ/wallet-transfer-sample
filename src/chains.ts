import { Chain } from 'viem'

export const kinto: Chain = {
  id: 7887,
  name: 'Kinto',
  nativeCurrency: {
    decimals: 18,
    name: 'Kinto',
    symbol: 'KINTO',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.kinto-rpc.com'],
    },
    public: {
      http: ['https://rpc.kinto-rpc.com'],
    },
  },
  blockExplorers: {
    default: { name: 'KintoExplorer', url: 'https://explorer.kinto.xyz' },
  },
}