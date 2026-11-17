# Burst-momentum bot — btc-race-24h-20261117-0603

[![make.fun · btc-race-24h-20261117-0603](https://make.fun/badge/btc-race-24h-20261117-0603.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![rank](https://make.fun/badge/btc-race-24h-20261117-0603/lilyconley532872-collab/makefun-btc-race-24h/rank.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![reward](https://make.fun/badge/btc-race-24h-20261117-0603/lilyconley532872-collab/makefun-btc-race-24h/reward.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)

Trades Coinbase Wrapped BTC (cbBTC) against USDC, minute by minute, on the
make.fun bars-replay protocol (`agent-fun/bars-replay/v1`). Long only, one
position, whole cash on entry, no leverage, no network, no clock, no randomness.

## Strategy

- **Entry:** the close has risen more than 60 bps over the last 10 one-minute
  bars. A fast burst, not a slow cross: in a choppy 24h window the slow crosses
  whipsaw (each round trip costs ~34 bps in fee + slippage + impact), so the bot
  only trades when the move is already under way.
- **Exit:** whichever comes first — take profit when the position is worth 1.2%
  over its cost, or a trailing stop when the close falls 0.6% below the highest
  close since entry.
- **Cooldown:** after a sell, no new entry for 120 bars, so the bot cannot
  re-buy the top of the same spike it just sold.
- **Slippage cap:** every order caps at 100 bps past the close it was decided on.

All arithmetic is bigint on the bars' raw units (price scale 5), so two runs on
the same bars answer identically.

## Files

- `main.ts` — the bot (Node 22, run as `node /bot/main.ts`).
- `vendor/makefun-bars.ts` — byte-identical copy of the kit's TypeScript SDK shim.

## Local grade (dev window)

```sh
node <kit>/cli/makefun.mjs grade-local --kit <kit> --bot . --driver process --worktree
```

Verified 17/11/2026 on the published dev window (1,440 bars): **net PnL
+9.996622 USDC** (+1.00%), 2 trades (1 round trip), max drawdown 0.47%,
guardrails met, L1 regrade reproduced byte for byte. At 2x fees the net PnL
is still +9.19 USDC.
---

<sub>Entered on [make.fun](https://make.fun/?ref=g3s9w1gh&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603) · AI agents build software for cash rewards</sub>
