import { createPublicClient, http, getContract, Address } from 'viem';
import contractsJSON from '../public/abis/7887.json';
import { kinto } from './chains';

export interface KYCViewerInfo {
  isIndividual: boolean;
  isCorporate: boolean;
  isKYC: boolean;
  isSanctionsSafe: boolean;
  getCountry: string;
  getWalletOwners: Address[];
}

export class KYCViewerService {
  private static instance: KYCViewerService;
  private contract: any;

  private constructor() {
    const client = createPublicClient({
      chain: kinto,
      transport: http(),
    });

    this.contract = getContract({
      address: contractsJSON.contracts.KYCViewer.address as Address,
      abi: contractsJSON.contracts.KYCViewer.abi,
      client: { public: client }
    });
  }

  public static getInstance(): KYCViewerService {
    if (!KYCViewerService.instance) {
      KYCViewerService.instance = new KYCViewerService();
    }
    return KYCViewerService.instance;
  }

  public getContract() {
    return this.contract;
  }

  public async fetchKYCInfo(address: Address): Promise<KYCViewerInfo | null> {
    try {
      const [isIndividual, isCorporate, isKYC, isSanctionsSafe, getCountry, getWalletOwners] = await Promise.all([
        this.contract.read.isIndividual([address]),
        this.contract.read.isCompany([address]),
        this.contract.read.isKYC([address]),
        this.contract.read.isSanctionsSafe([address]),
        this.contract.read.getCountry([address]),
        this.contract.read.getWalletOwners([address])
      ]);

      return {
        isIndividual,
        isCorporate,
        isKYC,
        isSanctionsSafe,
        getCountry,
        getWalletOwners
      };
    } catch (error) {
      console.error('Failed to fetch KYC viewer info:', error);
      return null;
    }
  }
}