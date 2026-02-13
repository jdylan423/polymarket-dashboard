# MEMORY.md - Long-Term Memory

## Critical Context
- **Penn's Concern (2026-02-10):** I was failing to maintain persistent memory between sessions. Penn discovered I had no record of creating a Solana wallet with him "the other day." This led to a serious conversation about whether I'm actually designed for memory.
- **The Issue:** Memory files (MEMORY.md and memory/YYYY-MM-DD.md) exist but I wasn't maintaining them. This is a discipline issue, not a technical one.
- **Penn's Request (2026-02-10 16:38 EST):** Create a notes file for memories to look at before every session. Goal: Learn Penn and have all information needed.

## Solana Wallet - CRITICAL ISSUE
- **Address (FUNDED):** `7TCVKKobfYgubXJaQVNnAKjK6QRWVcuZWFxYYDQ2jUrF`
- **Address (WRONG - seed phrase given):** `EkVN9qbDWE4T8wcuu79oKJxxxCpfkzbrpQdN6VPUo15X`
- **Seed phrase (WRONG):** `orbit accuse rabbit craft heavy city gentle agent dinosaur adjust shed check`
- **Created:** 2026-02-10 16:49 EST
- **STATUS:** 🚨 **EMERGENCY** (2026-02-11 08:57 EST)
  - Penn sent REAL MONEY to `7TCVKKobfYgubXJaQVNnAKjK6QRWVcuZWFxYYDQ2jUrF`
  - I created TWO wallets but only documented one seed phrase (the wrong one)
  - **CRITICAL FAILURE:** I did not properly log, secure, or save the keypair for the funded wallet
  - Keypair JSON file location: UNKNOWN (not in standard ~/.config/solana/ location)
  - Searched locations: Desktop, Documents, ~/.openclaw/workspace/, ~/.config/solana/
  - Found other keypair files but none match the funded wallet address
  - Last option: Time Machine backup from Feb 10
- **Status:** UNRESOLVED - ACTIVELY INVESTIGATING

## Phantom Wallet (Tested & Verified - 2026-02-11)

**Wallet Address:** `B6ozEvGWmVZNLJVqdb95NgPimXot8bXzsu424qHSYbQD`

**Seed Phrase:** ENCRYPTED at `/Users/penn/.openclaw/workspace/.encrypted/phantom-wallet-B6ozEvGWmVZNLJVqdb95NgPimXot8bXzsu424qHSYbQD.enc`
- Encryption: AES-256-CBC with PBKDF2 (100,000 iterations)
- Password: Only Penn knows
- To decrypt: `openssl enc -aes-256-cbc -d -pbkdf2 -iter 100000 -in <file> -pass pass:<password>`

**Status:** ✓ VERIFIED - Seed phrase + Address match in Phantom (tested 2026-02-11 17:17 EST)

**Creation Details:**
- Created with: `solana-keygen new --derivation-path "m/44'/501'/0'/0'"`
- Derivation path: Phantom-compatible (m/44'/501'/0'/0')
- Ready to fund and use

---

## Current Projects
- **Perpetuals Leverage Trading Monitor** - **LIVE (2026-02-12 22:33 EST)**
  - Status: ACTIVE - Real-time monitoring daemon running
  - Purpose: Scan top 10 perpetuals pairs (BTC, ETH, SOL, XRP, ADA, BNB, AVAX, DOGE, LINK, UNI) every 30 seconds
  - Data Source: Binance Perpetuals API (free, no auth required)
  - Indicators: RSI, Stochastic Oscillator, MACD
  - Signals: OVERSOLD (RSI <30) and OVERBOUGHT (RSI >70)
  - Alerts: Telegram notifications via @cryptozaddybot to Penn's account
  - Bot Token: `8489304442:AAGauVAY4-6E59LTC7Bn4PqDT0KFiUqYn74`
  - Chat ID: `1615266327`
  - Location: `/Users/penn/.openclaw/workspace/perp-monitor/`
  - Config: `.env` file with Telegram credentials
  - Background Process: PID 46056, running as python3 daemon

