// This file is part of Midnight Billow - ZK Invoice Payment System
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

import React from 'react';
import { AppBar, Box, Typography } from '@mui/material';

/**
 * A simple application level header for the Midnight Billow application.
 */
export const Header: React.FC = () => (
  <AppBar
    position="static"
    data-testid="header"
    sx={{
      background: 'linear-gradient(135deg, #1a0f2e 0%, #2d1b69 50%, #4a148c 100%)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(156, 39, 176, 0.4)',
      borderBottom: '2px solid rgba(186, 104, 200, 0.6)',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        px: 10,
        py: 4,
        alignItems: 'center',
        gap: 1,
      }}
      data-testid="header-logo"
    >
      <Typography 
        variant="h3" 
        component="div" 
        sx={{ 
          fontWeight: 900,
          background: 'linear-gradient(45deg, #9c27b0 30%, #ce93d8 90%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          textShadow: '0 0 40px rgba(156, 39, 176, 0.6)',
        }}
      >
        🌊 Midnight Billow
      </Typography>
      <Typography 
        variant="subtitle1" 
        sx={{ 
          color: '#ce93d8',
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontSize: '0.875rem',
        }}
      >
        Zero-Knowledge Invoice Payment System
      </Typography>
    </Box>
  </AppBar>
);
