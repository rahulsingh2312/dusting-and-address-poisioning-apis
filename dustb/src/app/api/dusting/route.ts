import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize Solana connection with environment variable
const connection = new Connection(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_RPC_API_KEY}`);

// Stricter thresholds for dusting detection
const DUSTING_THRESHOLDS = {
  MIN_TPS: 5, // Minimum transactions per second to be considered suspicious
  MIN_DUST_TRANSACTIONS: 9, // Minimum number of dust transactions
  MIN_DUST_AMOUNT: 0.0001, // Maximum amount to be considered dust (in SOL)
  MIN_UNIQUE_RECIPIENTS: 9, // Minimum number of unique recipients
  MIN_TRANSACTIONS_CHECKED: 10, // Minimum number of transactions to analyze
};

// Known dusting patterns in SNS names
const KNOWN_DUSTING_SNS_PATTERNS = [
  // Gambling/Casino related
  'flip.gg', 'casino', 'bet', 'gambling', 'slot', 'poker', 'roulette', 'jackpot', 'win',
  'lucky', 'fortune', 'chance', 'dice', 'card', 'game', 'play', 'spin', 'roll',
  
  // Airdrop/Free token related
  'airdrop', 'free', 'claim', 'bonus', 'reward', 'giveaway', 'gift', 'prize', 'token',
  'drop', 'distribution', 'whitelist', 'presale', 'ico', 'ido', 'launch', 'mint',
  
  // Scam indicators
  'verify', 'validation', 'confirm', 'secure', 'wallet', 'connect', 'sign', 'approve',
  'update', 'upgrade', 'maintenance', 'support', 'help', 'assist', 'recover', 'restore',
  
  // Urgency/Time pressure
  'hurry', 'limited', 'expire', 'ending', 'last', 'final', 'urgent', 'immediate',
  'now', 'today', 'tonight', 'soon', 'quick', 'fast', 'instant', 'rush',
  
  // Financial incentives
  'profit', 'earn', 'income', 'revenue', 'dividend', 'interest', 'yield', 'return',
  'investment', 'trading', 'market', 'price', 'value', 'worth', 'rich', 'wealth',
  
  // Suspicious actions
  'click', 'tap', 'press', 'enter', 'submit', 'send', 'transfer', 'move', 'swap',
  'exchange', 'convert', 'bridge', 'cross', 'migrate', 'import', 'export',
  
  // Common scam domains
  'eth', 'ethereum', 'btc', 'bitcoin', 'crypto', 'defi', 'nft',
  'blockchain', 'wallet', 'exchange', 'market', 'trading', 'finance'
];

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]/u;

interface SNSData {
  name: string;
  hasSuspiciousPattern: boolean;
  containsEmojis: boolean;
}

interface DustingAnalysis {
  isDustingWallet: boolean;
  confidence: number;
  metrics: {
    tps: number;
    dustTransactions: number;
    totalTransactionsChecked: number;
    uniqueRecipients: number;
    averageDustAmount: number;
    suspiciousSNS: SNSData | null;
  };
  suspiciousPatterns: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

async function checkSNS(walletAddress: string): Promise<SNSData | null> {
  try {
    console.log(`\nChecking SNS for wallet: ${walletAddress}`);
    
    const response = await fetch(
      `https://socials.solana.fm/search?searchQuery=${walletAddress}&network=Mainnet`,
      {
        headers: {
          'accept': 'application/json',
          'origin': 'https://solana.fm',
          'referer': 'https://solana.fm/',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
        }
      }
    );

    if (!response?.ok) {
      console.error('Failed to fetch domains from Solana.fm:', response?.statusText);
      return null;
    }

    const data = await response.json();
    console.log('Solana.fm API response:', JSON.stringify(data, null, 2));

    const domains = data?.labelSearch
      ?.filter((item: any) => item?.document?.entityType === 'Domains')
      .map((item: any) => item?.document?.name)
      .filter(Boolean) || [];

    console.log(`Found ${domains?.length} domains`);
    domains?.forEach((domain: string, index: number) => {
      console.log(`${index + 1}. ${domain}`);
    });

    if (!domains?.length) {
      console.log('No domains found for this wallet');
      return null;
    }

    const suspiciousDomains = domains.filter((domain: string) => {
      const name = domain?.toLowerCase();
      const isSuspicious = KNOWN_DUSTING_SNS_PATTERNS.some(pattern => 
        name?.includes(pattern.toLowerCase())
      ) || EMOJI_REGEX.test(domain);
      
      if (isSuspicious) {
        console.log(`\nSuspicious domain detected: ${domain}`);
        if (EMOJI_REGEX.test(domain)) console.log('Contains emojis');
        if (KNOWN_DUSTING_SNS_PATTERNS.some(pattern => name?.includes(pattern.toLowerCase()))) {
          console.log('Contains suspicious keywords');
        }
      }
      
      return isSuspicious;
    });

    if (!suspiciousDomains?.length) {
      console.log('\nNo suspicious domains found');
      return null;
    }

    const domain = suspiciousDomains[0];
    const name = domain?.toLowerCase();
    const hasSuspiciousPattern = KNOWN_DUSTING_SNS_PATTERNS.some(pattern => 
      name?.includes(pattern.toLowerCase())
    );
    const containsEmojis = EMOJI_REGEX.test(domain);
    
    console.log(`\nSelected suspicious domain for analysis: ${domain}`);
    
    return {
      name: domain,
      hasSuspiciousPattern,
      containsEmojis
    };
  } catch (error) {
    console.error('Error checking SNS:', error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('address');

  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeWallet(walletAddress);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing wallet:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze wallet',
        message: 'Service temporarily unavailable contact @rrahulol on x for premium service',
        status: 'BUSY contact @rrahulol on x for premium service'
      },
      { status: 503 }
    );
  }
}

