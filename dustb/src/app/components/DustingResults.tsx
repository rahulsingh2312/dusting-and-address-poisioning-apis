import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Alert, AlertTitle } from '@mui/material';
import { Warning, CheckCircle, Error } from '@mui/icons-material';

interface DustingResultsProps {
  analysis: {
    isDustingWallet: boolean;
    metrics: {
      tps: number;
      dustTransactions: number;
      totalTransactionsChecked: number;
      uniqueRecipients: number;
      averageDustAmount: number;
      suspiciousSNS: {
        name: string;
        hasSuspiciousPattern: boolean;
        containsEmojis: boolean;
      } | null;
    };
    suspiciousPatterns: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
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

const DustingResults: React.FC<DustingResultsProps> = ({ analysis }) => {
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
      mt: 4, 
      boxShadow: 3,
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
              {suspiciousPatterns.map((pattern, index) => (
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