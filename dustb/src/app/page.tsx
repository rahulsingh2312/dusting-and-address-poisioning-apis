'use client';

import { useState } from 'react';
import { Container, TextField, Button, Box, Typography, CircularProgress, Paper, Divider, Alert, Snackbar, RadioGroup, FormControlLabel, Radio, FormControl } from '@mui/material';
import { PlayArrow, ContentCopy, Twitter, Link as LinkIcon, Search } from '@mui/icons-material';
import DustingResults from './components/DustingResults';

export default function Home() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [showInput, setShowInput] = useState(true);
  const [analysisType, setAnalysisType] = useState<'wallet' | 'transaction'>('wallet');

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);
    setShowInput(false);
    
    const analysisTypeText = analysisType === 'wallet' ? 'wallet address' : 'transaction ID';
    setToast({ open: true, message: `Analyzing ${analysisTypeText}...`, type: 'success' });

    try {
      // Use different API endpoint based on analysis type
      const endpoint = analysisType === 'wallet' 
        ? `/api/dusting?address=${address}`
        : `/api/transactionid?address=${address}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to analyze ${analysisTypeText}, please try again or contact @rrahulol on x for premium service`);
      }
      const data = await response.json();
      setResults(data);
      setToast({ open: true, message: 'Analysis complete!', type: 'success' });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        setToast({ open: true, message: err.message, type: 'error' });
      } else {
        setError(`An unknown error occurred please try again or contact @rrahulol on x for premium service`);
        setToast({ open: true, message: 'An unknown error occurred please try again or contact @rrahulol on x for premium service ', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = () => {
    setShowInput(true);
    setAddress('');
    setResults(null);
    setError('');
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    setToast({ open: true, message, type: 'info' });
  };

  const getApiEndpoint = () => {
    return analysisType === 'wallet'
      ? `${"https://spam2s.cam"}/api/dusting?address=${address}`
      : `${"https://spam2s.cam"}/api/transactionid?address=${address}`;
  };

  const getDisplayEndpoint = () => {
    return analysisType === 'wallet'
      ? `${"https://spam2s.cam"}/api/dusting?address=${truncateAddress(address)}`
      : `${"https://spam2s.cam"}/api/transactionid?address=${truncateAddress(address)}`;
  };

  const getPlaceholder = () => {
    return analysisType === 'wallet' ? "Enter wallet address" : "Enter transaction ID";
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#000000'
    }}>
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        message={toast.message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: toast.type === 'success' ? '#4caf50' : 
                           toast.type === 'error' ? '#f44336' : 
                           '#1a1a1a',
            color: '#ffffff',
            border: '1px solid #333'
          }
        }}
      />

      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        <Box sx={{ 
          mb: 4, 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ 
            fontWeight: 700,
            color: '#ffffff',
            mb: 2,
            mt: 10,
            fontSize: { xs: '2rem', md: '3rem' }
          }}>
            Solana Dusting Detector
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" paragraph sx={{ maxWidth: '600px' }}>
            Advanced wallet analysis tool for detecting dusting and address poisoning activities
          </Typography>
        </Box>

        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 4, 
            backgroundColor: '#111111',
            border: '1px solid #333',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          <Box sx={{ 
            fontFamily: 'monospace',
            fontSize: '1.2rem',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="h6" sx={{ color: '#ffffff', fontFamily: 'monospace' }}>
              API Endpoint
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<ContentCopy />}
                onClick={() => copyToClipboard(getApiEndpoint(), 'API endpoint copied to clipboard')}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  borderRadius: '20px',
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                  },
                }}
              >
                Copy
              </Button>
              {!showInput && (
                <Button
                  size="small"
                  startIcon={<Search />}
                  onClick={handleNewSearch}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    borderRadius: '20px',
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.4)',
                    },
                  }}
                >
                  New Search
                </Button>
              )}
            </Box>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            mb: 2,
            p: 2,
            backgroundColor: '#1a1a1a',
            borderRadius: 1,
            border: '1px solid #333',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#ffffff',
              boxShadow: '0 0 0 1px #ffffff'
            },
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              width: '100%'
            }}>
              <Typography sx={{ 
                fontFamily: 'monospace',
                color: '#ffffff',
                fontWeight: 600
              }}>
                GET
              </Typography>
              <Typography sx={{ 
                fontFamily: 'monospace',
                color: '#ffffff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {getDisplayEndpoint()}
              </Typography>
            </Box>
            {showInput && (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 1,
                width: { xs: '100%', sm: 'auto' }
              }}>
                <FormControl sx={{ my: 1 }}>
                  <RadioGroup
                    row
                    value={analysisType}
                    onChange={(e) => setAnalysisType(e.target.value as 'wallet' | 'transaction')}
                   >
                    <FormControlLabel 
                      value="wallet" 
                      control={
                        <Radio 
                          sx={{
                            color: '#ffffff',
                            '&.Mui-checked': {
                              color: '#ffffff',
                            },
                          }}
                        />
                      } 
                      label={
                        <Typography sx={{ color: '#ffffff' }}>
                          Wallet Address
                        </Typography>
                      }
                    />
                    <FormControlLabel 
                      value="transaction" 
                      control={
                        <Radio 
                          sx={{
                            color: '#ffffff',
                            '&.Mui-checked': {
                              color: '#ffffff',
                            },
                          }}
                        />
                      } 
                      label={
                        <Typography sx={{ color: '#ffffff' }}>
                          Transaction ID
                        </Typography>
                      }
                    />
                  </RadioGroup>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                  <TextField
                    size="small"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={getPlaceholder()}
                    sx={{
                      flex: 1,
                      minWidth: { md: '300px' },
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#1a1a1a',
                        borderRadius: '20px',
                        '& fieldset': {
                          borderColor: '#333',
                        },
                        '&:hover fieldset': {
                          borderColor: '#ffffff',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#ffffff',
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: '#ffffff',
                        fontFamily: 'monospace',
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || !address}
                    startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
                    sx={{
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      borderRadius: '20px',
                      '&:hover': {
                        backgroundColor: '#e0e0e0',
                      },
                      transition: 'all 0.3s ease',
                      '&:disabled': {
                        backgroundColor: '#424242',
                        color: '#757575'
                      }
                    }}
                  >
                    {loading ? 'Analyzing...' : 'Send '}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </Paper>

        {results && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3
          }}>
            <Box sx={{ 
              flex: 1,
              minWidth: 0
            }}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  backgroundColor: '#111111',
                  border: '1px solid #333',
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  height: '100%'
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2
                }}>
                  <Typography variant="h6" sx={{ color: '#ffffff', fontFamily: 'monospace' }}>
                    Response
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<ContentCopy />}
                    onClick={() => copyToClipboard(JSON.stringify(results, null, 2), 'Response copied to clipboard')}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      borderRadius: '20px',
                      px: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.4)',
                      },
                    }}
                  >
                    Copy
                  </Button>
                </Box>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#1a1a1a',
                    borderRadius: 1,
                    border: '1px solid #333',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#ffffff',
                      boxShadow: '0 0 0 1px #ffffff'
                    },
                    height: 'calc(100% - 48px)',
                    overflow: 'auto'
                  }}
                >
                  <pre style={{ 
                    margin: 0,
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5
                  }}>
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </Paper>
              </Paper>
            </Box>
            <Box sx={{ 
              flex: 1,
              minWidth: 0
            }}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  backgroundColor: '#111111',
                  border: '1px solid #333',
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  height: '100%'
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, color: '#ffffff', fontFamily: 'monospace' }}>
                  Analysis Results
                </Typography>
                <DustingResults analysis={results} analysisType={analysisType} />
              </Paper>
            </Box>
          </Box>
        )}
      </Container>

      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          mt: 'auto',
          backgroundColor: '#111111',
          borderTop: '1px solid #333'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}>
            <Typography variant="body2" color="text.secondary">
              Created for helius [redacted] hackathon
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography
                component="a"
                href="https://x.com/spam2scam"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderBottom: '1px solid #ffffff',
                  '&:hover': {
                    borderBottom: '1px solid #ffffff',
                    color: '#ffffff'
                  }
                }}
              >
                Twitter
              </Typography>
              {/* <Typography
                component="a"
                href="https://rahul.fyi"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderBottom: '1px solid #ffffff',
                  '&:hover': {
                    borderBottom: '1px solid #ffffff',
                    color: '#ffffff'
                  }
                }}
              >
                rahul.fyi
              </Typography> */}
            </Box>
            <Typography variant="body2" color="text.secondary">
              Tip Wallet: GcqBZn9c5UgJ7mctm88HeHi28Ux7NCDrUHqBcWkfHX5J
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}