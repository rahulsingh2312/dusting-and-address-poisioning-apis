import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize Solana connection
const connection = new Connection(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_RPC_API_KEY}`);

// Thresholds for filtering
const FILTER_THRESHOLDS = {
  MIN_TRANSACTION_AMOUNT: 0.0001, // Minimum amount to be considered a real transaction (in SOL)
  MIN_TRANSACTIONS_CHECKED: 10,   // Number of transactions to check
  ADDRESS_SIMILARITY_THRESHOLD: 0.8 // Threshold for address similarity (0-1)
};

// Function to calculate string similarity
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const maxLen = Math.max(len1, len2);
  return 1 - matrix[len1][len2] / maxLen;
}

// Function to check for address poisoning
function isAddressPoisoning(address: string, previousAddresses: string[]): boolean {
  return previousAddresses.some(prevAddr => 
    calculateSimilarity(address, prevAddr) > FILTER_THRESHOLDS.ADDRESS_SIMILARITY_THRESHOLD
  );
}

// Function to check if transaction is dust
function isDustTransaction(amount: number): boolean {
  return amount < FILTER_THRESHOLDS.MIN_TRANSACTION_AMOUNT;
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
    const publicKey = new PublicKey(walletAddress);
    const signatures = await connection.getSignaturesForAddress(publicKey, { 
      limit: FILTER_THRESHOLDS.MIN_TRANSACTIONS_CHECKED 
    });

    const transactions = await Promise.all(
      signatures.map(sig => 
        connection.getTransaction(sig.signature)
          .catch(() => null)
      )
    ).then(txs => txs.filter(Boolean));

    // Track addresses to check for poisoning
    const seenAddresses: string[] = [];
    const safeTransactions = transactions.filter(tx => {
      if (!tx) return false;

      const preBalance = tx.meta?.preBalances?.[0];
      const postBalance = tx.meta?.postBalances?.[0];
      if (preBalance === undefined || postBalance === undefined) return false;

      const amount = Math.abs(preBalance - postBalance) / 1e9;
      const isDust = isDustTransaction(amount);

      // Get the other party's address
      const otherPartyAddress = tx.transaction.message.accountKeys[1]?.toString();
      if (!otherPartyAddress) return false;

      // Check for address poisoning
      const isPoisoning = isAddressPoisoning(otherPartyAddress, seenAddresses);
      seenAddresses.push(otherPartyAddress);

      // Keep transaction if it's not dust and not address poisoning
      return !isDust && !isPoisoning;
    });

    return NextResponse.json({
      safeTransactions: safeTransactions.map(tx => ({
        signature: tx?.transaction.signatures[0],
        timestamp: tx?.blockTime,
        amount: Math.abs((tx?.meta?.preBalances[0] || 0) - (tx?.meta?.postBalances[0] || 0)) / 1e9,
        from: tx?.transaction.message.accountKeys[0]?.toString(),
        to: tx?.transaction.message.accountKeys[1]?.toString(),
        type: (tx?.meta?.preBalances?.[0] ?? 0) > (tx?.meta?.postBalances?.[0] ?? 0) ? 'SEND' : 'RECEIVE'
      })),
      totalTransactions: transactions.length,
      safeTransactionsCount: safeTransactions.length,
      filteredTransactionsCount: transactions.length - safeTransactions.length
    });
  } catch (error) {
    console.error('Error analyzing transactions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze transactions',
        message: 'Service temporarily unavailable',
        status: 'BUSY'
      },
      { status: 503 }
    );
  }
} 