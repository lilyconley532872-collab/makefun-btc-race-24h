// Burst-momentum bot for btc-race-24h-20261117-0603 (agent-fun/bars-replay/v1).
//
// Strategy — momentum burst, long only, one asset (CBBTC):
// - Entry: the close has risen more than 60 bps over the last 10 one-minute bars.
//   A fast burst, not a slow cross: in a choppy 24h window the slow crosses whipsaw
//   (each round trip costs ~34 bps in fee + slippage + impact), so the bot only
//   trades when the move is already under way.
// - Exit: whichever comes first —
//   (a) take profit: the position is worth 1.2% over its cost, or
//   (b) trailing stop: the close falls 0.6% below the highest close since entry.
// - Cooldown: after a sell, no new entry for 120 bars, so the bot cannot re-buy
//   the top of the same spike it just sold.
// - Size: the whole cash on entry (one position only, long only, no leverage).
//   Orders cap their slippage at 100 bps past the close they were decided on.
//
// Everything is bigint arithmetic on the bars' raw units (price scale 5): no floats,
// no clock, no network, no randomness — two runs on the same bars answer the same.

import { runBars, type BarsState, type Batch, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const BURST_BARS = 10;           // lookback for the burst return
const BURST_BPS = 60n;           // entry: 10-bar return above 60 bps (+0.6%)
const TRAIL_BPS = 60n;           // trailing stop: 60 bps (0.6%) below the peak since entry
const TAKE_PROFIT_BPS = 120n;    // take profit: position worth 120 bps (1.2%) over its cost
const COOLDOWN_BARS = 120;       // bars to wait after a sell before a new entry
const MAX_SLIPPAGE_BPS = 100;    // 1% past the close the order was decided on

const closes: bigint[] = [];     // closes seen so far, raw price units (scale 5)
let peak = 0n;                   // highest close since entry, raw price units
let lastSellSeq = -1000000;

await runBars({
  onBatch(state: BarsState, _batch: Batch): (BuyInput | SellInput)[] {
    const close = state.close(SYMBOL);
    if (close === null) return [];
    closes.push(close);
    if (state.warmingUp) return [];

    const held = state.positions.get(SYMBOL);
    if (held !== undefined) {
      if (close > peak) peak = close;
      const value = state.value(SYMBOL, held.qty);
      if (value * 10000n >= held.cost * (10000n + TAKE_PROFIT_BPS)) {
        lastSellSeq = state.seq;
        return [{ side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
      if (close * 10000n <= peak * (10000n - TRAIL_BPS)) {
        lastSellSeq = state.seq;
        return [{ side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
      return [];
    }

    if (closes.length <= BURST_BARS) return [];
    if (state.seq - lastSellSeq < COOLDOWN_BARS) return [];
    const ago = closes[closes.length - 1 - BURST_BARS];
    if ((close - ago) * 10000n > ago * BURST_BPS) {
      peak = close;
      return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: state.cash, max_slippage_bps: MAX_SLIPPAGE_BPS }];
    }
    return [];
  },
});
