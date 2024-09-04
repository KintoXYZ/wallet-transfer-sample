import { useEffect, useState } from 'react';
import { createKintoSDK, KintoAccountInfo } from 'kinto-web-sdk';
import {
  encodeFunctionData, Address
} from 'viem';
import styled from 'styled-components';
import AppHeader from 'components/shared/AppHeader';
import AppFooter from 'components/shared/AppFooter';
import {
  BaseScreen, PrimaryButton
} from 'components/shared';
import './App.css';
import { getERC20Balances, formatTokenBalance, TokenBalance } from './BlockscoutUtils';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
} from '@mui/material';
import {KYCViewerService, KYCViewerInfo} from './KYCViewerService';
import { getCountryFlagAndCode } from './utils/countryCodes';

const KYCInfoDisplay: React.FC<{ kycInfo: KYCViewerInfo; title: string }> = ({ kycInfo, title }) => (
  <KYCInfo>
    <KYCInfoHeader>{title}</KYCInfoHeader>
    <KYCInfoRow>
      <KYCInfoLabel>Is Individual:</KYCInfoLabel>
      <KYCInfoValue>{kycInfo.isIndividual ? 'Yes' : 'No'}</KYCInfoValue>
    </KYCInfoRow>
    <KYCInfoRow>
      <KYCInfoLabel>Is Corporate:</KYCInfoLabel>
      <KYCInfoValue>{kycInfo.isCorporate ? 'Yes' : 'No'}</KYCInfoValue>
    </KYCInfoRow>
    <KYCInfoRow>
      <KYCInfoLabel>Is KYC:</KYCInfoLabel>
      <KYCInfoValue>{kycInfo.isKYC ? 'Yes' : 'No'}</KYCInfoValue>
    </KYCInfoRow>
    <KYCInfoRow>
      <KYCInfoLabel>Is Sanctions Safe:</KYCInfoLabel>
      <KYCInfoValue>{kycInfo.isSanctionsSafe ? 'Yes' : 'No'}</KYCInfoValue>
    </KYCInfoRow>
    <KYCInfoRow>
      <KYCInfoLabel>Country:</KYCInfoLabel>
      <KYCInfoValue>{getCountryFlagAndCode(kycInfo.getCountry)}</KYCInfoValue>
    </KYCInfoRow>
  </KYCInfo>
);

