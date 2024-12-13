"use client";
import styled from "@emotion/styled";
import {
  ChevronRightIcon,
  ExitIcon,
  PaperPlaneIcon,
  PinBottomIcon,
  PlusIcon,
  TextAlignJustifyIcon,
} from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import {
  type Dispatch,
  type JSX,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { trackPayEvent } from "../../../../analytics/track/pay.js";
import type { Chain } from "../../../../chains/types.js";
import type { ThirdwebClient } from "../../../../client/client.js";
import { getContract } from "../../../../contract/contract.js";
import type { SupportedFiatCurrency } from "../../../../pay/convert/type.js";
import { getLastAuthProvider } from "../../../../react/core/utils/storage.js";
import { shortenAddress } from "../../../../utils/address.js";
import { isContractDeployed } from "../../../../utils/bytecode/is-contract-deployed.js";
import { webLocalStorage } from "../../../../utils/storage/webStorage.js";
import { isEcosystemWallet } from "../../../../wallets/ecosystem/is-ecosystem-wallet.js";
import type { Ecosystem } from "../../../../wallets/in-app/core/wallet/types.js";
import type { Account, Wallet } from "../../../../wallets/interfaces/wallet.js";
import type { SmartWalletOptions } from "../../../../wallets/smart/types.js";
import {
  type AppMetadata,
  type SocialAuthOption,
  socialAuthOptions,
} from "../../../../wallets/types.js";
import type {
  EcosystemWalletId,
  WalletId,
} from "../../../../wallets/wallet-types.js";
import {
  CustomThemeProvider,
  parseTheme,
  useCustomTheme,
} from "../../../core/design-system/CustomThemeProvider.js";
import {
  type Theme,
  fontSize,
  iconSize,
  radius,
  spacing,
} from "../../../core/design-system/index.js";
import type {
  ConnectButtonProps,
  ConnectButton_connectModalOptions,
  ConnectButton_detailsButtonOptions,
  ConnectButton_detailsModalOptions,
  PayUIOptions,
} from "../../../core/hooks/connection/ConnectButtonProps.js";
import { useChainFaucets } from "../../../core/hooks/others/useChainQuery.js";
import { useActiveAccount } from "../../../core/hooks/wallets/useActiveAccount.js";
import { useActiveWallet } from "../../../core/hooks/wallets/useActiveWallet.js";
import { useActiveWalletChain } from "../../../core/hooks/wallets/useActiveWalletChain.js";
import { useAdminWallet } from "../../../core/hooks/wallets/useAdminWallet.js";
import { useDisconnect } from "../../../core/hooks/wallets/useDisconnect.js";
import { useSwitchActiveWalletChain } from "../../../core/hooks/wallets/useSwitchActiveWalletChain.js";
import { SetRootElementContext } from "../../../core/providers/RootElementContext.js";
import type {
  SupportedNFTs,
  SupportedTokens,
} from "../../../core/utils/defaultTokens.js";
import { hasSmartAccount } from "../../../core/utils/isSmartWallet.js";
import { useWalletInfo } from "../../../core/utils/wallet.js";
import { WalletUIStatesProvider } from "../../providers/wallet-ui-states-provider.js";
import { ChainActiveDot } from "../components/ChainActiveDot.js";
import { CopyIcon } from "../components/CopyIcon.js";
import { IconContainer } from "../components/IconContainer.js";
import { Modal } from "../components/Modal.js";
import { Skeleton } from "../components/Skeleton.js";
import { Spacer } from "../components/Spacer.js";
import { Spinner } from "../components/Spinner.js";
import { ToolTip } from "../components/Tooltip.js";
import { WalletImage } from "../components/WalletImage.js";
import { Container, Line } from "../components/basic.js";
import { Button, IconButton } from "../components/buttons.js";
import { fallbackChainIcon } from "../components/fallbackChainIcon.js";
import { Link, Text } from "../components/text.js";
import { fadeInAnimation } from "../design-system/animations.js";
import { StyledButton } from "../design-system/elements.js";
import { AccountAddress } from "../prebuilt/Account/address.js";
import { AccountAvatar } from "../prebuilt/Account/avatar.js";
import {
  AccountBalance,
  type AccountBalanceInfo,
  formatAccountFiatBalance,
  formatAccountTokenBalance,
} from "../prebuilt/Account/balance.js";
import { AccountBlobbie } from "../prebuilt/Account/blobbie.js";
import { AccountName } from "../prebuilt/Account/name.js";
import { AccountProvider } from "../prebuilt/Account/provider.js";
import { ChainIcon } from "../prebuilt/Chain/icon.js";
import { ChainName } from "../prebuilt/Chain/name.js";
import { ChainProvider } from "../prebuilt/Chain/provider.js";
import type { LocaleId } from "../types.js";
import { MenuButton, MenuLink } from "./MenuButton.js";
import { ScreenSetupContext, useSetupScreen } from "./Modal/screen.js";
import {
  NetworkSelectorContent,
  type NetworkSelectorProps,
} from "./NetworkSelector.js";
import { TransactionsScreen } from "./TransactionsScreen.js";
import { onModalUnmount } from "./constants.js";
import { CoinsIcon } from "./icons/CoinsIcon.js";
import { FundsIcon } from "./icons/FundsIcon.js";
import { OutlineWalletIcon } from "./icons/OutlineWalletIcon.js";
import { getConnectLocale } from "./locale/getConnectLocale.js";
import type { ConnectLocale } from "./locale/types.js";
import { LazyBuyScreen } from "./screens/Buy/LazyBuyScreen.js";
import { WalletManagerScreen } from "./screens/Details/WalletManagerScreen.js";
import { LinkProfileScreen } from "./screens/LinkProfileScreen.js";
import { LinkedProfilesScreen } from "./screens/LinkedProfilesScreen.js";
import { ManageWalletScreen } from "./screens/ManageWalletScreen.js";
import { PrivateKey } from "./screens/PrivateKey.js";
import { ReceiveFunds } from "./screens/ReceiveFunds.js";
import { SendFunds } from "./screens/SendFunds.js";
import { type AssetTabs, ViewAssets } from "./screens/ViewAssets.js";
import { ViewNFTs } from "./screens/ViewNFTs.js";
import { ViewTokens } from "./screens/ViewTokens.js";
import { WalletConnectReceiverScreen } from "./screens/WalletConnectReceiverScreen.js";
import type { WalletDetailsModalScreen } from "./screens/types.js";

const TW_CONNECTED_WALLET = "tw-connected-wallet";

const LocalhostChainId = 1337;

/**
 * @internal
 */
export const ConnectedWalletDetails: React.FC<{
  onDisconnect: (info: {
    wallet: Wallet;
    account: Account;
  }) => void;
  detailsButton?: ConnectButton_detailsButtonOptions;
  detailsModal?: ConnectButton_detailsModalOptions;
  theme: "light" | "dark" | Theme;
  supportedTokens?: SupportedTokens;
  supportedNFTs?: SupportedNFTs;
  chains: Chain[];
  chain?: Chain;
  switchButton: ConnectButtonProps["switchButton"];
  connectLocale: ConnectLocale;
  client: ThirdwebClient;
  connectOptions: DetailsModalConnectOptions | undefined;
}> = (props) => {
  const { connectLocale: locale, client } = props;
  const setRootEl = useContext(SetRootElementContext);
  const walletChain = useActiveWalletChain();

  function closeModal() {
    setRootEl(null);
  }

  function openModal() {
    setRootEl(
      <DetailsModal
        client={client}
        locale={locale}
        detailsModal={props.detailsModal}
        theme={props.theme}
        supportedTokens={props.supportedTokens}
        supportedNFTs={props.supportedNFTs}
        closeModal={closeModal}
        onDisconnect={props.onDisconnect}
        chains={props.chains}
        displayBalanceToken={props.detailsButton?.displayBalanceToken}
        connectOptions={props.connectOptions}
        assetTabs={props.detailsModal?.assetTabs}
      />,
    );
  }

  const isNetworkMismatch =
    props.chain && walletChain && walletChain.id !== props.chain.id;

  if (props.detailsButton?.render) {
    return (
      // biome-ignore lint/a11y/useKeyWithClickEvents: ok
      <div onClick={openModal}>
        <props.detailsButton.render />
      </div>
    );
  }

  if (props.chain && isNetworkMismatch) {
    return (
      <SwitchNetworkButton
        style={props.switchButton?.style}
        className={props.switchButton?.className}
        switchNetworkBtnTitle={props.switchButton?.label}
        targetChain={props.chain}
        connectLocale={locale}
      />
    );
  }

  const combinedClassName = `${TW_CONNECTED_WALLET} ${props.detailsButton?.className || ""}`;

  const tokenAddress =
    props.detailsButton?.displayBalanceToken?.[Number(walletChain?.id)];

  return (
    <WalletInfoButton
      type="button"
      className={combinedClassName}
      style={props.detailsButton?.style}
      data-test="connected-wallet-details"
      onClick={openModal}
    >
      <Container
        style={{
          borderRadius: "100%",
          overflow: "hidden",
          width: "35px",
          height: "35px",
        }}
      >
        {props.detailsButton?.connectedAccountAvatarUrl ? (
          <img
            alt=""
            src={props.detailsButton.connectedAccountAvatarUrl}
            style={{
              height: "100%",
              width: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <AccountAvatar
            className={`${TW_CONNECTED_WALLET}__account_avatar`}
            loadingComponent={
              <AccountBlobbie
                size={35}
                className={`${TW_CONNECTED_WALLET}__account_avatar`}
              />
            }
            fallbackComponent={
              <AccountBlobbie
                size={35}
                className={`${TW_CONNECTED_WALLET}__account_avatar`}
              />
            }
            queryOptions={{
              refetchOnWindowFocus: false,
              refetchOnMount: false,
            }}
            style={{
              height: "100%",
              width: "100%",
              objectFit: "cover",
            }}
          />
        )}
      </Container>
      <Container
        flex="column"
        gap="4xs"
        style={{
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          borderRadius: `0 ${radius.md} ${radius.md} 0`,
        }}
      >
        {/* Address */}
        {props.detailsButton?.connectedAccountName ? (
          <Text
            size="xs"
            color="primaryText"
            weight={500}
            className={`${TW_CONNECTED_WALLET}__address`}
          >
            {props.detailsButton.connectedAccountName}
          </Text>
        ) : (
          <Text
            size="xs"
            color="primaryText"
            weight={500}
            className={`${TW_CONNECTED_WALLET}__address`}
          >
            <AccountName
              loadingComponent={<AccountAddress formatFn={shortenAddress} />}
              fallbackComponent={<AccountAddress formatFn={shortenAddress} />}
            />
          </Text>
        )}

        <Text
          className={`${TW_CONNECTED_WALLET}__balance`}
          size="xs"
          color="secondaryText"
          weight={400}
          style={{
            display: "flex",
            gap: "2px",
            alignItems: "center",
          }}
        >
          {props.detailsButton?.showBalanceInFiat ? (
            <>
              <AccountBalance
                chain={walletChain}
                loadingComponent={
                  <Skeleton height={fontSize.xs} width="50px" />
                }
                fallbackComponent={
                  <Skeleton height={fontSize.xs} width="50px" />
                }
                tokenAddress={tokenAddress}
              />
              <AccountBalance
                chain={walletChain}
                tokenAddress={tokenAddress}
                showBalanceInFiat="USD"
                formatFn={detailsBtn_formatFiatBalanceForButton}
                loadingComponent={
                  <Skeleton height={fontSize.xs} width="20px" />
                }
              />
            </>
          ) : (
            <AccountBalance
              chain={walletChain}
              loadingComponent={<Skeleton height={fontSize.xs} width="70px" />}
              fallbackComponent={<Skeleton height={fontSize.xs} width="70px" />}
              formatFn={detailsBtn_formatTokenBalanceForButton}
              tokenAddress={tokenAddress}
            />
          )}
        </Text>
      </Container>
    </WalletInfoButton>
  );
};

/**
 * @internal Exported for tests
 */
export function detailsBtn_formatFiatBalanceForButton(
  props: AccountBalanceInfo,
) {
  return ` (${formatAccountFiatBalance({ ...props, decimals: 0 })})`;
}

/**
 * @internal Exported for test
 */
export function detailsBtn_formatTokenBalanceForButton(
  props: AccountBalanceInfo,
) {
  return `${formatAccountTokenBalance({ ...props, decimals: props.balance < 1 ? 5 : 4 })}`;
}

/**
 * @internal Exported for tests only
 */
export function DetailsModal(props: {
  client: ThirdwebClient;
  locale: ConnectLocale;
  detailsModal?: ConnectButton_detailsModalOptions;
  theme: "light" | "dark" | Theme;
  supportedTokens?: SupportedTokens;
  supportedNFTs?: SupportedNFTs;
  closeModal: () => void;
  onDisconnect: (info: {
    wallet: Wallet;
    account: Account;
  }) => void;
  chains: Chain[];
  displayBalanceToken?: Record<number, string>;
  connectOptions: DetailsModalConnectOptions | undefined;
  assetTabs?: AssetTabs[];
  showBalanceInFiat?: SupportedFiatCurrency;
}) {
  const [screen, setScreen] = useState<WalletDetailsModalScreen>("main");
  const { disconnect } = useDisconnect();
  const [isOpen, setIsOpen] = useState(true);

  const { client, locale } = props;
  const walletChain = useActiveWalletChain();
  const activeAccount = useActiveAccount();
  const theme = parseTheme(props.theme);

  const activeWallet = useActiveWallet();
  const chainFaucetsQuery = useChainFaucets(walletChain);

  const disableSwitchChain = !activeWallet?.switchChain;

  const screenSetup = useSetupScreen({
    size: "compact",
    welcomeScreen: undefined,
    wallets: activeWallet ? [activeWallet] : [],
  });

  const closeModal = useCallback(() => {
    setIsOpen(false);
    onModalUnmount(() => {
      props.closeModal();
    });
  }, [props.closeModal]);

  function handleDisconnect(info: { wallet: Wallet; account: Account }) {
    setIsOpen(false);
    props.closeModal();
    props.onDisconnect(info);
  }

  useEffect(() => {
    if (!activeAccount) {
      closeModal();
    }
  }, [activeAccount, closeModal]);

  const { hideSendFunds, hideReceiveFunds, hideBuyFunds } =
    props.detailsModal || {};

  const hideAllButtons = hideSendFunds && hideReceiveFunds && hideBuyFunds;

  const avatarContent = (
    <Container
      style={{
        position: "relative",
        height: `${iconSize.xl}px`,
        width: `${iconSize.xl}px`,
      }}
    >
      <Container
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "100%",
          overflow: "hidden",
        }}
      >
        {props.detailsModal?.connectedAccountAvatarUrl ? (
          <img
            src={props.detailsModal.connectedAccountAvatarUrl}
            style={{
              height: "100%",
              width: "100%",
              objectFit: "cover",
            }}
            alt=""
          />
        ) : (
          activeAccount && (
            <AccountAvatar
              loadingComponent={<AccountBlobbie size={Number(iconSize.xxl)} />}
              fallbackComponent={<AccountBlobbie size={Number(iconSize.xxl)} />}
              style={{
                height: "100%",
                width: "100%",
                objectFit: "cover",
              }}
            />
          )
        )}
      </Container>
      {!props.detailsModal?.hideSwitchWallet ? (
        <Container
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
          }}
        >
          <IconContainer
            style={{
              background: theme.colors.modalBg,
            }}
            padding="4px"
          >
            {activeWallet && (
              <WalletImage
                style={{ borderRadius: 0 }}
                id={activeWallet.id}
                client={client}
                size="12"
              />
            )}
          </IconContainer>
        </Container>
      ) : null}
    </Container>
  );

  let content = (
    <div className={`${TW_CONNECTED_WALLET}__default_modal_screen`}>
      <Spacer y="xs" />
      <Container
        px="lg"
        gap="sm"
        flex="row"
        center="y"
        style={{
          paddingTop: spacing.lg,
          paddingBottom: hideAllButtons ? spacing.md : spacing.lg,
        }}
      >
        {props.detailsModal?.hideSwitchWallet ? (
          avatarContent
        ) : (
          <ToolTip tip="Switch wallet">
            <div
              style={{
                cursor: "pointer",
              }}
              onKeyDown={(e) => {
                if (e.key === "w") {
                  setScreen("wallet-manager");
                }
              }}
              onClick={() => {
                setScreen("wallet-manager");
              }}
            >
              {avatarContent}
            </div>
          </ToolTip>
        )}
        <Container flex="column" gap="3xs">
          <div
            style={{
              display: "flex",
              gap: spacing.xxs,
              alignItems: "center",
            }}
          >
            {props.detailsModal?.connectedAccountName ? (
              <Text color="primaryText" weight={500} size="md">
                {props.detailsModal.connectedAccountName}
              </Text>
            ) : (
              <Text color="primaryText" weight={500} size="md">
                <AccountName
                  loadingComponent={
                    <AccountAddress formatFn={shortenAddress} />
                  }
                  fallbackComponent={
                    <AccountAddress formatFn={shortenAddress} />
                  }
                />
              </Text>
            )}
            <IconButton>
              <CopyIcon
                text={activeAccount?.address || ""}
                tip={locale.copyAddress}
              />
            </IconButton>
          </div>
          <InAppWalletUserInfo client={client} locale={locale} />
        </Container>
      </Container>

      {!hideAllButtons && (
        <>
          <Container px="lg">
            {/* Send, Receive, Swap */}
            <Container
              style={{
                display: "flex",
                gap: spacing.xs,
              }}
            >
              {!hideSendFunds && (
                <Button
                  variant="outline"
                  style={{
                    fontSize: fontSize.sm,
                    display: "flex",
                    gap: spacing.xs,
                    alignItems: "center",
                    padding: spacing.sm,
                    flex: 1,
                  }}
                  onClick={() => {
                    setScreen("send");
                  }}
                >
                  <Container color="secondaryText" flex="row" center="both">
                    <PaperPlaneIcon
                      width={iconSize.sm}
                      height={iconSize.sm}
                      style={{
                        transform: "translateY(-10%) rotate(-45deg) ",
                      }}
                    />
                  </Container>

                  {locale.send}
                </Button>
              )}

              {!hideReceiveFunds && (
                <Button
                  variant="outline"
                  style={{
                    fontSize: fontSize.sm,
                    display: "flex",
                    gap: spacing.xs,
                    alignItems: "center",
                    padding: spacing.sm,
                    flex: 1,
                  }}
                  onClick={() => {
                    setScreen("receive");
                  }}
                >
                  <Container color="secondaryText" flex="row" center="both">
                    <PinBottomIcon width={iconSize.sm} height={iconSize.sm} />
                  </Container>
                  {locale.receive}
                </Button>
              )}

              {!hideBuyFunds && (
                <Button
                  variant="outline"
                  style={{
                    fontSize: fontSize.sm,
                    display: "flex",
                    gap: spacing.xs,
                    alignItems: "center",
                    padding: spacing.sm,
                    flex: 1,
                  }}
                  onClick={() => {
                    trackPayEvent({
                      event: "details_modal_buy_click",
                      client: client,
                      walletAddress: activeAccount?.address,
                      walletType: activeWallet?.id,
                    });
                    setScreen("buy");
                  }}
                >
                  <Container color="secondaryText" flex="row" center="both">
                    <PlusIcon width={iconSize.sm} height={iconSize.sm} />
                  </Container>
                  {locale.buy}
                </Button>
              )}
            </Container>
          </Container>

          <Spacer y="md" />
        </>
      )}

      <Container px="md">
        <Container
          flex="column"
          style={{
            gap: "1px",
          }}
        >
          {/* Network Switcher */}
          <NetworkSwitcherButton
            client={props.client}
            setScreen={() => setScreen("network-switcher")}
            disableSwitchChain={disableSwitchChain}
            showBalanceInFiat={props.detailsModal?.showBalanceInFiat}
            displayBalanceToken={props.displayBalanceToken}
          />

          {/* Transactions */}
          <MenuButton
            onClick={() => {
              setScreen("transactions");
            }}
            style={{
              fontSize: fontSize.sm,
            }}
          >
            <TextAlignJustifyIcon width={iconSize.md} height={iconSize.md} />
            <Container flex="row" gap="xs" center="y">
              <Text color="primaryText">{locale.transactions}</Text>
            </Container>
          </MenuButton>

          {/* View Funds */}
          {/* Hide the View Funds button if the assetTabs props is set to an empty array */}
          {(props.assetTabs === undefined || props.assetTabs.length > 0) && (
            <MenuButton
              onClick={() => {
                setScreen("view-assets");
              }}
              style={{
                fontSize: fontSize.sm,
              }}
            >
              <CoinsIcon size={iconSize.md} />
              <Text color="primaryText">
                {props.supportedNFTs
                  ? locale.viewFunds.viewAssets
                  : locale.viewFunds.title}
              </Text>
            </MenuButton>
          )}

          {/* Manage Wallet */}
          <MenuButton
            onClick={() => {
              setScreen("manage-wallet");
            }}
            style={{
              fontSize: fontSize.sm,
            }}
          >
            <OutlineWalletIcon size={iconSize.md} />
            <Text color="primaryText">{props.locale.manageWallet.title}</Text>
          </MenuButton>

          {/* Request Testnet funds */}
          {(props.detailsModal?.showTestnetFaucet ?? false) &&
            (chainFaucetsQuery.faucets.length > 0 ||
              walletChain?.id === LocalhostChainId) && (
              <MenuLink
                href={
                  chainFaucetsQuery.faucets ? chainFaucetsQuery.faucets[0] : "#"
                }
                target="_blank"
                as="a"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <Container flex="row" center="both" color="secondaryText">
                  <FundsIcon size={iconSize.md} />
                </Container>
                {locale.requestTestnetFunds}
              </MenuLink>
            )}

          {props.detailsModal?.footer && (
            <props.detailsModal.footer close={closeModal} />
          )}
        </Container>

        <Spacer y="md" />
      </Container>
      {props.detailsModal?.hideDisconnect !== true && (
        <Container>
          <Line />
          <Spacer y="sm" />
          <Container px="md">
            <MenuButton
              data-variant="danger"
              type="button"
              onClick={() => {
                if (activeWallet && activeAccount) {
                  disconnect(activeWallet);
                  handleDisconnect({
                    account: activeAccount,
                    wallet: activeWallet,
                  });
                }
              }}
            >
              <ExitIcon width={iconSize.md} height={iconSize.md} />
              <Text color="primaryText">{locale.disconnectWallet}</Text>
            </MenuButton>
          </Container>
          <Spacer y="sm" />
        </Container>
      )}
    </div>
  );

  if (screen === "transactions") {
    content = (
      <TransactionsScreen
        title={locale.buy}
        onBack={() => setScreen("main")}
        closeModal={closeModal}
        locale={locale}
        setScreen={setScreen}
        client={client}
      />
    );
  }

  if (
    screen === "wallet-manager" &&
    activeAccount &&
    walletChain &&
    activeWallet
  ) {
    content = (
      <WalletManagerScreen
        onBack={() => setScreen("main")}
        accountAbstraction={props.connectOptions?.accountAbstraction}
        appMetadata={props.connectOptions?.appMetadata}
        chain={props.connectOptions?.chain}
        chains={props.connectOptions?.chains}
        client={client}
        hiddenWallets={props.connectOptions?.hiddenWallets}
        connectLocale={locale}
        recommendedWallets={props.connectOptions?.recommendedWallets}
        showAllWallets={!!props.connectOptions?.showAllWallets}
        walletConnect={props.connectOptions?.walletConnect}
        wallets={props.connectOptions?.wallets}
        activeAccount={activeAccount}
        activeChain={walletChain}
        activeWallet={activeWallet}
      />
    );
  }

  if (screen === "network-switcher") {
    content = (
      <NetworkSelectorContent
        // add currently connected chain to the list of chains if it's not already in the list
        chains={
          walletChain &&
          props.chains.find((c) => c.id === walletChain.id) === undefined
            ? [walletChain, ...props.chains]
            : props.chains
        }
        closeModal={closeModal}
        networkSelector={props.detailsModal?.networkSelector}
        onBack={() => {
          setScreen("main");
        }}
        connectLocale={locale}
        client={client}
      />
    );
  } else if (screen === "view-assets") {
    if (props.supportedNFTs) {
      content = (
        <ViewAssets
          supportedTokens={props.supportedTokens}
          supportedNFTs={props.supportedNFTs}
          onBack={() => {
            setScreen("main");
          }}
          theme={props.theme}
          setScreen={setScreen}
          client={client}
          connectLocale={locale}
          assetTabs={props.detailsModal?.assetTabs}
        />
      );
    } else {
      // Always show tokens (has the native token at least)
      content = (
        <ViewTokens
          supportedTokens={props.supportedTokens}
          onBack={() => {
            setScreen("main");
          }}
          client={client}
          connectLocale={locale}
        />
      );
    }
  } else if (screen === "view-nfts") {
    content = (
      <ViewNFTs
        theme={props.theme}
        supportedNFTs={props.supportedNFTs}
        onBack={() => {
          setScreen("main");
        }}
        client={client}
        connectLocale={locale}
      />
    );
  } else if (screen === "view-tokens") {
    content = (
      <ViewTokens
        supportedTokens={props.supportedTokens}
        onBack={() => {
          setScreen("main");
        }}
        client={client}
        connectLocale={locale}
      />
    );
  } else if (screen === "private-key") {
    content = (
      <PrivateKey
        theme={props.theme} // do not use the useCustomTheme hook to get this, it's not valid here
        onBack={() => {
          setScreen("manage-wallet");
        }}
        wallet={activeWallet}
        client={client}
        connectLocale={locale}
      />
    );
  } else if (screen === "manage-wallet") {
    content = (
      <ManageWalletScreen
        onBack={() => {
          setScreen("main");
        }}
        locale={locale}
        closeModal={closeModal}
        client={client}
        setScreen={setScreen}
      />
    );
  } else if (screen === "wallet-connect-receiver") {
    content = (
      <WalletConnectReceiverScreen
        onBack={() => {
          setScreen("manage-wallet");
        }}
        chains={props.chains}
        client={client}
      />
    );
  } else if (screen === "linked-profiles") {
    content = (
      <LinkedProfilesScreen
        onBack={() => setScreen("manage-wallet")}
        client={client}
        locale={locale}
        setScreen={setScreen}
      />
    );
  } else if (screen === "link-profile") {
    content = (
      <LinkProfileScreen
        onBack={() => {
          setScreen("linked-profiles");
        }}
        client={client}
        locale={locale}
        walletConnect={props.connectOptions?.walletConnect}
      />
    );
  }

  // send funds
  else if (screen === "send") {
    content = (
      <SendFunds
        supportedTokens={props.supportedTokens}
        onBack={() => {
          setScreen("main");
        }}
        client={client}
        connectLocale={locale}
      />
    );
  }

  // receive funds
  else if (screen === "receive") {
    content = (
      <ReceiveFunds
        walletId={activeWallet?.id}
        onBack={() => {
          setScreen("main");
        }}
        client={client}
        connectLocale={locale}
      />
    );
  }

  // thirdweb pay
  else if (screen === "buy") {
    content = (
      <LazyBuyScreen
        title={locale.buy}
        isEmbed={false}
        client={client}
        onBack={() => setScreen("main")}
        supportedTokens={props.supportedTokens}
        connectLocale={locale}
        payOptions={
          props.detailsModal?.payOptions || {
            mode: "fund_wallet",
          }
        }
        hiddenWallets={props.detailsModal?.hiddenWallets}
        theme={typeof props.theme === "string" ? props.theme : props.theme.type}
        onDone={closeModal}
        connectOptions={undefined}
      />
    );
  }

  return (
    <CustomThemeProvider theme={props.theme}>
      <WalletUIStatesProvider theme={props.theme} isOpen={false}>
        <ScreenSetupContext.Provider value={screenSetup}>
          <Modal
            size="compact"
            open={isOpen}
            setOpen={(_open) => {
              if (!_open) {
                closeModal();
              }
            }}
          >
            {activeAccount?.address && (
              <AccountProvider address={activeAccount.address} client={client}>
                {content}
              </AccountProvider>
            )}
          </Modal>
        </ScreenSetupContext.Provider>
      </WalletUIStatesProvider>
    </CustomThemeProvider>
  );
}