async function analyzeWallet(walletAddress: string): Promise<DustingAnalysis> {
  try {
    const publicKey = new PublicKey(walletAddress);
    const suspiciousPatterns: string[] = [];
    let confidence = 0;
    
    const snsData = await checkSNS(walletAddress);
    if (snsData?.hasSuspiciousPattern) {
      confidence += 30;
      suspiciousPatterns.push(`Suspicious SNS name: ${snsData?.name}`);
      if (snsData?.containsEmojis) {
        suspiciousPatterns.push('SNS contains emojis');
      }
    }

    const signatures = await connection.getSignaturesForAddress(publicKey, { 
      limit: DUSTING_THRESHOLDS.MIN_TRANSACTIONS_CHECKED 
    }).catch(() => []);

    if (!signatures?.length || signatures.length < DUSTING_THRESHOLDS.MIN_TRANSACTIONS_CHECKED) {
      return {
        isDustingWallet: false,
        confidence: 0,
        metrics: {
          tps: 0,
          dustTransactions: 0,
          totalTransactionsChecked: signatures?.length || 0,
          uniqueRecipients: 0,
          averageDustAmount: 0,
          suspiciousSNS: snsData
        },
        suspiciousPatterns,
        riskLevel: 'LOW'
      };
    }

    const transactions = await Promise.all(
      signatures.map(sig => 
        connection.getTransaction(sig?.signature)
          .catch(() => null)
      )
    ).then(txs => txs.filter(Boolean));

    const firstBlockTime = signatures?.[0]?.blockTime;
    const lastBlockTime = signatures?.[signatures.length - 1]?.blockTime;
    const timeSpan = firstBlockTime && lastBlockTime
      ? (firstBlockTime - lastBlockTime) / 1000
      : 0;
    const tps = timeSpan > 0 ? transactions.length / timeSpan : 0;

    const dustTransactions = transactions.filter(tx => {
      const preBalance = tx?.meta?.preBalances?.[0];
      const postBalance = tx?.meta?.postBalances?.[0];
      if (preBalance === undefined || postBalance === undefined) return false;
      const amount = (preBalance - postBalance) / 1e9;
      return amount < DUSTING_THRESHOLDS.MIN_DUST_AMOUNT;
    }).length;

    const uniqueRecipients = new Set(
      transactions
        .filter(tx => tx?.transaction?.message?.instructions?.[0]?.programIdIndex === 0)
        .map(tx => tx?.transaction?.message?.accountKeys?.[1]?.toString())
        .filter(Boolean)
    ).size;

    const dustAmounts = transactions
      .map(tx => {
        const preBalance = tx?.meta?.preBalances?.[0];
        const postBalance = tx?.meta?.postBalances?.[0];
        if (preBalance === undefined || postBalance === undefined) return null;
        return (preBalance - postBalance) / 1e9;
      })
      .filter((amount): amount is number => 
        amount !== null && amount < DUSTING_THRESHOLDS.MIN_DUST_AMOUNT
      );
    
    const averageDustAmount = dustAmounts.length > 0
      ? dustAmounts.reduce((a, b) => a + b, 0) / dustAmounts.length
      : 0;

    if (tps > DUSTING_THRESHOLDS.MIN_TPS) {
      confidence += 40;
      suspiciousPatterns.push(`High TPS detected: ${tps.toFixed(2)}`);
    }
    if (dustTransactions > DUSTING_THRESHOLDS.MIN_DUST_TRANSACTIONS) {
      confidence += 20;
      suspiciousPatterns.push(`High number of dust transactions: ${dustTransactions}/${transactions.length}`);
    }
    if (uniqueRecipients > DUSTING_THRESHOLDS.MIN_UNIQUE_RECIPIENTS) {
      confidence += 10;
      suspiciousPatterns.push(`High number of unique recipients: ${uniqueRecipients}`);
    }

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (confidence >= 80 && tps > DUSTING_THRESHOLDS.MIN_TPS && dustTransactions > DUSTING_THRESHOLDS.MIN_DUST_TRANSACTIONS) {
      riskLevel = 'CRITICAL';
    } else if (confidence >= 60 && (tps > DUSTING_THRESHOLDS.MIN_TPS || dustTransactions > DUSTING_THRESHOLDS.MIN_DUST_TRANSACTIONS)) {
      riskLevel = 'HIGH';
    } else if (confidence >= 30 && (tps > DUSTING_THRESHOLDS.MIN_TPS || dustTransactions > DUSTING_THRESHOLDS.MIN_DUST_TRANSACTIONS)) {
      riskLevel = 'MEDIUM';
    }

    const isDustingWallet = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';

    return {
      isDustingWallet,
      confidence,
      metrics: {
        tps,
        dustTransactions,
        totalTransactionsChecked: transactions.length,
        uniqueRecipients,
        averageDustAmount,
        suspiciousSNS: snsData
      },
      suspiciousPatterns,
      riskLevel
    };
  } catch (error) {
    console.error('Error in analyzeWallet:', error);
    throw error;
  }
} 