const KintoConnect = () => {
  const [accountInfo, setAccountInfo] = useState<KintoAccountInfo | undefined>(undefined);
  const [kycViewerInfo, setKYCViewerInfo] = useState<KYCViewerInfo | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [destinationKYCInfo, setDestinationKYCInfo] = useState<KYCViewerInfo | null>(null);
  const [destinationKYCError, setDestinationKYCError] = useState<string | null>(null);
  const kintoSDK = createKintoSDK('0x14A1EC9b43c270a61cDD89B6CbdD985935D897fE');

  async function kintoLogin() {
    try {
      await kintoSDK.createNewWallet();
    } catch (error) {
      console.error('Failed to login/signup:', error);
    }
  }

  async function fetchKYCViewerInfo() {
    if (!accountInfo?.walletAddress) return;

    const kycViewer = KYCViewerService.getInstance();
    const info = await kycViewer.fetchKYCInfo(accountInfo.walletAddress as Address);
    if(typeof info !== 'string') {
      setKYCViewerInfo(info);
    } else {
      setKYCViewerInfo(null);
    }
  }

  async function fetchAccountInfo() {
    try {
      setAccountInfo(await kintoSDK.connect());
    } catch (error) {
      console.error('Failed to fetch account info:', error);
    }
  };

  async function fetchTokenBalances() {
    if (accountInfo?.walletAddress) {
      const balances = await getERC20Balances(accountInfo.walletAddress);
      console.log('Token balances:', balances);

      //array of all erc20 addresses:
      const erc20Addresses = balances.map(token => token.contractAddress);
      console.log('ERC20 Addresses:', erc20Addresses);

      //TODO: better to fetch balances from the contract
      setTokenBalances(balances);
    }
  }

  const handleTransfer = async () => {
    console.log('Attempting transfer');
    if (!selectedToken || !recipientAddress || !transferAmount || !accountInfo?.walletAddress) {
      console.log('Transfer cancelled: missing information');
      return;
    }

    try {
      const amount = BigInt(parseFloat(transferAmount) * Math.pow(10, parseInt(selectedToken.decimals)));
      const data = encodeFunctionData({
        abi: [{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}],
        functionName: 'transfer',
        args: [recipientAddress as Address, amount]
      });

      console.log('Sending transaction');
      const response = await kintoSDK.sendTransaction([{ 
        to: selectedToken.contractAddress as Address, 
        data, 
        value: BigInt(0) 
      }]);

      console.log('Transfer response:', response);
      // Refresh token balances after transfer
      await fetchTokenBalances();
      
      // Clear input fields after successful transfer
      setTransferAmount('');
      setRecipientAddress('');
      setSelectedToken(null);
    } catch (error) {
      console.error('Failed to transfer token:', error);
    }
  };

  const fetchDestinationKYC = async () => {
    if (!recipientAddress) return;

    const kycViewer = KYCViewerService.getInstance();
    const info = await kycViewer.fetchKYCInfo(recipientAddress as Address);
    if (typeof info === 'string') {
      setDestinationKYCError(info);
    } else {
      setDestinationKYCInfo(info);
    }
  };

  useEffect(() => {
    fetchAccountInfo();
  });

  useEffect(() => {
    if (accountInfo?.walletAddress) {
      fetchKYCViewerInfo();
      fetchTokenBalances();
    }
  }, [accountInfo]);

  useEffect(() => {
    if (recipientAddress && recipientAddress.length === 42) {
      fetchDestinationKYC();
    } else {
      setDestinationKYCInfo(null);
    }
  }, [recipientAddress]);

  return (
    <WholeWrapper>
      <AppWrapper>
        <ContentWrapper>
          <AppHeader />
          <BaseScreen>
            {accountInfo ? (
              <ThreeColumnLayout>
                <Column>
                  <ColumnContent>
                    <ColumnHeader>Your Wallet</ColumnHeader>
                    <WalletInfo>
                      <WalletInfoRow>
                        <WalletInfoLabel>Address:</WalletInfoLabel>
                        <StyledCompressedAddress address={accountInfo.walletAddress as Address} />
                      </WalletInfoRow>
                      <WalletInfoRow>
                        <WalletInfoLabel>App Key:</WalletInfoLabel>
                        <StyledCompressedAddress address={accountInfo.appKey as Address} />
                      </WalletInfoRow>
                    </WalletInfo>
                  </ColumnContent>
                  <KYCInfoWrapper>
                    {kycViewerInfo && (
                      <KYCInfoDisplay kycInfo={kycViewerInfo} title="Your KYC Information" />
                    )}
                  </KYCInfoWrapper>
                </Column>

                <ArrowColumn>
                  <ArrowIcon>➡️</ArrowIcon>
                </ArrowColumn>

                <Column>
                  <ColumnContent>
                    <ColumnHeader>Destination</ColumnHeader>
                    <DestinationSection>
                      <TextField
                        fullWidth
                        label="Recipient Address"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                      />
                    </DestinationSection>
                  </ColumnContent>
                  <KYCInfoWrapper>
                    {destinationKYCInfo && !destinationKYCError && (
                      <KYCInfoDisplay kycInfo={destinationKYCInfo} title="Destination KYC Information" />
                    )}
                    {destinationKYCError && (
                      <Alert severity="error">{destinationKYCError}</Alert>
                    )}
                  </KYCInfoWrapper>
                </Column>

                <ArrowColumn>
                  <ArrowIcon>➡️</ArrowIcon>
                </ArrowColumn>

                <Column>
                  <ColumnHeader>Transfer</ColumnHeader>
                  <TransferSection>
                    <FormControl fullWidth>
                      <InputLabel id="token-select-label">Select Token</InputLabel>
                      <Select
                        labelId="token-select-label"
                        id="token-select"
                        value={selectedToken ? selectedToken.symbol : ''}
                        label="Select Token"
                        onChange={(e) => {
                          const token = tokenBalances.find(t => t.symbol === e.target.value);
                          setSelectedToken(token || null);
                        }}
                      >
                        {tokenBalances.map((token, index) => (
                          <MenuItem key={`erc20-${index}`} value={token.symbol}>
                            {token.symbol} - Balance: {formatTokenBalance(token.balance, token.decimals)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Amount to Transfer"
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                    />
                    <PrimaryButton onClick={handleTransfer} disabled={!selectedToken || !transferAmount || !recipientAddress}>
                      Transfer
                    </PrimaryButton>
                  </TransferSection>
                </Column>
              </ThreeColumnLayout>
            ) : (
              <ConnectButton onClick={kintoLogin}>Connect Wallet</ConnectButton>
            )}
          </BaseScreen>
          <AppFooter />
        </ContentWrapper>
      </AppWrapper>
    </WholeWrapper>
  );
}

const WholeWrapper = styled.div`
  flex-flow: column nowrap;
  height: auto;
  align-items: center;
  width: 100%;
  display: flex;
  min-height: 100vh;
  min-width: 100vw;
  position: relative;
`;

const AppWrapper = styled.div`
  flex-flow: column nowrap;
  height: auto;
  align-items: center;
  width: 100%;
  display: flex;
  min-height: 85vh;
  min-width: 100vw;

  @media only screen and (max-width: 400px) {
    min-height: 90vh;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;
  height: auto;
  min-height: 100vh;
  width: 100%;
  background: url(engen/commitment.svg) no-repeat;
  background-position-x: right;
  background-size: auto;
  overflow: hidden;
`;

const ThreeColumnLayout = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 20px;
`;

const Column = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ColumnContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
`;

const ColumnHeader = styled.h2`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const WalletInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const WalletInfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const WalletInfoLabel = styled.span`
  font-weight: bold;
`;

const TransferSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const DestinationSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const KYCInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

const KYCInfoHeader = styled.h3`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const KYCInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const KYCInfoLabel = styled.span`
  font-weight: bold;
  flex: 1;
`;

const KYCInfoValue = styled.span`
  flex: 1;
  text-align: right;

  & > span {
    margin-right: 5px;
  }
`;

const ConnectButton = styled(PrimaryButton)`
  align-self: center;
`;

interface CompressedAddressProps {
  address: Address;
  className?: string;
}

const CompressedAddress: React.FC<CompressedAddressProps> = ({ address, className }) => (
  <div className={className}>
    {address.slice(0, 10)}...{address.slice(-10)}
  </div>
);

const StyledCompressedAddress = styled(CompressedAddress)`
  font-family: monospace;
  font-size: 14px;
`;

const ArrowColumn = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ArrowIcon = styled.span`
  font-size: 24px;
  color: var(--primary-color);
`;

const KYCInfoWrapper = styled.div`
  margin-top: auto;
`;

function App() {
  return (
    <div className="App">
      <KintoConnect />
    </div>
  );
}

export default App;
