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

import React, { type PropsWithChildren, createContext } from 'react';
import { type DeployedInvoiceAPIProvider, BrowserDeployedInvoiceManager } from './BrowserDeployedBoardManager';
import { type Logger } from 'pino';

/**
 * Encapsulates a deployed invoices provider as a context object.
 */
export const DeployedInvoiceContext = createContext<DeployedInvoiceAPIProvider | undefined>(undefined);

/**
 * The props required by the {@link DeployedInvoiceProvider} component.
 */
export type DeployedInvoiceProviderProps = PropsWithChildren<{
  /** The `pino` logger to use. */
  logger: Logger;
}>;

/**
 * A React component that sets a new {@link BrowserDeployedInvoiceManager} object as the currently
 * in-scope deployed invoice provider.
 */
export const DeployedInvoiceProvider: React.FC<Readonly<DeployedInvoiceProviderProps>> = ({ logger, children }) => (
  <DeployedInvoiceContext.Provider value={new BrowserDeployedInvoiceManager(logger)}>
    {children}
  </DeployedInvoiceContext.Provider>
);
