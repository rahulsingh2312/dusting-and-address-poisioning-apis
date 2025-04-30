'use client';

import { useState } from 'react';

interface SafeTransaction {
  signature: string;
  timestamp: number;
  amount: number;
  from: string;
  to: string;
  type: 'SEND' | 'RECEIVE';
}

interface ApiResponse {
  safeTransactions: SafeTransaction[];
  totalTransactions: number;
  safeTransactionsCount: number;
  filteredTransactionsCount: number;
}

export default function SpamScamSafe() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/spamscamsafe?address=${address}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch transactions');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Spam & Scam Safe Transactions</h1>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Solana wallet address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Check Transactions'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="p-4 bg-white border rounded-lg shadow">
            <h2 className="text-xl font-bold mb-2">Transaction Summary</h2>
            <p>Total Transactions: {data.totalTransactions}</p>
            <p>Safe Transactions: {data.safeTransactionsCount}</p>
            <p>Filtered Transactions: {data.filteredTransactionsCount}</p>
          </div>

          <div className="p-4 bg-white border rounded-lg shadow">
            <h2 className="text-xl font-bold mb-2">Safe Transactions</h2>
            <div className="space-y-2">
              {data.safeTransactions.map((tx) => (
                <div key={tx.signature} className="p-4 border rounded-lg">
                  <p className="font-semibold">Type: {tx.type}</p>
                  <p>Amount: {tx.amount} SOL</p>
                  <p>From: {tx.from}</p>
                  <p>To: {tx.to}</p>
                  <p>Time: {new Date(tx.timestamp * 1000).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">
                    Signature: {tx.signature}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 