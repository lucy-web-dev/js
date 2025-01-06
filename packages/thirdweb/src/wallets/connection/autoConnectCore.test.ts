import { beforeEach } from "node:test";
import { isAddress } from "ethers6";
import { describe, expect, it, vi } from "vitest";
import { MockStorage } from "~test/mocks/storage.js";
import { TEST_CLIENT } from "~test/test-clients.js";
import { TEST_ACCOUNT_A } from "~test/test-wallets.js";
import { createWalletAdapter } from "../../adapters/wallet-adapter.js";
import { ethereum } from "../../chains/chain-definitions/ethereum.js";
import { AUTH_TOKEN_LOCAL_STORAGE_NAME } from "../in-app/core/constants/settings.js";
import { getUrlToken } from "../in-app/web/lib/get-url-token.js";
import { createConnectionManager } from "../manager/index.js";
import type { WalletId } from "../wallet-types.js";
import { autoConnectCore, handleWalletConnection } from "./autoConnectCore.js";

vi.mock("../in-app/web/lib/get-url-token.ts");

describe("useAutoConnectCore", () => {
  const mockStorage = new MockStorage();
  const manager = createConnectionManager(mockStorage);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return a useQuery result", async () => {
    vi.mocked(getUrlToken).mockReturnValue({});
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
    vi.mocked(getUrlToken).mockReturnValue({});

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
    vi.mocked(getUrlToken).mockReturnValue({});

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

  it("should handle auth cookie storage correctly", async () => {
    const mockAuthCookie = "mock-auth-cookie";
    const wallet = createWalletAdapter({
      adaptedAccount: TEST_ACCOUNT_A,
      client: TEST_CLIENT,
      chain: ethereum,
      onDisconnect: () => {},
      switchChain: () => {},
    });
    vi.mocked(getUrlToken).mockReturnValue({
      authCookie: mockAuthCookie,
      walletId: wallet.id,
    });

    await autoConnectCore({
      storage: mockStorage,
      props: {
        wallets: [wallet],
        client: TEST_CLIENT,
      },
      createWalletFn: () => wallet,
      manager,
    });

    const storedCookie = await mockStorage.getItem(
      AUTH_TOKEN_LOCAL_STORAGE_NAME(TEST_CLIENT.clientId),
    );
    expect(storedCookie).toBe(mockAuthCookie);
  });

  it("should handle error when manager connection fails", async () => {
    const wallet1 = createWalletAdapter({
      adaptedAccount: TEST_ACCOUNT_A,
      client: TEST_CLIENT,
      chain: ethereum,
      onDisconnect: () => {},
      switchChain: () => {},
    });

    mockStorage.setItem("thirdweb:active-wallet-id", wallet1.id);
    mockStorage.setItem(
      "thirdweb:connected-wallet-ids",
      JSON.stringify([wallet1.id]),
    );

    const addConnectedWalletSpy = vi
      .spyOn(manager, "connect")
      .mockRejectedValue(new Error("Connection failed"));

    await autoConnectCore({
      storage: mockStorage,
      props: {
        wallets: [wallet1],
        client: TEST_CLIENT,
      },
      createWalletFn: () => wallet1,
      manager,
    });
    expect(addConnectedWalletSpy).toHaveBeenCalled();
  });

  it("should connect multiple wallets correctly", async () => {
    const wallet1 = createWalletAdapter({
      adaptedAccount: TEST_ACCOUNT_A,
      client: TEST_CLIENT,
      chain: ethereum,
      onDisconnect: () => {},
      switchChain: () => {},
    });

    const wallet2 = createWalletAdapter({
      adaptedAccount: { ...TEST_ACCOUNT_A, address: "0x123" },
      client: TEST_CLIENT,
      chain: ethereum,
      onDisconnect: () => {},
      switchChain: () => {},
    });
    wallet2.id = "io.metamask" as unknown as "adapter";

    mockStorage.setItem("thirdweb:active-wallet-id", wallet1.id);
    mockStorage.setItem(
      "thirdweb:connected-wallet-ids",
      JSON.stringify([wallet1.id, wallet2.id]),
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const addConnectedWalletSpy = vi.spyOn(manager, "addConnectedWallet");

    await autoConnectCore({
      storage: mockStorage,
      props: {
        wallets: [wallet1, wallet2],
        client: TEST_CLIENT,
      },
      createWalletFn: () => wallet1,
      manager,
    });

    expect(addConnectedWalletSpy).toHaveBeenCalledWith(wallet2);

    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      "Error auto connecting wallet:",
      "Connection failed",
    );
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