/**
 * When this button is clicked, it will switch to the screen where users
 * can select a chain to switch to.
 * @internal
 */
function NetworkSwitcherButton(props: {
  setScreen: Dispatch<SetStateAction<"network-switcher">>;
  disableSwitchChain: boolean;
  displayBalanceToken: Record<number, string> | undefined;
  client: ThirdwebClient;
  showBalanceInFiat?: SupportedFiatCurrency;
}) {
  const { disableSwitchChain, setScreen, showBalanceInFiat, client } = props;
  const walletChain = useActiveWalletChain();
  if (!walletChain) {
    return null;
  }
  return (
    <MenuButton
      type="button"
      disabled={disableSwitchChain}
      onClick={() => {
        setScreen("network-switcher");
      }}
      data-variant="primary"
    >
      <ChainProvider chain={walletChain}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            position: "relative",
          }}
        >
          <Container
            style={{
              position: "relative",
              display: "flex",
              flexShrink: 0,
              alignItems: "center",
            }}
          >
            <ChainIcon
              client={client}
              loadingComponent={
                <Skeleton
                  height={`${iconSize.md}px`}
                  width={`${iconSize.md}px`}
                />
              }
              fallbackComponent={
                <img
                  src={fallbackChainIcon}
                  alt=""
                  style={{
                    width: `${iconSize.md}px`,
                    height: `${iconSize.md}px`,
                  }}
                />
              }
              style={{
                width: `${iconSize.md}px`,
                height: `${iconSize.md}px`,
              }}
            />
            <ChainActiveDot />
          </Container>
        </div>

        <Text color="primaryText" size="md" multiline>
          <ChainName
            loadingComponent={<Skeleton height="16px" width="150px" />}
            fallbackComponent={<span>Unknown chain #{walletChain?.id}</span>}
          />
          <Text color="secondaryText" size="xs">
            {showBalanceInFiat ? (
              <>
                <AccountBalance
                  fallbackComponent={<Skeleton height="1em" width="70px" />}
                  loadingComponent={<Skeleton height="1em" width="70px" />}
                  chain={walletChain}
                  tokenAddress={
                    props.displayBalanceToken?.[Number(walletChain?.id)]
                  }
                  formatFn={(props: AccountBalanceInfo) =>
                    formatAccountTokenBalance({ ...props, decimals: 7 })
                  }
                />{" "}
                <AccountBalance
                  loadingComponent={<Skeleton height="1em" width="30px" />}
                  chain={walletChain}
                  tokenAddress={
                    props.displayBalanceToken?.[Number(walletChain?.id)]
                  }
                  formatFn={(props: AccountBalanceInfo) =>
                    ` (${formatAccountFiatBalance({ ...props, decimals: 3 })})`
                  }
                  showBalanceInFiat="USD"
                />
              </>
            ) : (
              <AccountBalance
                fallbackComponent={<Skeleton height="1em" width="100px" />}
                loadingComponent={<Skeleton height="1em" width="100px" />}
                formatFn={(props: AccountBalanceInfo) =>
                  formatAccountTokenBalance({ ...props, decimals: 7 })
                }
                chain={walletChain}
                tokenAddress={
                  props.displayBalanceToken?.[Number(walletChain?.id)]
                }
              />
            )}
          </Text>
        </Text>
      </ChainProvider>

      <StyledChevronRightIcon
        width={iconSize.sm}
        height={iconSize.sm}
        style={{
          flexShrink: 0,
          marginLeft: "auto",
        }}
      />
    </MenuButton>
  );
}

