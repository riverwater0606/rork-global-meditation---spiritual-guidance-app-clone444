# World `shareContacts` Bug Report

## Summary

`shareContacts` does not reliably return usable selected contact data in the real World App environment for PSI-G, even though the official spec says a successful payload should include both `username` and `walletAddress`.

## App Context

- Mini App URL: `https://444-two.vercel.app`
- World App ID: `app_7cb26ab7bcbdd62a1bcb3c6353f0b957`
- Action ID: `psig`
- MiniKit package: `@worldcoin/minikit-js@^1.9.6`

## Expected Behavior

According to the documented type contract for `shareContacts`, a successful payload should include:

```ts
type MiniAppShareContactsSuccessPayload = {
  status: "success";
  contacts: Array<{
    username: string;
    walletAddress: string;
    profilePictureUrl: string | null;
  }>;
  timestamp: string;
  version: number;
};
```

After a user selects a contact in the World App picker, the Mini App should receive the selected contact result and be able to use `contacts[0].username` and `contacts[0].walletAddress`.

## Actual Behavior

- The contact picker opens.
- The user selects a contact.
- The Mini App often does **not** receive a usable selected contact payload.
- In practice, the app ends up with no usable `walletAddress`, and sometimes no reliable contact result at all.
- This prevents our gifting flow from using `shareContacts` as a primary flow.

## Important Observations

- This is **not** a backend or Firebase issue.
- Manual gifting by entering `@username` works.
- Username-based routing to Firebase works.
- Wallet-auth works.
- Payment works.
- Only the `shareContacts` contact-selection path is unreliable.

## What We Already Tested

1. `commandsAsync.shareContacts(...)`
2. `commands.shareContacts(...)` + `MiniAppShareContacts` event subscription
3. Waiting longer before timing out
4. Resolving address from username using `MiniKit.getUserByUsername(...)`

## Result

- Manual `@username` gifting succeeds.
- `shareContacts` remains unreliable in this real device / World App environment.

## Questions

1. Is `shareContacts` currently known to be unreliable in some World App builds or devices?
2. Is there any undocumented limitation or permission quirk affecting `shareContacts`?
3. Can `shareContacts` ever return only `username` without `walletAddress`, despite the documented type?
4. Is there a recommended production fallback for user-to-user addressing in Mini Apps?
5. Are there any known debugging hooks or raw payload logging tips for `MiniAppShareContacts`?

## Useful Notes

- We have already shifted our production UX to a `@username`-first flow because that path is reliable.
- We still want to know whether `shareContacts` is a current runtime bug or whether there is a required integration detail missing from the official examples.
