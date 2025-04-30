# Solana Dusting Detection API

A robust API for detecting dusting attacks and address poisoning on Solana wallets. This API analyzes wallet transactions and SNS (Solana Name Service) data to identify suspicious patterns associated with dusting attacks.

## Features

- Transaction pattern analysis
- SNS (Solana Name Service) monitoring
- Emoji detection in domain names
- TPS (Transactions Per Second) monitoring
- Dust transaction detection
- Unique recipient tracking
- Risk level assessment

## API Endpoints

### GET /api/dusting

Analyzes a wallet address for dusting patterns.

**Query Parameters:**
- `address`: Solana wallet address to analyze

**Response:**
```json
{
  "isDustingWallet": boolean,
  "confidence": number,
  "metrics": {
    "tps": number,
    "dustTransactions": number,
    "totalTransactionsChecked": number,
    "uniqueRecipients": number,
    "averageDustAmount": number,
    "suspiciousSNS": {
      "name": string,
      "hasSuspiciousPattern": boolean,
      "containsEmojis": boolean
    }
  },
  "suspiciousPatterns": string[],
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}
```

### GET /api/transactionid

Analyzes a specific transaction for dusting patterns.

**Query Parameters:**
- `address`: Transaction ID to analyze

**Response:**
```json
{
  "isDustingTransaction": boolean,
  "confidence": number,
  "transaction": {
    "signature": string,
    "timestamp": number,
    "amount": number,
    "sender": string,
    "receiver": string,
    "type": "SEND" | "RECEIVE",
    "assetType": "SOL" | "TOKEN"
  },
  "senderSNS": {
    "name": string,
    "hasSuspiciousPattern": boolean,
    "containsEmojis": boolean
  } | null,
  "suspiciousPatterns": string[],
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}
```

## Detection Methods

### 1. Transaction Analysis
- Checks last 10 transactions
- Calculates TPS (Transactions Per Second)
- Identifies dust transactions (amount < 0.0001 SOL)
- Tracks unique recipients

### 2. SNS (Solana Name Service) Monitoring
- Fetches domains associated with the wallet
- Checks for suspicious patterns in domain names
- Detects emojis in domain names
- Monitors for known dusting-related keywords

### 3. Risk Assessment
- Combines multiple factors to determine risk level
- Assigns confidence scores based on detected patterns
- Categorizes risk as LOW, MEDIUM, HIGH, or CRITICAL

## RPC Usage

The API makes the following RPC calls:
1. `getSignaturesForAddress`: Fetches recent transaction signatures
2. `getTransaction`: Retrieves transaction details for each signature
3. SNS API call to Solana.fm for domain information

Total RPC calls per request: 2 + (number of transactions checked)

## Detection Thresholds

```typescript
const DUSTING_THRESHOLDS = {
  MIN_TPS: 5,                    // Minimum TPS to be considered suspicious
  MIN_DUST_TRANSACTIONS: 9,      // Minimum number of dust transactions
  MIN_DUST_AMOUNT: 0.0001,       // Maximum amount to be considered dust (in SOL)
  MIN_UNIQUE_RECIPIENTS: 9,      // Minimum number of unique recipients
  MIN_TRANSACTIONS_CHECKED: 10   // Minimum number of transactions to analyze
};
```

## Suspicious Pattern Detection

### SNS Patterns
- Gambling/Casino related keywords
- Airdrop/Free token related keywords
- Scam indicators
- Urgency/Time pressure keywords
- Financial incentives
- Suspicious actions
- Common scam domains

### Transaction Patterns
- High TPS (> 5 transactions/second)
- Multiple dust transactions (> 9)
- Multiple unique recipients (> 9)
- Small transaction amounts (< 0.0001 SOL)

## Risk Level Calculation

- **CRITICAL**: Confidence ≥ 80, High TPS, Multiple dust transactions
- **HIGH**: Confidence ≥ 60, High TPS or Multiple dust transactions
- **MEDIUM**: Confidence ≥ 30, High TPS or Multiple dust transactions
- **LOW**: Default level, no significant suspicious patterns

## Error Handling

The API includes comprehensive error handling:
- Optional chaining for all object properties
- Null checks with default values
- Try-catch blocks with error logging
- "BUSY" status for service unavailability

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per minute per IP
- Returns 429 status with "BUSY" message when limit exceeded

## Environment Variables

Required environment variables:
```
HELIUS_RPC_API_KEY=your_api_key_here
```

## Contributing

Feel free to submit issues and enhancement requests!
