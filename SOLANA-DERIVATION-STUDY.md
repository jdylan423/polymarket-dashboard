# Solana Derivation Path Study

## The Core Problem

**solana-keygen new** and **Phantom wallet** use **completely different derivation methods:**

### solana-keygen new (CLI)
- Does NOT use BIP44 derivation
- Takes the seed phrase
- Slices first 32 bytes directly
- Generates keypair from those 32 bytes
- **Result: Address A**

### Phantom Wallet (and most wallet apps)
- Uses proper BIP44 derivation
- Path: `m/44'/501'/0'/0'` (Phantom/Sollet)
- Solflare uses: `m/44'/501'/0'` (different!)
- Applies full hierarchical derivation
- **Result: Address B (DIFFERENT from A)**

**Same seed phrase → Different addresses in CLI vs Phantom**

## Why This Matters

When I create a wallet with `solana-keygen new`:
1. I get a seed phrase
2. I get Address A (the CLI address)
3. But if you import that seed into Phantom, it generates Address B
4. These are two different wallets

## The Lesson: NEVER Use CLI for Phantom Wallets

If you want to use Phantom wallet:
- **Never use solana-keygen new**
- Create the wallet INSIDE Phantom
- Get the seed phrase FROM Phantom
- Use that seed phrase with that wallet

If you need CLI wallet:
- Create with solana-keygen new
- Understand it won't match Phantom
- Don't fund it expecting to access via Phantom

## What Went Wrong on Feb 10

I created a wallet with `solana-keygen new`, got Address A and a seed phrase.
I told Penn:
- Address: A (from CLI)
- Seed phrase: (the one from CLI)

But Penn funded the wallet in Phantom, which uses the seed phrase to generate Address B.
Address A ≠ Address B → Funds in wrong place → Can't access

## The Fix: How to Do It Right

**Goal: Create a wallet that works with Phantom**

**Method 1: Create in Phantom First (RECOMMENDED)**
1. Open Phantom wallet
2. Click "Create Wallet"
3. Write down the seed phrase it gives you
4. Verify the address Phantom shows
5. That's your Phantom wallet - use it

**Method 2: Create in CLI with Phantom Derivation**
1. Use: `solana-keygen new --outfile keypair.json --derivation-path "m/44'/501'/0'/0'"`
2. Get the address from: `solana-keygen pubkey keypair.json`
3. Get the seed phrase from the output
4. **TEST:** Import that seed into Phantom
5. Verify Phantom shows the SAME address
6. Only then use it

## Critical Rules Going Forward

1. **If target is Phantom wallet: Create in Phantom first**
2. **If creating in CLI: MUST use --derivation-path "m/44'/501'/0'/0'"**
3. **ALWAYS verify CLI address matches Phantom address before using**
4. **Never give user an address without confirming it in the actual wallet app**
5. **Log the derivation path used**
6. **Document which tool (CLI vs Phantom) was used**

## References

- Phantom derivation: `m/44'/501'/0'/0'`
- Solflare derivation: `m/44'/501'/0'` (different!)
- solana-keygen new: Slices first 32 bytes (NOT BIP44)
- This is why they don't match

---
*Studied: 2026-02-11 17:12 EST*
*Ready to implement: Yes, with --derivation-path flag*
