import type { Chain } from "../src/types";
export default {
  "chain": "anduschain",
  "chainId": 14288640,
  "explorers": [
    {
      "name": "anduschain explorer",
      "url": "https://explorer.anduschain.io",
      "standard": "none"
    }
  ],
  "faucets": [],
  "infoURL": "https://anduschain.io/",
  "name": "Anduschain Mainnet",
  "nativeCurrency": {
    "name": "DAON",
    "symbol": "DEB",
    "decimals": 18
  },
  "networkId": 14288640,
  "rpc": [
    "https://14288640.rpc.thirdweb.com/${THIRDWEB_API_KEY}",
    "https://rpc.anduschain.io/rpc",
    "wss://rpc.anduschain.io/ws"
  ],
  "shortName": "anduschain-mainnet",
  "slug": "anduschain",
  "testnet": false
} as const satisfies Chain;