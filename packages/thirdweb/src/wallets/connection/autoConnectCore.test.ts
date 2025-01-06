import { isAddress } from "ethers6";
import { describe, expect, it, vi } from "vitest";
import { MockStorage } from "~test/mocks/storage.js";
import { TEST_CLIENT } from "~test/test-clients.js";
import { TEST_ACCOUNT_A } from "~test/test-wallets.js";
import { createWalletAdapter } from "../../adapters/wallet-adapter.js";
import { ethereum } from "../../chains/chain-definitions/ethereum.js";
import { createConnectionManager } from "../manager/index.js";
import type { WalletId } from "../wallet-types.js";
import { autoConnectCore, handleWalletConnection } from "./autoConnectCore.js";

describe("useAutoConnectCore", () => {
  const mockStorage = new MockStorage();
  const manager = createConnectionManager(mockStorage);

  it("should return a useQuery result", async () => {
    const wallet = createWalletAdapter({
      adaptedAccount: TEST_ACCOUNT_A,
      client: TEST_CLIENT,
      chain: ethereum,
      onDisconnect: () => {},
      switchChain: () => {},
    });

    expect(
      await autoConnectCore({
        storage: mockStorage,
        props: {
          wallets: [wallet],
          client: TEST_CLIENT,
        },
        createWalletFn: (id: WalletId) =>
          createWalletAdapter({
            adaptedAccount: TEST_ACCOUNT_A,
            client: TEST_CLIENT,
            chain: ethereum,
            onDisconnect: () => {
              console.warn(id);
            },
            switchChain: () => {},
          }),
        manager,
      }),
    ).toBe(false);
  });

  it("should return `false` if there's no lastConnectedWalletIds", async () => {
    const wallet = createWalletAdapter({
      adaptedAccount: TEST_ACCOUNT_A,
      client: TEST_CLIENT,
      chain: ethereum,
      onDisconnect: () => {},
      switchChain: () => {},
    });

    expect(
      await autoConnectCore({
        storage: mockStorage,
        props: {
          wallets: [wallet],
          client: TEST_CLIENT,
        },
        createWalletFn: (id: WalletId) =>
          createWalletAdapter({
            adaptedAccount: TEST_ACCOUNT_A,
            client: TEST_CLIENT,
            chain: ethereum,
            onDisconnect: () => {
              console.warn(id);
            },
            switchChain: () => {},
          }),
        manager,
      }),
    ).toBe(false);
  });

  it("should call onTimeout on ... timeout", async () => {
    const wallet = createWalletAdapter({
      adaptedAccount: TEST_ACCOUNT_A,
      client: TEST_CLIENT,
      chain: ethereum,
      onDisconnect: () => {},
      switchChain: () => {},
    });
    mockStorage.setItem("thirdweb:active-wallet-id", wallet.id);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    // Purposefully mock the wallet.autoConnect method to test the timeout logic
    wallet.autoConnect = () =>
      new Promise((resolve) => {
        setTimeout(() => {
          // @ts-ignore Mock purpose
          resolve("Connection successful");
        }, 2100);
      });

    await autoConnectCore({
      storage: mockStorage,
      props: {
        wallets: [wallet],
        client: TEST_CLIENT,
        onTimeout: () => console.info("TIMEOUTTED"),
        timeout: 0,
      },
      createWalletFn: (id: WalletId) =>
        createWalletAdapter({
          adaptedAccount: TEST_ACCOUNT_A,
          client: TEST_CLIENT,
          chain: ethereum,
          onDisconnect: () => {
            console.warn(id);
          },
          switchChain: () => {},
        }),
      manager,
    });

    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      "AutoConnect timeout: 0ms limit exceeded.",
    );
    expect(infoSpy).toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith("TIMEOUTTED");
    warnSpy.mockRestore();
  });
});

describe("handleWalletConnection", () => {
  const wallet = createWalletAdapter({
    adaptedAccount: TEST_ACCOUNT_A,
    client: TEST_CLIENT,
    chain: ethereum,
    onDisconnect: () => {},
    switchChain: () => {},
  });
  it("should return the correct result", async () => {
    const result = await handleWalletConnection({
      client: TEST_CLIENT,
      lastConnectedChain: ethereum,
      authResult: undefined,
      wallet,
    });

    expect("address" in result).toBe(true);
    expect(isAddress(result.address)).toBe(true);
    expect("sendTransaction" in result).toBe(true);
    expect(typeof result.sendTransaction).toBe("function");
    expect("signMessage" in result).toBe(true);
    expect("signTypedData" in result).toBe(true);
    expect("signTransaction" in result).toBe(true);
  });
});
