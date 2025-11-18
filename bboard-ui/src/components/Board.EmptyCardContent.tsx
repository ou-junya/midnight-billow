// This file is part of midnightntwrk/example-counter.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { useState } from 'react';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { CardActions, CardContent, IconButton, Tooltip, Typography, Button, Box, Stack } from '@mui/material';
import BoardAddIcon from '@mui/icons-material/PostAddOutlined';
import CreateBoardIcon from '@mui/icons-material/AddCircleOutlined';
import JoinBoardIcon from '@mui/icons-material/AddLinkOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { TextPromptDialog } from './TextPromptDialog';

/**
 * The props required by the {@link EmptyCardContent} component.
 *
 * @internal
 */
export interface EmptyCardContentProps {
  /** The contract address, if available. */
  contractAddress?: ContractAddress;
  /** A callback that will be called to create a new invoice contract. */
  onCreate: () => void;
  /** A callback that will be called to join an existing invoice contract. */
  onJoin: (contractAddress: ContractAddress) => void;
}

/**
 * Used when there is no invoice deployment to render a UI allowing the user to join or deploy invoice contracts.
 *
 * @internal
 */
export const EmptyCardContent: React.FC<Readonly<EmptyCardContentProps>> = ({
  contractAddress,
  onCreate,
  onJoin,
}) => {
  const [textPromptOpen, setTextPromptOpen] = useState(false);

  return (
    <React.Fragment>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            py: 6,
          }}
        >
          <Box
            sx={{
              mb: 4,
              p: 3,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
            }}
          >
            <ReceiptLongIcon
              sx={{
                fontSize: 80,
                color: 'white',
              }}
            />
          </Box>

          <Typography
            variant="h4"
            sx={{
              mb: 2,
              fontWeight: 700,
              color: 'white',
              textAlign: 'center',
            }}
          >
            Zero-Knowledge Invoice System
          </Typography>

          <Typography
            variant="body1"
            sx={{
              mb: 5,
              color: 'white',
              textAlign: 'center',
              maxWidth: '500px',
            }}
          >
            Create secure, privacy-preserving invoices on the Midnight blockchain
          </Typography>

          <Button
            data-testid="board-deploy-btn"
            variant="contained"
            size="large"
            onClick={onCreate}
            startIcon={<AddCircleOutlineIcon />}
            sx={{
              py: 2,
              px: 6,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: '50px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
              textTransform: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                boxShadow: '0 6px 30px rgba(102, 126, 234, 0.6)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
          >
            Create New Invoice Contract
          </Button>
        </Box>
      </CardContent>
      <TextPromptDialog
        prompt="Enter contract address"
        isOpen={textPromptOpen}
        onCancel={() => {
          setTextPromptOpen(false);
        }}
        onSubmit={(text) => {
          setTextPromptOpen(false);
          onJoin(text);
        }}
      />
    </React.Fragment>
  );
};
