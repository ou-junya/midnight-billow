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

import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { MainLayout, InvoiceBoard } from './components';
import { useDeployedInvoiceContext } from './hooks';
import { type InvoiceDeployment } from './contexts';
import { type Observable } from 'rxjs';

/**
 * The root Midnight Billow application component.
 *
 * @remarks
 * The {@link App} component requires a `<DeployedInvoiceProvider />` parent in order to retrieve
 * information about current invoice deployments.
 *
 * @internal
 */
const App: React.FC = () => {
  const invoiceApiProvider = useDeployedInvoiceContext();
  const [invoiceDeployments, setInvoiceDeployments] = useState<Array<Observable<InvoiceDeployment>>>([]);

  useEffect(() => {
    const subscription = invoiceApiProvider.invoiceDeployments$.subscribe(setInvoiceDeployments);

    return () => {
      subscription.unsubscribe();
    };
  }, [invoiceApiProvider]);

  return (
    <Box sx={{ 
      background: 'radial-gradient(ellipse at 50% 0%, #1a0f2e 0%, #0a0a1a 50%, #000000 100%)',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      '@keyframes wave': {
        '0%': { 
          transform: 'translateX(0) translateY(0) rotate(0deg)',
          opacity: 0.6,
        },
        '50%': { 
          transform: 'translateX(-16.667%) translateY(-20px) rotate(1deg)',
          opacity: 0.8,
        },
        '100%': { 
          transform: 'translateX(0) translateY(0) rotate(0deg)',
          opacity: 0.6,
        },
      },
      '@keyframes wave2': {
        '0%': { 
          transform: 'translateX(0) translateY(0) rotate(0deg)',
          opacity: 0.5,
        },
        '50%': { 
          transform: 'translateX(16.667%) translateY(20px) rotate(-1deg)',
          opacity: 0.7,
        },
        '100%': { 
          transform: 'translateX(0) translateY(0) rotate(0deg)',
          opacity: 0.5,
        },
      },
      '@keyframes float': {
        '0%, 100%': { 
          transform: 'translate(0, 0) scale(1)',
          opacity: 0.3,
        },
        '33%': { 
          transform: 'translate(40px, -40px) scale(1.15)',
          opacity: 0.5,
        },
        '66%': { 
          transform: 'translate(-30px, 30px) scale(0.85)',
          opacity: 0.4,
        },
      },
      '@keyframes shimmer': {
        '0%': { 
          transform: 'translateX(0)',
        },
        '100%': { 
          transform: 'translateX(25%)',
        },
      },
      '@keyframes particle': {
        '0%': {
          transform: 'translateY(0) translateX(0) scale(0)',
          opacity: 0,
        },
        '10%': {
          opacity: 1,
        },
        '90%': {
          opacity: 1,
        },
        '100%': {
          transform: 'translateY(-100vh) translateX(50px) scale(1)',
          opacity: 0,
        },
      },
    }}>
      {/* Ambient Light Background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 30%, rgba(156, 39, 176, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 80% 20%, rgba(103, 58, 183, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 50% 80%, rgba(186, 104, 200, 0.12) 0%, transparent 50%)
          `,
          zIndex: 0,
        }}
      />

      {/* Shimmer Effect */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '-200%',
          width: '400%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent 0%, transparent 45%, rgba(186, 104, 200, 0.08) 50%, transparent 55%, transparent 100%)',
          animation: 'shimmer 12s linear infinite',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Particles */}
      {[...Array(15)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            bottom: '-10px',
            left: `${(i * 7) % 100}%`,
            width: `${4 + (i % 3) * 2}px`,
            height: `${4 + (i % 3) * 2}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${156 + (i % 30)}, ${39 + (i % 80)}, ${176 + (i % 79)}, 0.8), transparent)`,
            boxShadow: `0 0 ${10 + (i % 10)}px rgba(156, 39, 176, 0.6)`,
            animation: `particle ${15 + (i % 10)}s linear infinite`,
            animationDelay: `${i * 0.8}s`,
            zIndex: 4,
          }}
        />
      ))}

      {/* Wave Layer 1 - Bottom */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: '-50%',
          width: '300%',
          height: '45vh',
          background: 'linear-gradient(180deg, transparent 0%, rgba(103, 58, 183, 0.25) 40%, rgba(156, 39, 176, 0.45) 100%)',
          clipPath: 'polygon(0 35%, 8% 32%, 16% 35%, 24% 30%, 32% 35%, 40% 32%, 48% 35%, 56% 30%, 64% 35%, 72% 32%, 80% 35%, 88% 30%, 96% 35%, 100% 32%, 100% 100%, 0 100%)',
          animation: 'wave 18s ease-in-out infinite',
          backdropFilter: 'blur(2px)',
          zIndex: 1,
        }}
      />
      
      {/* Wave Layer 2 - Middle */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: '-50%',
          width: '300%',
          height: '40vh',
          background: 'linear-gradient(180deg, transparent 0%, rgba(123, 31, 162, 0.2) 50%, rgba(156, 39, 176, 0.35) 100%)',
          clipPath: 'polygon(0 45%, 7% 42%, 14% 48%, 21% 43%, 28% 47%, 35% 42%, 42% 46%, 49% 41%, 56% 47%, 63% 43%, 70% 48%, 77% 42%, 84% 47%, 91% 43%, 98% 48%, 100% 45%, 100% 100%, 0 100%)',
          animation: 'wave2 14s ease-in-out infinite',
          animationDelay: '2s',
          zIndex: 2,
        }}
      />
      
      {/* Wave Layer 3 - Top */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: '-50%',
          width: '300%',
          height: '35vh',
          background: 'linear-gradient(180deg, transparent 0%, rgba(156, 39, 176, 0.15) 60%, rgba(186, 104, 200, 0.25) 100%)',
          clipPath: 'polygon(0 55%, 6% 52%, 12% 57%, 18% 53%, 24% 58%, 30% 52%, 36% 56%, 42% 51%, 48% 57%, 54% 53%, 60% 58%, 66% 52%, 72% 56%, 78% 51%, 84% 57%, 90% 53%, 96% 58%, 100% 55%, 100% 100%, 0 100%)',
          animation: 'wave 11s ease-in-out infinite',
          animationDelay: '5s',
          zIndex: 3,
        }}
      />

      {/* Floating Orbs - Enhanced */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          left: '8%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(156, 39, 176, 0.5) 0%, rgba(156, 39, 176, 0.2) 40%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 22s ease-in-out infinite',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '45%',
          right: '10%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(103, 58, 183, 0.4) 0%, rgba(103, 58, 183, 0.15) 40%, transparent 70%)',
          filter: 'blur(70px)',
          animation: 'float 28s ease-in-out infinite',
          animationDelay: '7s',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '65%',
          left: '55%',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(186, 104, 200, 0.35) 0%, rgba(186, 104, 200, 0.1) 40%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'float 20s ease-in-out infinite',
          animationDelay: '12s',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '30%',
          left: '70%',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(142, 36, 170, 0.3) 0%, transparent 70%)',
          filter: 'blur(45px)',
          animation: 'float 25s ease-in-out infinite',
          animationDelay: '3s',
          zIndex: 0,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 10 }}>
        <MainLayout>
          {invoiceDeployments.map((invoiceDeployment, idx) => (
            <div data-testid={`invoice-${idx}`} key={`invoice-${idx}`}>
              <InvoiceBoard invoiceDeployment$={invoiceDeployment} />
            </div>
          ))}
          <div data-testid="invoice-start">
            <InvoiceBoard />
          </div>
        </MainLayout>
      </Box>
    </Box>
  );
};

export default App;
