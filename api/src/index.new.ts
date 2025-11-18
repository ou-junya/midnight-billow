// This file is part of Midnight Billow - ZK Invoice Payment System
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Provides types and utilities for working with invoice contracts.
 *
 * @packageDocumentation
 */

import contractModule from '../../contract/src/managed/invoice/contract/index.cjs';
const { Contract, ledger, pureCircuits, State } = contractModule;

import { type ContractAddress, convert_bigint_to_Uint8Array } from '@midnight-ntwrk/compact-runtime';
import { type Logger } from 'pino';
import {
  type InvoiceDerivedState,
  type InvoiceContract,
  type InvoiceProviders,
  type DeployedInvoiceContract,
  type InvoiceData,
  invoicePrivateStateKey,
} from './common-types.js';
import { type InvoicePrivateState, createInvoicePrivateState, witnesses } from '../../contract/src/index';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, map, tap, from, type Observable } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';

/** @internal */
const invoiceContractInstance: InvoiceContract = new Contract(witnesses);

/**
 * An API for a deployed invoice contract.
 */
export interface DeployedInvoiceAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<InvoiceDerivedState>;

  issueInvoice: (amount: bigint, invoiceData: InvoiceData) => Promise<void>;
  payInvoice: () => Promise<void>;
  resetInvoice: () => Promise<void>;
}

/**
 * Provides an implementation of {@link DeployedInvoiceAPI} by adapting a deployed invoice contract.
 */
export class InvoiceAPI implements DeployedInvoiceAPI {
  /** @internal */
  private constructor(
    public readonly deployedContract: DeployedInvoiceContract,
    providers: InvoiceProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    this.state$ = combineLatest(
      [
        // Combine public (ledger) state with...
        providers.publicDataProvider.contractStateObservable(this.deployedContractAddress, { type: 'latest' }).pipe(
          map((contractState) => ledger(contractState.data)),
          tap((ledgerState) =>
            logger?.trace({
              ledgerStateChanged: {
                ledgerState: {
                  ...ledgerState,
                  state: ledgerState.state === State.ISSUED ? 'issued' : ledgerState.state === State.PAID ? 'paid' : 'empty',
                  buyerPk: toHex(ledgerState.buyerPk),
                  amount: ledgerState.amount.toString(),
                },
              },
            }),
          ),
        ),
        // ...private state...
        from(providers.privateStateProvider.get(invoicePrivateStateKey) as Promise<InvoicePrivateState>),
      ],
      // ...and combine them to produce the required derived state.
      (ledgerState, privateState) => {
        const hashedSecretKey = pureCircuits.buyerKey(
          privateState.secretKey,
          convert_bigint_to_Uint8Array(32, ledgerState.sequence),
        );

        let invoiceData: InvoiceData | undefined = undefined;
        if (ledgerState.invoiceJson.value) {
          try {
            invoiceData = JSON.parse(ledgerState.invoiceJson.value) as InvoiceData;
          } catch (e) {
            logger?.error('Failed to parse invoice JSON', e);
          }
        }

        return {
          state: ledgerState.state,
          sequence: ledgerState.sequence,
          amount: ledgerState.amount,
          invoiceData,
          canPay: toHex(ledgerState.buyerPk) === toHex(hashedSecretKey),
        };
      },
    );
  }

  /**
   * Gets the address of the current deployed contract.
   */
  readonly deployedContractAddress: ContractAddress;

  /**
   * Gets an observable stream of state changes based on the current public (ledger),
   * and private state data.
   */
  readonly state$: Observable<InvoiceDerivedState>;

  /**
   * Issues a new invoice with the given amount and invoice data.
   *
   * @param amount The amount to invoice.
   * @param invoiceData The invoice metadata.
   */
  async issueInvoice(amount: bigint, invoiceData: InvoiceData): Promise<void> {
    this.logger?.info(`issuingInvoice: amount=${amount}, data=${JSON.stringify(invoiceData)}`);

    const invoiceJson = JSON.stringify(invoiceData);
    const txData = await this.deployedContract.callTx.issueInvoice(amount, invoiceJson);

    this.logger?.trace({
      transactionAdded: {
        circuit: 'issueInvoice',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  /**
   * Pays the currently issued invoice using ZK proof.
   */
  async payInvoice(): Promise<void> {
    this.logger?.info('payingInvoice');

    const txData = await this.deployedContract.callTx.payInvoice();

    this.logger?.trace({
      transactionAdded: {
        circuit: 'payInvoice',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  /**
   * Resets a paid invoice to allow a new invoice to be issued.
   */
  async resetInvoice(): Promise<void> {
    this.logger?.info('resettingInvoice');

    const txData = await this.deployedContract.callTx.resetInvoice();

    this.logger?.trace({
      transactionAdded: {
        circuit: 'resetInvoice',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  /**
   * Deploys a new invoice contract to the network.
   */
  static async deploy(providers: InvoiceProviders, logger?: Logger): Promise<InvoiceAPI> {
    logger?.info('deployContract');

    const deployedInvoiceContract = await deployContract<typeof invoiceContractInstance>(providers, {
      privateStateId: invoicePrivateStateKey,
      contract: invoiceContractInstance,
      initialPrivateState: await InvoiceAPI.getPrivateState(providers),
    });

    logger?.trace({
      contractDeployed: {
        finalizedDeployTxData: deployedInvoiceContract.deployTxData.public,
      },
    });

    return new InvoiceAPI(deployedInvoiceContract, providers, logger);
  }

  /**
   * Finds an already deployed invoice contract on the network, and joins it.
   */
  static async join(providers: InvoiceProviders, contractAddress: ContractAddress, logger?: Logger): Promise<InvoiceAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });

    const deployedInvoiceContract = await findDeployedContract<InvoiceContract>(providers, {
      contractAddress,
      contract: invoiceContractInstance,
      privateStateId: invoicePrivateStateKey,
      initialPrivateState: await InvoiceAPI.getPrivateState(providers),
    });

    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedInvoiceContract.deployTxData.public,
      },
    });

    return new InvoiceAPI(deployedInvoiceContract, providers, logger);
  }

  private static async getPrivateState(providers: InvoiceProviders): Promise<InvoicePrivateState> {
    const existingPrivateState = await providers.privateStateProvider.get(invoicePrivateStateKey);
    return existingPrivateState ?? createInvoicePrivateState(utils.randomBytes(32));
  }
}

/**
 * A namespace that represents the exports from the `'utils'` sub-package.
 *
 * @public
 */
export * as utils from './utils/index.js';

export * from './common-types.js';
