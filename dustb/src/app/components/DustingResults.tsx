'use client'
import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Alert, AlertTitle } from '@mui/material';
import { Warning, CheckCircle, Error, TokenOutlined } from '@mui/icons-material';

// Combined type for both analysis types
interface DustingResultsProps {
  analysis: any; // Use any temporarily to handle both types
  analysisType: 'wallet' | 'transaction';
}

const RiskLevelChip: React.FC<{ level: string }> = ({ level }) => {
  const getColor = () => {
    switch (level) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const getIcon = () => {
    switch (level) {
      case 'LOW': return <CheckCircle />;
      case 'MEDIUM': return <Warning />;
      case 'HIGH':
      case 'CRITICAL': return <Error />;
      default: return null;
    }
  };

  const icon = getIcon();
  const color = getColor();

  return (
    <Chip
      icon={icon || undefined}
      label={level}
      color={color as any}
      sx={{ 
        fontWeight: 'bold',
        backgroundColor: level === 'LOW' ? '#4caf50' : 
                        level === 'MEDIUM' ? '#ff9800' : 
                        '#f44336',
        color: '#ffffff'
      }}
    />
  );
};

const DustingResults: React.FC<DustingResultsProps> = ({ analysis, analysisType }) => {
  // Render different components based on analysis type
  if (analysisType === 'wallet') {
    return <WalletAnalysisResults analysis={analysis} />;
  } else {
    return <TransactionAnalysisResults analysis={analysis} />;
  }
};

// Wallet analysis specific component
const WalletAnalysisResults: React.FC<{ analysis: any }> = ({ analysis }) => {
  const {
    isDustingWallet,
    metrics,
    suspiciousPatterns,
    riskLevel
  } = analysis;

  return (
    <Card sx={{ 
      maxWidth: 800, 
      mx: 'auto',
      backgroundColor: '#1e1e1e',
      color: '#ffffff'
    }}>
      <CardContent>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#ffffff' }}>
            Wallet Analysis Results
          </Typography>
          <RiskLevelChip level={riskLevel} />
        </Box>

        <Alert 
          severity={isDustingWallet ? 'error' : 'success'}
          sx={{ 
            mb: 3,
            backgroundColor: isDustingWallet ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)',
            color: '#ffffff'
          }}
        >
          <AlertTitle sx={{ color: '#ffffff' }}>
            {isDustingWallet ? '⚠️ Suspicious Activity Detected' : '✅ No Suspicious Activity Found'}
          </AlertTitle>
          <Typography sx={{ color: '#b0bec5' }}>
            {isDustingWallet 
              ? 'This wallet shows signs of potential dusting or address poisoning activity.'
              : 'No significant signs of dusting or address poisoning were detected.'}
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
            Transaction Metrics
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">TPS</Typography>
              <Typography variant="h6" sx={{ color: '#ffffff' }}>{metrics?.tps.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Dust Transactions</Typography>
              <Typography variant="h6" sx={{ color: '#ffffff' }}>{metrics?.dustTransactions}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Total Transactions</Typography>
              <Typography variant="h6" sx={{ color: '#ffffff' }}>{metrics?.totalTransactionsChecked}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Unique Recipients</Typography>
              <Typography variant="h6" sx={{ color: '#ffffff' }}>{metrics?.uniqueRecipients}</Typography>
            </Box>
          </Box>
        </Box>

        {metrics.suspiciousSNS && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
              Suspicious Domain
            </Typography>
            <Alert severity="warning" sx={{ backgroundColor: 'rgba(255, 152, 0, 0.1)' }}>
              <Typography variant="subtitle1" sx={{ color: '#ffffff' }}>{metrics.suspiciousSNS.name}</Typography>
              <Typography variant="body2" sx={{ color: '#b0bec5' }}>
                {metrics.suspiciousSNS.containsEmojis && '• Contains emojis\n'}
                {metrics.suspiciousSNS.hasSuspiciousPattern && '• Matches known suspicious patterns'}
              </Typography>
            </Alert>
          </Box>
        )}

        {suspiciousPatterns.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
              Suspicious Patterns Detected
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {suspiciousPatterns.map((pattern: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                <Chip
                  key={index}
                  label={pattern}
                  color="error"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    borderColor: '#f44336',
                    color: '#f44336',
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.1)'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Transaction analysis specific component
const TransactionAnalysisResults: React.FC<{ analysis: any }> = ({ analysis }) => {
  const {
    isDustingTransaction,
    confidence,
    transaction,
    senderSNS,
    suspiciousPatterns,
    riskLevel
  } = analysis;

  // Check if transaction has assetType field (from our updated backend)
  const assetType = transaction?.assetType || 'SOL';
  const isToken = assetType === 'TOKEN';

  return (
    <Card sx={{ 
      maxWidth: 800, 
      mx: 'auto',
      backgroundColor: '#1e1e1e',
      color: '#ffffff'
    }}>
      <CardContent>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#ffffff' }}>
            Transaction Analysis Results
          </Typography>
          <RiskLevelChip level={riskLevel} />
        </Box>

        <Alert 
          severity={isDustingTransaction ? 'error' : 'success'}
          sx={{ 
            mb: 3,
            backgroundColor: isDustingTransaction ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)',
            color: '#ffffff'
          }}
        >
          <AlertTitle sx={{ color: '#ffffff' }}>
            {isDustingTransaction ? '⚠️ Suspicious Transaction Detected' : '✅ No Suspicious Activity Found'}
          </AlertTitle>
          <Typography sx={{ color: '#b0bec5' }}>
            {isToken 
              ? 'This is a token transfer, not considered a dusting attack.'
              : isDustingTransaction 
                ? 'This transaction shows signs of potential dusting or address poisoning activity.'
                : 'No significant signs of dusting or address poisoning were detected.'}
          </Typography>
          <Typography sx={{ color: '#b0bec5', mt: 1 }}>
            Confidence: {confidence}%
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
            Transaction Details
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Transaction ID</Typography>
              <Typography variant="body2" sx={{ color: '#ffffff', wordBreak: 'break-all' }}>{transaction?.signature}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Timestamp</Typography>
              <Typography variant="body2" sx={{ color: '#ffffff' }}>
                {transaction?.timestamp ? new Date(transaction.timestamp * 1000).toLocaleString() : 'N/A'}
              </Typography>
            </Box>
            {/* <Box>
              <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
              <Typography variant="body2" sx={{ color: '#ffffff' }}>
                {transaction?.amount} {isToken ? 'Token Units' : 'SOL'}
              </Typography>
            </Box> */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Type</Typography>
              <Typography variant="body2" sx={{ color: '#ffffff' }}>
                {transaction?.type}
                {isToken && (
                  <Chip
                    icon={<TokenOutlined />}
                    label="TOKEN"
                    size="small"
                    sx={{ 
                      ml: 1,
                      backgroundColor: '#2196f3',
                      color: '#ffffff',
                      fontSize: '0.6rem'
                    }}
                  />
                )}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Asset Type</Typography>
              <Typography variant="body2" sx={{ color: '#ffffff' }}>
                {assetType || 'SOL'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Sender</Typography>
              <Typography variant="body2" sx={{ color: '#ffffff', wordBreak: 'break-all' }}>{transaction?.sender}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Receiver</Typography>
              <Typography variant="body2" sx={{ color: '#ffffff', wordBreak: 'break-all' }}>{transaction?.receiver}</Typography>
            </Box>
          </Box>
        </Box>

        {senderSNS && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
              Sender Domain
            </Typography>
            <Alert severity="info" sx={{ backgroundColor: 'rgba(33, 150, 243, 0.1)' }}>
              {/* Check if senderSNS is an object with a name property or a string */}
              <Typography variant="subtitle1" sx={{ color: '#ffffff' }}>
                {typeof senderSNS === 'object' && senderSNS !== null && 'name' in senderSNS 
                  ? senderSNS.name 
                  : String(senderSNS)}
              </Typography>
              {/* If it's an object with relevant properties, display them */}
              {typeof senderSNS === 'object' && senderSNS !== null && (
                <Typography variant="body2" sx={{ color: '#b0bec5' }}>
                  {senderSNS.containsEmojis && '• Contains emojis\n'}
                  {senderSNS.hasSuspiciousPattern && '• Matches known suspicious patterns'}
                </Typography>
              )}
            </Alert>
          </Box>
        )}

        {suspiciousPatterns.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
              Suspicious Patterns Detected
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {suspiciousPatterns.map((pattern: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                <Chip
                  key={index}
                  label={pattern}
                  color="error"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    borderColor: '#f44336',
                    color: '#f44336',
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.1)'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DustingResults;