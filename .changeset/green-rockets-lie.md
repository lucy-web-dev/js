---
"thirdweb": minor
---

Exposes autoConnect as a standalone function for use outside of react.

```tsx
import { autoConnect } from "thirdweb/wallets";
 
const walletManager = createConnectionManager();
const isAutoConnected = await autoConnect({
 client,
 walletManager,
});
console.log('isAutoConnected', isAutoConnected) // true or false
```
