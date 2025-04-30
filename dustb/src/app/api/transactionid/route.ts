import { NextResponse } from 'next/server';
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';

// Initialize Solana connection with environment variable
const connection = new Connection(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_RPC_API_KEY}`);

// Thresholds for dusting detection
const DUSTING_THRESHOLDS = {
  MIN_DUST_AMOUNT: 0.0001, // Maximum amount to be considered dust (in SOL)
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

interface TransactionAnalysis {
  isDustingTransaction: boolean;
  confidence: number;
  transaction: {
    signature: string;
    timestamp: number;
    amount: number;
    sender: string;
    receiver: string;
    type: 'SEND' | 'RECEIVE';
    assetType: 'SOL' | 'TOKEN';
  };
  senderSNS: SNSData | null;
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
  const transactionId = searchParams.get('address'); // Keeping the param name same for compatibility

  if (!transactionId) {
    return NextResponse.json(
      { error: 'Transaction ID is required' },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeTransaction(transactionId);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing transaction:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze transaction',
        message: 'Service temporarily unavailable contact @rrahulol on x for premium service',
        status: 'BUSY contact @rrahulol on x for premium service'
      },
      { status: 503 }
    );
  }
}

// Helper function to determine if a transaction involves token transfers
function isTokenTransaction(transaction: ParsedTransactionWithMeta): boolean {
  try {
    // Check if this is a token program transaction
    const instructions = transaction.transaction.message.instructions;
    const tokenProgramId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const associatedTokenProgramId = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
    
    // Check if any instruction involves the token programs
    for (const instruction of instructions) {
      if (instruction.programId && 
          (instruction.programId.equals(tokenProgramId) || 
           instruction.programId.equals(associatedTokenProgramId))) {
        return true;
      }
    }
    
    // Also check for parsed instructions that might indicate token transfers
    if (transaction.meta?.logMessages) {
      for (const log of transaction.meta.logMessages) {
        if (log.includes('spl-token') || 
            log.includes('Token') || 
            log.includes('transfer') || 
            log.includes('Transfer')) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if transaction involves tokens:', error);
    return false;
  }
}

async function analyzeTransaction(transactionId: string): Promise<TransactionAnalysis> {
  try {
    const transaction = await connection.getParsedTransaction(transactionId, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed'
    });
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const preBalance = transaction.meta?.preBalances?.[0];
    const postBalance = transaction.meta?.postBalances?.[0];
    
    if (preBalance === undefined || postBalance === undefined) {
      throw new Error('Invalid transaction data');
    }

    
    const sender = transaction.transaction.message.accountKeys[0]?.pubkey.toString();
    const receiver = transaction.transaction.message.accountKeys[1]?.pubkey.toString();
    const type = preBalance > postBalance ? 'SEND' : 'RECEIVE';
    
    // Determine if this is a token transaction
    const isToken = isTokenTransaction(transaction);
    const assetType = isToken ? 'TOKEN' : 'SOL';
    const amount = assetType === 'SOL' 
      ? Math.abs(preBalance - postBalance) / 1e9 
      :  0;

    const suspiciousPatterns: string[] = [];
    let confidence = 0;

    // Only consider SOL transfers for dust detection
    if (assetType === 'SOL' && amount < DUSTING_THRESHOLDS.MIN_DUST_AMOUNT) {
      confidence += 50;
      suspiciousPatterns.push(`Dust amount detected: ${amount} SOL`);
    } else if (assetType === 'TOKEN') {
      // For token transfers, we don't consider them dust
      console.log('Token transfer detected - not considered as dust');
    }

    // Check sender's SNS
    const senderSNS = await checkSNS(sender);
    if (senderSNS?.hasSuspiciousPattern) {
      confidence += 30;
      suspiciousPatterns.push(`Suspicious SNS name: ${senderSNS.name}`);
      if (senderSNS.containsEmojis) {
        suspiciousPatterns.push('SNS contains emojis');
      }
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    
    // If it's a token transfer, cap the risk level
    if (assetType === 'TOKEN') {
      // For tokens, we don't consider them dust attacks
      confidence = Math.min(confidence, 20); // Cap confidence for token transfers
      riskLevel = 'LOW'; // Always set token transfers to LOW risk
    } else {
      // For SOL transfers, use the regular risk assessment
      if (confidence >= 80) {
        riskLevel = 'CRITICAL';
      } else if (confidence >= 60) {
        riskLevel = 'HIGH';
      } else if (confidence >= 30) {
        riskLevel = 'MEDIUM';
      }
    }

    // Only mark as dusting if it's SOL and high risk
    const isDustingTransaction = assetType === 'SOL' && (riskLevel === 'HIGH' || riskLevel === 'CRITICAL');

    return {
      isDustingTransaction,
      confidence,
      transaction: {
        signature: transactionId,
        timestamp: transaction.blockTime || 0,
        amount,
        sender,
        receiver,
        type,
        assetType
      },
      senderSNS,
      suspiciousPatterns,
      riskLevel
    };
  } catch (error) {
    console.error('Error in analyzeTransaction:', error);
    throw error;
  }
}