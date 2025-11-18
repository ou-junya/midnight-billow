// This file is part of Midnight Billow - ZK Invoice Payment System
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from 'react';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import {
  Backdrop,
  CircularProgress,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  Skeleton,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
  Divider,
  InputAdornment,
  Alert,
  Fade,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TitleIcon from '@mui/icons-material/Title';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { type InvoiceDerivedState, type DeployedInvoiceAPI, type InvoiceData } from '../../../api/src/index';
import { useDeployedInvoiceContext } from '../hooks';
import { type InvoiceDeployment } from '../contexts';
import { type Observable } from 'rxjs';
import { State } from '../../../contract/src/index';
import { EmptyCardContent } from './Board.EmptyCardContent';

/** The props required by the {@link InvoiceBoard} component. */
export interface InvoiceBoardProps {
  /** The observable invoice deployment. */
  invoiceDeployment$?: Observable<InvoiceDeployment>;
  /** Whether to hide the create/join buttons (when in issue form mode) */
  hideEmptyState?: boolean;
  /** Callback when issue form visibility changes */
  onIssueFormChange?: (isVisible: boolean) => void;
}

/**
 * Provides the UI for a deployed invoice contract.
 */
export const InvoiceBoard: React.FC<Readonly<InvoiceBoardProps>> = ({ 
  invoiceDeployment$, 
  hideEmptyState = false,
  onIssueFormChange,
}) => {
  const invoiceApiProvider = useDeployedInvoiceContext();
  const [invoiceDeployment, setInvoiceDeployment] = useState<InvoiceDeployment>();
  const [deployedInvoiceAPI, setDeployedInvoiceAPI] = useState<DeployedInvoiceAPI>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [invoiceState, setInvoiceState] = useState<InvoiceDerivedState>();
  const [isWorking, setIsWorking] = useState(!!invoiceDeployment$);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string>();

  // Invoice form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('NIGHT');

  // Form validation
  const [titleError, setTitleError] = useState('');
  const [amountError, setAmountError] = useState('');

  const onCreate = useCallback(() => invoiceApiProvider.resolve(), [invoiceApiProvider]);
  const onJoin = useCallback(
    (contractAddress: ContractAddress) => invoiceApiProvider.resolve(contractAddress),
    [invoiceApiProvider],
  );

  const validateForm = useCallback(() => {
    let isValid = true;

    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else if (title.length < 3) {
      setTitleError('Title must be at least 3 characters');
      isValid = false;
    } else {
      setTitleError('');
    }

    if (!amount) {
      setAmountError('Amount is required');
      isValid = false;
    } else if (Number(amount) <= 0) {
      setAmountError('Amount must be greater than 0');
      isValid = false;
    } else {
      setAmountError('');
    }

    return isValid;
  }, [title, amount]);

  const onIssueInvoice = useCallback(async () => {
    if (!deployedInvoiceAPI) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsWorking(true);
      setErrorMessage(undefined);
      const invoiceData: InvoiceData = {
        title: title.trim(),
        description: description.trim(),
        issuedAt: new Date().toISOString().split('T')[0],
        currency,
      };
      const txHash = await deployedInvoiceAPI.issueInvoice(BigInt(amount), invoiceData);
      setLastTxHash(txHash);
      setShowIssueForm(false);
      setTitle('');
      setDescription('');
      setAmount('');
      setTitleError('');
      setAmountError('');
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  }, [deployedInvoiceAPI, title, description, amount, currency, validateForm]);

  const onPayInvoice = useCallback(async () => {
    if (!deployedInvoiceAPI) {
      return;
    }

    try {
      setIsWorking(true);
      const txHash = await deployedInvoiceAPI.payInvoice();
      setLastTxHash(txHash);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  }, [deployedInvoiceAPI]);

  const onResetInvoice = useCallback(async () => {
    if (!deployedInvoiceAPI) {
      return;
    }

    try {
      setIsWorking(true);
      const txHash = await deployedInvoiceAPI.resetInvoice();
      setLastTxHash(txHash);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  }, [deployedInvoiceAPI]);

  useEffect(() => {
    if (!invoiceDeployment$) {
      return;
    }

    const subscription = invoiceDeployment$.subscribe((deployment) => {
      setInvoiceDeployment(deployment);

      if (deployment.status === 'deployed') {
        setDeployedInvoiceAPI(deployment.api);
        setIsWorking(false);
      } else if (deployment.status === 'failed') {
        setErrorMessage(deployment.error.message);
        setIsWorking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [invoiceDeployment$]);

  useEffect(() => {
    if (!deployedInvoiceAPI) {
      return;
    }

    const subscription = deployedInvoiceAPI.state$.subscribe((state) => {
      setInvoiceState(state);
    });

    return () => subscription.unsubscribe();
  }, [deployedInvoiceAPI]);

  useEffect(() => {
    onIssueFormChange?.(showIssueForm);
  }, [showIssueForm, onIssueFormChange]);

  if (!invoiceDeployment$ && !hideEmptyState) {
    return (
      <EmptyCardContent
        contractAddress={deployedInvoiceAPI?.deployedContractAddress}
        onCreate={onCreate}
        onJoin={onJoin}
      />
    );
  }

  if (!invoiceDeployment$ && hideEmptyState) {
    return null;
  }

  if (isWorking || !invoiceState) {
    return (
      <>
        <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <CircularProgress />
        </Backdrop>
        <Card>
          <CardHeader title={<Skeleton />} subheader={<Skeleton />} />
          <CardContent>
            <Skeleton variant="rectangular" height={200} />
          </CardContent>
        </Card>
      </>
    );
  }

  const getStateColor = () => {
    switch (invoiceState.state) {
      case State.EMPTY:
        return 'default';
      case State.ISSUED:
        return 'warning';
      case State.PAID:
        return 'success';
      default:
        return 'default';
    }
  };

  const getStateLabel = () => {
    switch (invoiceState.state) {
      case State.EMPTY:
        return 'No Invoice';
      case State.ISSUED:
        return 'Issued';
      case State.PAID:
        return 'Paid';
      default:
        return 'Unknown';
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'issue':
        return 'Invoice Issued';
      case 'payment':
        return 'Payment';
      case 'reset':
        return 'Reset';
      default:
        return type;
    }
  };

  return (
    <>
      <Backdrop open={isWorking} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress />
      </Backdrop>

      <Card>
        <CardHeader
          avatar={<ReceiptIcon />}
          title="Midnight Billow Invoice"
          subheader={`Contract: ${deployedInvoiceAPI?.deployedContractAddress.slice(0, 10)}...`}
          action={<Chip label={getStateLabel()} color={getStateColor()} />}
        />
        <CardContent>
          {/* Display last transaction hash if available */}
          {lastTxHash && (
            <Fade in timeout={300}>
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setLastTxHash(undefined)}>
                <Typography variant="body2" fontWeight={600} sx={{ color: 'black' }}>
                  Transaction Successful
                </Typography>
                <Typography variant="caption" sx={{ wordBreak: 'break-all', color: 'black' }}>
                  TX Hash: {lastTxHash}
                </Typography>
              </Alert>
            </Fade>
          )}

          {/* Transaction History Section */}
          {invoiceState && invoiceState.transactionHistory.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={showHistory ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                endIcon={<HistoryIcon />}
                onClick={() => setShowHistory(!showHistory)}
                fullWidth
                sx={{ borderRadius: 2, textTransform: 'none', mb: 2 }}
              >
                Transaction History ({invoiceState.transactionHistory.length})
              </Button>
              <Collapse in={showHistory}>
                <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'primary.main' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>TX Hash</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Block</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Time</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoiceState.transactionHistory.slice().reverse().map((tx, index) => (
                        <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                          <TableCell>
                            <Chip
                              label={getTransactionTypeLabel(tx.type)}
                              size="small"
                              color={tx.type === 'payment' ? 'success' : tx.type === 'issue' ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                          </TableCell>
                          <TableCell>{tx.blockHeight}</TableCell>
                          <TableCell>{new Date(tx.timestamp).toLocaleString()}</TableCell>
                          <TableCell>
                            {tx.amount ? `${tx.amount.toString()} ${tx.invoiceData?.currency || 'NIGHT'}` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </Box>
          )}
          {invoiceState.state === State.EMPTY && !showIssueForm && (
            <Fade in timeout={500}>
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <ReceiptIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" color="text.primary" gutterBottom fontWeight={500}>
                  No Active Invoice
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create a new invoice to get started with ZK-powered payments
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ReceiptIcon />}
                  onClick={() => setShowIssueForm(true)}
                  sx={{
                    mt: 2,
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    boxShadow: 3,
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s ease',
                    },
                  }}
                >
                  Issue New Invoice
                </Button>
              </Box>
            </Fade>
          )}

          {invoiceState.state === State.EMPTY && showIssueForm && (
            <Fade in timeout={500}>
              <Paper elevation={0} sx={{ p: 3, bgcolor: '#ffffff', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" fontWeight={600} color="primary">
                    Create Invoice
                  </Typography>
                  <IconButton
                    onClick={() => {
                      setShowIssueForm(false);
                      setTitleError('');
                      setAmountError('');
                      setErrorMessage(undefined);
                    }}
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                <Stack spacing={3}>
                  <TextField
                    label="Invoice Title"
                    placeholder="e.g., Website Development Project"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (titleError) setTitleError('');
                    }}
                    fullWidth
                    required
                    error={!!titleError}
                    helperText={titleError || 'A clear and descriptive title for this invoice'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TitleIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  
                  <TextField
                    label="Description"
                    placeholder="Add any additional details about this invoice..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                          <DescriptionIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                      label="Amount"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (amountError) setAmountError('');
                      }}
                      type="number"
                      required
                      error={!!amountError}
                      helperText={amountError || 'Enter the invoice amount'}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoneyIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      inputProps={{ min: 0, step: 'any' }}
                      sx={{ 
                        flex: '1 1 65%',
                        minWidth: '200px',
                        '& .MuiOutlinedInput-root': { borderRadius: 2 } 
                      }}
                    />
                    
                    <TextField
                      label="Currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      disabled
                      sx={{ 
                        flex: '1 1 30%',
                        minWidth: '100px',
                        '& .MuiOutlinedInput-root': { borderRadius: 2 } 
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                    <CalendarTodayIcon fontSize="small" />
                    <Typography variant="body2">
                      Issue Date: {new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => {
                      setShowIssueForm(false);
                      setTitle('');
                      setDescription('');
                      setAmount('');
                      setTitleError('');
                      setAmountError('');
                      setErrorMessage(undefined);
                    }}
                    sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={onIssueInvoice}
                    disabled={!title.trim() || !amount || !!titleError || !!amountError}
                    startIcon={<ReceiptIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      px: 3,
                      boxShadow: 2,
                      '&:hover': {
                        boxShadow: 4,
                      },
                    }}
                  >
                    Issue Invoice
                  </Button>
                </Box>
              </Paper>
            </Fade>
          )}

          {invoiceState.state === State.ISSUED && invoiceState.invoiceData && (
            <Fade in timeout={500}>
              <Box>
                <Paper elevation={0} sx={{ p: 3, bgcolor: 'primary.50', borderRadius: 2, mb: 3 }}>
                  <Typography variant="h4" gutterBottom fontWeight={600} color="primary.main">
                    {invoiceState.invoiceData.title}
                  </Typography>
                  {invoiceState.invoiceData.description && (
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
                      {invoiceState.invoiceData.description}
                    </Typography>
                  )}
                </Paper>
                
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 4, 
                    bgcolor: 'background.paper',
                    borderRadius: 3,
                    border: '2px solid',
                    borderColor: 'primary.main',
                    textAlign: 'center',
                    mb: 3,
                  }}
                >
                  <Typography variant="overline" color="text.secondary" fontWeight={500}>
                    Amount Due
                  </Typography>
                  <Typography 
                    variant="h2" 
                    color="primary.main" 
                    fontWeight={700}
                    sx={{ my: 1 }}
                  >
                    {invoiceState.amount.toString()}
                  </Typography>
                  <Chip 
                    label={invoiceState.invoiceData.currency} 
                    color="primary" 
                    size="medium"
                    sx={{ fontWeight: 600 }}
                  />
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Issued on {new Date(invoiceState.invoiceData.issuedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Box>
                </Paper>
                
                {invoiceState.canPay ? (
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<PaymentIcon />}
                    onClick={onPayInvoice}
                    fullWidth
                    sx={{
                      py: 2,
                      borderRadius: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: 4,
                      '&:hover': {
                        boxShadow: 6,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.3s ease',
                      },
                    }}
                  >
                    Pay with Zero-Knowledge Proof
                  </Button>
                ) : (
                  <Alert 
                    severity="warning" 
                    sx={{ 
                      borderRadius: 2,
                      '& .MuiAlert-message': {
                        width: '100%',
                      },
                    }}
                  >
                    <Typography variant="body1" fontWeight={500}>
                      Authorization Required
                    </Typography>
                    <Typography variant="body2">
                      You are not authorized to pay this invoice. Only the designated payer can complete this transaction.
                    </Typography>
                  </Alert>
                )}
              </Box>
            </Fade>
          )}

          {invoiceState.state === State.PAID && invoiceState.invoiceData && (
            <Fade in timeout={500}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 3,
                    borderRadius: '50%',
                    bgcolor: 'success.light',
                    mb: 3,
                  }}
                >
                  <CheckCircleIcon color="success" sx={{ fontSize: 80 }} />
                </Box>
                
                <Typography variant="h3" gutterBottom fontWeight={700} color="success.main">
                  Payment Completed! 🎉
                </Typography>
                
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                  The invoice <strong>"{invoiceState.invoiceData.title}"</strong> has been successfully paid using zero-knowledge proof technology
                </Typography>
                
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    maxWidth: 400,
                    mx: 'auto',
                    mb: 4,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="overline" color="text.secondary" display="block" gutterBottom>
                    Payment Amount
                  </Typography>
                  <Typography variant="h4" color="primary.main" fontWeight={600}>
                    {invoiceState.amount.toString()} {invoiceState.invoiceData.currency}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body2" color="text.secondary">
                    Transaction verified with ZK proof
                  </Typography>
                </Paper>
                
                <Button
                  variant="contained"
                  size="large"
                  onClick={onResetInvoice}
                  startIcon={<ReceiptIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                    },
                  }}
                >
                  Issue New Invoice
                </Button>
              </Box>
            </Fade>
          )}

          {errorMessage && (
            <Fade in timeout={300}>
              <Alert 
                severity="error" 
                onClose={() => setErrorMessage(undefined)}
                sx={{ 
                  mt: 3,
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    width: '100%',
                  },
                }}
              >
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  Error
                </Typography>
                <Typography variant="body2">
                  {errorMessage}
                </Typography>
              </Alert>
            </Fade>
          )}
        </CardContent>
      </Card>
    </>
  );
};
