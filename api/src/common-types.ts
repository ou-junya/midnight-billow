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

/**
 * Invoice contract common types and abstractions.
 *
 * @module
 */

import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { State, InvoicePrivateState, Contract, Witnesses } from '../../contract/src/index';

export const invoicePrivateStateKey = 'invoicePrivateState';
export type PrivateStateId = typeof invoicePrivateStateKey;

/**
 * The private states consumed throughout the application.
 *
 * @remarks
 * {@link PrivateStates} can be thought of as a type that describes a schema for all
 * private states for all contracts used in the application. Each key represents
 * the type of private state consumed by a particular type of contract.
 * The key is used by the deployed contract when interacting with a private state provider,
 * and the type (i.e., `typeof PrivateStates[K]`) represents the type of private state
 * expected to be returned.
 *
 * Since there is only one contract type for the invoice example, we only define a
 * single key/type in the schema.
 *
 * @public
 */
export type PrivateStates = {
  /**
   * Key used to provide the private state for {@link InvoiceContract} deployments.
   */
  readonly invoicePrivateState: InvoicePrivateState;
};

/**
 * Represents an invoice contract and its private state.
 *
 * @public
 */
export type InvoiceContract = Contract<InvoicePrivateState, Witnesses<InvoicePrivateState>>;

/**
 * The keys of the circuits exported from {@link InvoiceContract}.
 *
 * @public
 */
export type InvoiceCircuitKeys = Exclude<keyof InvoiceContract['impureCircuits'], number | symbol>;

/**
 * The providers required by {@link InvoiceContract}.
 *
 * @public
 */
export type InvoiceProviders = MidnightProviders<InvoiceCircuitKeys, PrivateStateId, InvoicePrivateState>;

/**
 * A {@link InvoiceContract} that has been deployed to the network.
 *
 * @public
 */
export type DeployedInvoiceContract = FoundContract<InvoiceContract>;

/**
 * Invoice data structure for JSON encoding
 */
export type InvoiceData = {
  readonly title: string;
  readonly description: string;
  readonly issuedAt: string;
  readonly currency: string;
};

/**
 * Transaction history entry
 */
export type TransactionHistoryEntry = {
  readonly type: 'issue' | 'payment' | 'reset';
  readonly txHash: string;
  readonly blockHeight: number;
  readonly timestamp: Date;
  readonly amount?: bigint;
  readonly invoiceData?: InvoiceData;
};

/**
 * A type that represents the derived combination of public (or ledger), and private state.
 */
export type InvoiceDerivedState = {
  readonly state: State;
  readonly sequence: bigint;
  readonly amount: bigint;
  readonly invoiceData: InvoiceData | undefined;
  readonly transactionHistory: TransactionHistoryEntry[];

  /**
   * A readonly flag that determines if the current user can pay this invoice.
   *
   * @remarks
   * The `buyerPk` property of the public (or ledger) state is the public key of the buyer, while
   * the `secretKey` property of {@link InvoicePrivateState} is the secret key of the current user. If
   * `buyerPk` corresponds to the public key derived from `secretKey`, then `canPay` is `true`.
   */
  readonly canPay: boolean;
};

// TODO: for some reason I needed to include "@midnight-ntwrk/wallet-sdk-address-format": "1.0.0-rc.1", should we bump in to rc-2 ?
