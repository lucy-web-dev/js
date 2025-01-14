import type { Chain } from "../chains/types.js";
import { getCachedChain } from "../chains/utils.js";
import type { ThirdwebClient } from "../client/client.js";
import {
  type PreparedTransaction,
  prepareTransaction,
} from "../transaction/prepare-transaction.js";
import type { Address } from "../utils/address.js";
import { toBigInt } from "../utils/bigint.js";
import type { Hex } from "../utils/encoding/hex.js";
import { getClientFetch } from "../utils/fetch.js";
import type { Account } from "../wallets/interfaces/wallet.js";

const NEBULA_API_URL = "https://nebula-api.thirdweb.com";

export type Input = {
  client: ThirdwebClient;
  prompt: string | string[];
  account?: Account;
  context?: {
    chains?: Chain[];
    walletAddresses?: string[];
    contractAddresses?: string[];
  };
  sessionId?: string;
};

export type Output = {
  message: string;
  sessionId: string;
  transactions: PreparedTransaction[];
};

type ApiResponse = {
  message: string;
  session_id: string;
  actions?: {
    type: "init" | "presence" | "sign_transaction";
    source: string;
    data: string;
  }[];
};

export async function nebulaFetch(
  mode: "execute" | "chat",
  input: Input,
): Promise<Output> {
  const fetch = getClientFetch(input.client);
  const response = await fetch(`${NEBULA_API_URL}/${mode}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: input.prompt, // TODO: support array of messages
      session_id: input.sessionId,
      ...(input.account
        ? {
            execute_config: {
              mode: "client",
              signer_wallet_address: input.account.address,
            },
          }
        : {}),
      ...(input.context
        ? {
            context_filter: {
              chain_ids:
                input.context.chains?.map((c) => c.id.toString()) || [],
              signer_wallet_address: input.context.walletAddresses || [],
              contract_addresses: input.context.contractAddresses || [],
            },
          }
        : {}),
    }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Nebula API error: ${error}`);
  }
  const data = (await response.json()) as ApiResponse;

  // parse transactions if present
  let transactions: PreparedTransaction[] = [];
  if (data.actions) {
    transactions = data.actions.map((action) => {
      const tx = JSON.parse(action.data) as {
        chainId: number;
        to: Address | undefined;
        value: Hex;
        data: Hex;
      };
      return prepareTransaction({
        chain: getCachedChain(tx.chainId),
        client: input.client,
        to: tx.to,
        value: tx.value ? toBigInt(tx.value) : undefined,
        data: tx.data,
      });
    });
  }

  return {
    message: data.message,
    sessionId: data.session_id,
    transactions,
  };
}