const WalletInfoButton = /* @__PURE__ */ StyledButton((_) => {
  const theme = useCustomTheme();
  return {
    all: "unset",
    background: theme.colors.connectedButtonBg,
    overflow: "hidden",
    borderRadius: radius.md,
    cursor: "pointer",
    display: "inline-flex",
    gap: spacing.xs,
    padding: spacing.xs,
    alignItems: "center",
    minWidth: "165px",
    height: "50px",
    boxSizing: "border-box",
    border: `1px solid ${theme.colors.borderColor}`,
    WebkitTapHighlightColor: "transparent",
    lineHeight: "normal",
    animation: `${fadeInAnimation} 300ms ease`,
    "&:hover": {
      transition: "background 250ms ease",
      background: theme.colors.connectedButtonBgHover,
    },
  };
});

const StyledChevronRightIcon = /* @__PURE__ */ styled(
  /* @__PURE__ */ ChevronRightIcon,
)(() => {
  const theme = useCustomTheme();
  return {
    color: theme.colors.secondaryText,
  };
});

/**
 * @internal Exported for test
 */
export function ConnectedToSmartWallet(props: {
  client: ThirdwebClient;
  connectLocale: ConnectLocale;
}) {
  const activeAccount = useActiveAccount();
  const activeWallet = useActiveWallet();
  const isSmartWallet = hasSmartAccount(activeWallet);
  const chain = useActiveWalletChain();
  const { client, connectLocale: locale } = props;

  const [isSmartWalletDeployed, setIsSmartWalletDeployed] = useState(false);

  useEffect(() => {
    if (activeAccount && isSmartWallet && activeAccount.address && chain) {
      const contract = getContract({
        address: activeAccount.address,
        chain,
        client,
      });

      isContractDeployed(contract).then((isDeployed) => {
        setIsSmartWalletDeployed(isDeployed);
      });
    } else {
      setIsSmartWalletDeployed(false);
    }
  }, [activeAccount, chain, client, isSmartWallet]);

  const content = (
    <Container flex="row" gap="3xs" center="y">
      <Text size="xs" weight={400} color="secondaryText">
        {locale.connectedToSmartWallet}
      </Text>
    </Container>
  );

  if (chain && activeAccount && isSmartWallet) {
    return (
      <>
        {isSmartWalletDeployed ? (
          <Link
            color="secondaryText"
            hoverColor="primaryText"
            href={`https://thirdweb.com/${chain.id}/${activeAccount.address}/account`}
            target="_blank"
            size="sm"
          >
            {content}
          </Link>
        ) : (
          <Text size="sm"> {content}</Text>
        )}
      </>
    );
  }

  return null;
}