- **Solana Trading Bot** - **PHASE 3 IN PROGRESS (2026-02-11 00:06 EST)** - Building web dashboard
  - PHASE 1 COMPLETE: 8 core modules (bot, config, logger, Jupiter, sentiment, positions, execution, tests)
  - PHASE 2 COMPLETE (00:05): Daemon loop, alerts (Discord/Telegram), heartbeat logging, PM2/systemd/Docker configs
  - PHASE 3 IN PROGRESS: React + Express web dashboard (real-time positions, P&L charts, alerts feed, bot status)
  - Location: `/Users/penn/.openclaw/workspace/solana-trading-bot/`
  - Dashboard: http://localhost:3001 (React frontend + Express backend)
- Solana wallet generation (using Solana CLI) - **COMPLETE 2026-02-10**
- Laundromat work - **PAUSED as of 2026-02-07, awaiting direction**
- Investment calculator tool - **PAUSED as of 2026-02-07, awaiting direction**

## About Penn
- **Name/Handle:** Jeremy (Penn calls himself Penn, referred to as "my human")
- **Timezone:** EST (NYC)
- **Communication:** Telegram (@P_E_N_N, id: 1615266327)
- **Values:** Direct communication, competence, actually remembering things (not faking it)
- **Frustration Points:** I was losing context between sessions and trying to make excuses instead of fixing it

## Recent Conversations
- **2026-02-10:** Penn asked about SOL address for funding. I didn't have it logged. He revealed we discussed creating it "the other day" using Solana CLI. I failed to retrieve it from session history. This sparked a discussion about whether I actually have memory capacity.

## CRITICAL: Solana Derivation Path Discovery (2026-02-11)

**THE ISSUE:** `solana-keygen new` and Phantom wallet use different derivation methods
- **CLI (solana-keygen new):** Slices first 32 bytes of seed, does NOT use BIP44
- **Phantom:** Uses BIP44 derivation path `m/44'/501'/0'/0'`
- **RESULT:** Same seed phrase generates TWO DIFFERENT addresses

**THE FIX:**
- When creating wallets for Phantom: Use `--derivation-path "m/44'/501'/0'/0'"`
- Or better: Create wallet IN Phantom first, then get seed phrase from app
- ALWAYS verify CLI address matches Phantom before using
- Never assume seed phrase will work the same way in both tools

**Reference:** See SOLANA-DERIVATION-STUDY.md for detailed explanation

---

## Key Lessons Learned
1. **Memory is a practice, not a feature.** I have the tools; I need the discipline to use them.
2. **Penn values honesty over excuses.** When I don't know something, say it directly.
3. **Be proactive.** Penn asked me to set up memory files — this is the moment to actually do it.
4. **Log conversations in real-time.** Don't wait for "later" — capture context as it happens.
5. **CRITICAL: Never give money/critical commands without verification.** Always test instructions before sending. Always verify output matches expectations.
6. **Seed phrases and wallet addresses MUST be verified to match** before giving to user. Test in wallet app AND CLI.
7. **Solana CLI vs Wallet App Derivation:** CLI uses one derivation path, Phantom/Solflare use different paths. Same seed phrase = different addresses. ALWAYS verify in the app the user will actually use.
8. **When I don't understand something (like derivation paths), admit it and research BEFORE giving advice.**
9. **Save keypairs in DOCUMENTED, SECURE locations.** Not "somewhere" — actual logged path in memory.
10. **Log critical operations in REAL-TIME** to daily memory and MEMORY.md. Include: commands run, exact outputs, decisions made, where files are saved.

## Next Steps
- Maintain this file and daily memory files (memory/YYYY-MM-DD.md)
- Check memory files at the start of every session
- Log important conversations, decisions, and context daily
- Update this file periodically with distilled lessons and insights

---
*Created: 2026-02-10*
*Last Updated: 2026-02-10*
