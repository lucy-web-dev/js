import { webLocalStorage } from "../../utils/storage/webStorage.js";
import { createWallet } from "../create-wallet.js";
import { getDefaultWallets } from "../defaultWallets.js";
import { getInstalledWalletProviders } from "../injected/mipdStore.js";
import type { Wallet } from "../interfaces/wallet.js";
import type { ConnectionManager } from "../manager/index.js";
import { autoConnectCore } from "./autoConnectCore.js";
import type { AutoConnectProps } from "./types.js";

/**
 * Attempts to automatically connect to a wallet based on the provided configuration.
 * It combines both specified wallets and installed wallet providers that aren't already specified.
 *
 * @example
 *
 * ```tsx
 * import { autoConnect } from "thirdweb/wallets";
 *
 * const walletManager = createConnectionManager();
 * const autoConnected = await autoConnect({
 *  client,
 *  walletManager,
 * });
 * ```
 *
 *
 * @param props - The auto-connect configuration properties
 * @param props.wallets - Array of wallet instances to consider for auto-connection
 * @param walletManager - The connection manager instance handling wallet connections
 * @returns {boolean} a promise resolving to true or false depending on whether the auto connect function connected to a wallet or not
 */
export const autoConnect = async (
  props: AutoConnectProps & {
    wallets: Wallet[];
    walletManager: ConnectionManager;
  },
) => {
  const wallets = props.wallets || getDefaultWallets(props);
  return autoConnectCore({
    storage: webLocalStorage,
    props: {
      ...props,
      wallets,
    },
    createWalletFn: createWallet,
    getInstalledWallets: () => {
      const specifiedWalletIds = new Set(wallets.map((x) => x.id));

      // pass the wallets that are not already specified but are installed by the user
      const installedWallets = getInstalledWalletProviders()
        .filter((x) => !specifiedWalletIds.has(x.info.rdns))
        .map((x) => createWallet(x.info.rdns));

      return installedWallets;
    },
    manager: props.walletManager,
  });
};