/**
 * @internal Exported for tests
 */
export function InAppWalletUserInfo(props: {
  client: ThirdwebClient;
  locale: ConnectLocale;
}) {
  const { client, locale } = props;
  const account = useActiveAccount();
  const activeWallet = useActiveWallet();
  const adminWallet = useAdminWallet();
  const { data: walletInfo } = useWalletInfo(activeWallet?.id);
  const isSmartWallet = hasSmartAccount(activeWallet);
  const { data: walletName } = useQuery({
    queryKey: [
      "wallet-name",
      { walletId: activeWallet?.id, walletAddress: account?.address },
    ],
    queryFn: async () => {
      const lastAuthProvider = await getLastAuthProvider(webLocalStorage);
      if (lastAuthProvider === "guest") {
        return "Guest";
      }
      if (
        lastAuthProvider &&
        (activeWallet?.id === "inApp" || activeWallet?.id === "smart") &&
        socialAuthOptions.includes(lastAuthProvider as SocialAuthOption)
      ) {
        return (
          lastAuthProvider.slice(0, 1).toUpperCase() + lastAuthProvider.slice(1)
        );
      }
      return walletInfo?.name;
    },
    enabled: !!activeWallet?.id && !!walletInfo,
  });

  const userInfoQuery = useQuery({
    queryKey: ["in-app-wallet-user", client, account?.address],
    queryFn: async () => {
      const isInAppWallet =
        adminWallet &&
        (adminWallet.id === "inApp" || adminWallet.id.startsWith("ecosystem."));

      if (!isInAppWallet) {
        return null;
      }

      let ecosystem: Ecosystem | undefined;
      if (isEcosystemWallet(adminWallet)) {
        const ecosystemWallet = adminWallet as Wallet<EcosystemWalletId>;
        const partnerId = ecosystemWallet.getConfig()?.partnerId;
        ecosystem = {
          id: ecosystemWallet.id,
          partnerId,
        };
      }

      const { getUserEmail, getUserPhoneNumber } = await import(
        "../../../../wallets/in-app/web/lib/auth/index.js"
      );

      const [email, phone] = await Promise.all([
        getUserEmail({
          client: client,
          ecosystem,
        }),
        getUserPhoneNumber({
          client: client,
          ecosystem,
        }),
      ]);

      return email || phone || null;
    },
    enabled: !!adminWallet,
  });

  if (!userInfoQuery.data && isSmartWallet) {
    return <ConnectedToSmartWallet client={client} connectLocale={locale} />;
  }

  if (userInfoQuery.data || walletName) {
    return (
      <Text size="xs" weight={400}>
        {userInfoQuery.data || walletName}
      </Text>
    );
  }

  return (
    <Skeleton
      width="50px"
      height="10px"
      className="InAppWalletUserInfo__skeleton"
    />
  );
}

/**
 * @internal Exported for tests
 */
export function SwitchNetworkButton(props: {
  style?: React.CSSProperties;
  className?: string;
  switchNetworkBtnTitle?: string;
  targetChain: Chain;
  connectLocale: ConnectLocale;
}) {
  const switchChain = useSwitchActiveWalletChain();
  const [switching, setSwitching] = useState(false);
  const locale = props.connectLocale;

  const switchNetworkBtnTitle =
    props.switchNetworkBtnTitle ?? locale.switchNetwork;

  return (
    <Button
      className={`tw-connect-wallet--switch-network ${props.className || ""}`}
      variant="primary"
      type="button"
      data-is-loading={switching}
      data-test="switch-network-button"
      disabled={switching}
      onClick={async () => {
        setSwitching(true);
        try {
          await switchChain(props.targetChain);
        } catch (e) {
          console.error(e);
        }
        setSwitching(false);
      }}
      style={{
        minWidth: "140px",
        ...props.style,
      }}
      aria-label={switching ? locale.switchingNetwork : undefined}
    >
      {switching ? (
        <Spinner size="sm" color="primaryButtonText" />
      ) : (
        switchNetworkBtnTitle
      )}
    </Button>
  );
}

type DetailsModalConnectOptions = {
  connectModal?: ConnectButton_connectModalOptions;
  walletConnect?: {
    projectId?: string;
  };
  accountAbstraction?: SmartWalletOptions;
  wallets?: Wallet[];
  appMetadata?: AppMetadata;
  chain?: Chain;
  chains?: Chain[];
  recommendedWallets?: Wallet[];
  hiddenWallets?: WalletId[];
  showAllWallets?: boolean;
};

export type UseWalletDetailsModalOptions = {
  /**
   * A client is the entry point to the thirdweb SDK.
   * It is required for all other actions.
   * You can create a client using the `createThirdwebClient` function. Refer to the [Creating a Client](https://portal.thirdweb.com/typescript/v5/client) documentation for more information.
   *
   * You must provide a `clientId` or `secretKey` in order to initialize a client. Pass `clientId` if you want for client-side usage and `secretKey` for server-side usage.
   *
   * ```tsx
   * import { createThirdwebClient } from "thirdweb";
   *
   * const client = createThirdwebClient({
   *  clientId: "<your_client_id>",
   * })
   * ```
   */
  client: ThirdwebClient;
  /**
   * Set the theme for the Wallet Details Modal. By default it is set to `"dark"`
   *
   * theme can be set to either `"dark"`, `"light"` or a custom theme object.
   * You can also import [`lightTheme`](https://portal.thirdweb.com/references/typescript/v5/lightTheme)
   * or [`darkTheme`](https://portal.thirdweb.com/references/typescript/v5/darkTheme)
   * functions from `thirdweb/react` to use the default themes as base and overrides parts of it.
   * @example
   * ```ts
   * import { lightTheme } from "thirdweb/react";
   *
   * const customTheme = lightTheme({
   *  colors: {
   *    modalBg: 'red'
   *  }
   * })
   *
   * ```
   */
  theme?: "light" | "dark" | Theme;
  /**
   * Customize the tokens shown in the "Send Funds" screen in Details Modal for various networks.
   *
   * By default, The "Send Funds" screen shows a few popular tokens for default chains and the native token. For other chains it only shows the native token.
   * @example
   *
   * supportedTokens prop allows you to customize this list as shown below which shows  "Dai Stablecoin" when users wallet is connected to the "Base" mainnet.
   *
   * ```tsx
   * import { useWalletDetailsModal } from 'thirdweb/react';
   *
   * function Example() {
   *   const detailsModal = useWalletDetailsModal();
   *
   *   function handleClick() {
   *      detailsModal.open({
   *        client,
   *        supportedTokens:{
   * 				  84532: [
   * 					  {
   * 						  address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // token contract address
   * 						  name: 'Dai Stablecoin',
   * 						  symbol: 'DAI',
   * 						  icon: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png?1687143508',
   * 					  },
   * 				  ],
   * 			  }
   *      });
   *   }
   *
   *   return (
   * 		<button onClick={handleClick}> show wallet details </button>
   * 	);
   * }
   * ```
   */
  supportedTokens?: SupportedTokens;
  /**
   * Customize the NFTs shown in the "View Funds" screen in Details Modal for various networks.
   *
   * By default, The "View Funds" screen shows a few popular tokens for default chains and the native token. For other chains it only shows the native token.
   * @example
   *
   * supportedTokens prop allows you to customize this list as shown below which shows "Pudgy Penguins" when a users wallet is connected to Ethereum mainnet.
   *
   * ```tsx
   * import { ConnectButton } from 'thirdweb/react';
   *
   * function Example() {
   *   return (
   * 		<ConnectButton
   * 			supportedNFTs={{
   *        // when connected to Ethereum mainnet - show Pudgy Penguins
   * 				1: [
   * 					'0xBd3531dA5CF5857e7CfAA92426877b022e612cf8',
   * 				],
   * 			}}
   * 		/>
   * 	);
   * }
   * ```
   */
  supportedNFTs?: SupportedNFTs;
  /**
   * By default - Details Modal UI uses the `en-US` locale for english language users.
   *
   * You can customize the language used in the Details Modal UI by setting the `locale` prop.
   *
   * Refer to the [`LocaleId`](https://portal.thirdweb.com/references/typescript/v5/LocaleId) type for supported locales.
   */
  locale?: LocaleId;
  /**
   * Array of chains that your app supports. They will be displayed in the network selector in the screen.
   *
   * This is only relevant if your app is a multi-chain app and works across multiple blockchains.
   * If your app only works on a single blockchain, you should only specify the `chain` prop.
   *
   * You can create a `Chain` object using the [`defineChain`](https://portal.thirdweb.com/references/typescript/v5/defineChain) function.
   * At minimum, you need to pass the `id` of the blockchain to `defineChain` function to create a `Chain` object.
   *
   * ```tsx
   * import { defineChain } from "thirdweb/react";
   *
   * const polygon = defineChain({
   *   id: 137,
   * });
   * ```
   */
  chains?: Chain[];

  /**
   * Show a "Request Testnet funds" link in Wallet Details Modal when user is connected to a testnet.
   *
   * By default it is `false`, If you want to show the "Request Testnet funds" link when user is connected to a testnet, set this prop to `true`
   */
  showTestnetFaucet?: boolean;

  /**
   * customize the Network selector shown in the Wallet Details Modal
   */
  networkSelector?: NetworkSelectorProps;

  /**
   * Hide the "Disconnect Wallet" button in the Wallet Details Modal.
   *
   * By default it is `false`
   */
  hideDisconnect?: boolean;

  /**
   * Hide the "Switch Wallet" button in the Wallet Details Modal.
   *
   * By default it is `false`
   */
  hideSwitchWallet?: boolean;

  /**
   * Callback to be called when a wallet is disconnected by clicking the "Disconnect Wallet" button in the Wallet Details Modal.
   *
   * ```tsx
   * import { useWalletDetailsModal } from 'thirdweb/react';
   *
   * function Example() {
   *   const detailsModal = useWalletDetailsModal();
   *
   *   function handleClick() {
   *      detailsModal.open({
   *        client,
   *        onDisconnect: ({ wallet, account }) => {
   *           console.log('disconnected', wallet, account);
   *        }
   *      });
   *   }
   *
   *   return (
   * 		<button onClick={handleClick}> wallet details </button>
   * 	);
   * }
   * ```
   */
  onDisconnect?: (info: {
    wallet: Wallet;
    account: Account;
  }) => void;

  /**
   * Render custom UI at the bottom of the Details Modal
   */
  footer?: (props: { close: () => void }) => JSX.Element;

  /**
   * Configure options for thirdweb Pay.
   *
   * thirdweb Pay allows users to buy tokens using crypto or fiat currency.
   */
  payOptions?: Extract<PayUIOptions, { mode?: "fund_wallet" }>;

  /**
   * Display the balance of a token instead of the native token
   * @example
   * ```tsx
   * const displayBalanceToken = {
   *   // show USDC balance when connected to Ethereum mainnet or Polygon
   *   [ethereum.id]: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
   *   [polygon.id]: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
   * }
   * ```
   */
  displayBalanceToken?: Record<number, string>;

  /**
   * Options to configure the Connect UI shown when user clicks the "Connect Wallet" button in the Wallet Switcher screen.
   */
  connectOptions?: DetailsModalConnectOptions;

  /**
   * Render custom UI for the connected wallet name in the `ConnectButton` Details Modal, overriding ENS name or wallet address.
   */
  connectedAccountName?: React.ReactNode;

  /**
   * Use custom avatar URL for the connected wallet image in the `ConnectButton` Details Modal, overriding ENS avatar or Blobbie icon.
   */
  connectedAccountAvatarUrl?: string;

  /**
   * Hide the "Send Funds" button in the Details Modal.
   *
   * By default the "Send Funds" button is shown.
   */
  hideSendFunds?: boolean;

  /**
   * Hide the "Receive Funds" button in the Details Modal.
   *
   * By default the "Receive Funds" button is shown.
   */
  hideReceiveFunds?: boolean;

  /**
   * Hide the "Buy Funds" button in the Details Modal.
   *
   * By default the "Buy Funds" button is shown.
   */
  hideBuyFunds?: boolean;

  /**
   * When you click on "View Assets", by default the "Tokens" tab is shown first.
   * If you want to show the "NFTs" tab first, change the order of the asset tabs to: ["nft", "token"]
   * Note: If an empty array is passed, the [View Funds] button will be hidden
   */
  assetTabs?: AssetTabs[];

  /**
   * Show the token balance's value in fiat.
   * Note: Not all tokens are resolvable to a fiat value. In that case, nothing will be shown.
   */
  showBalanceInFiat?: SupportedFiatCurrency;
};

/**
 * Hook to open the Wallet Details Modal that shows various information about the connected wallet and allows users to perform various actions like sending funds, receiving funds, switching networks, Buying tokens, etc.
 *
 * @example
 * ```tsx
 * import { createThirdwebClient } from "thirdweb";
 * import { useWalletDetailsModal } from "thirdweb/react";
 *
 * const client = createThirdwebClient({
 *  clientId: "<your_client_id>",
 * });
 *
 * function Example() {
 *   const detailsModal = useWalletDetailsModal();
 *
 *   function handleClick() {
 *      detailsModal.open({ client, theme: 'light' });
 *   }
 *
 *   return <button onClick={handleClick}> Show Wallet Details </button>
 * }
 * ```
 * @wallet
 */
export function useWalletDetailsModal() {
  const account = useActiveAccount();
  const setRootEl = useContext(SetRootElementContext);

  function closeModal() {
    setRootEl(null);
  }

  function openModal(props: UseWalletDetailsModalOptions) {
    if (!account) {
      throw new Error("Wallet is not connected.");
    }

    getConnectLocale(props.locale || "en_US")
      .then((locale) => {
        setRootEl(
          <DetailsModal
            client={props.client}
            locale={locale}
            detailsModal={{
              footer: props.footer,
              hideDisconnect: props.hideDisconnect,
              hideSwitchWallet: props.hideSwitchWallet,
              networkSelector: props.networkSelector,
              payOptions: props.payOptions,
              showTestnetFaucet: props.showTestnetFaucet,
              connectedAccountName: props.connectedAccountName,
              connectedAccountAvatarUrl: props.connectedAccountAvatarUrl,
              hideBuyFunds: props.hideBuyFunds,
              hideReceiveFunds: props.hideReceiveFunds,
              hideSendFunds: props.hideSendFunds,
              assetTabs: props.assetTabs,
            }}
            displayBalanceToken={props.displayBalanceToken}
            theme={props.theme || "dark"}
            supportedTokens={props.supportedTokens}
            supportedNFTs={props.supportedNFTs}
            closeModal={closeModal}
            onDisconnect={(info) => {
              props.onDisconnect?.(info);
              closeModal();
            }}
            chains={props.chains || []}
            connectOptions={props.connectOptions}
          />,
        );
      })
      .catch(() => {
        closeModal();
      });
  }

  return {
    open: openModal,
  };
}
