import test from 'node:test';
import assert from 'node:assert/strict';
import { createStarterState, starterItems, starterSubtotal, starterBudget } from '../src/lib/beginner-build.mjs';
import { estimate, buildShoppingText } from '../src/lib/price-simulator.mjs';

test('starter quote matches its purchase quantities, assembly options and displayed budget', () => {
  const state = createStarterState();
  const result = estimate(state);
  assert.equal(starterSubtotal, 57694);
  assert.equal(starterBudget, 59694);
  assert.equal(result.total, starterBudget);
  assert.equal(result.missing.length, 0);
  assert.equal(result.rows.find(r => r.id === 'support').amount, 11000);
  assert.equal(result.rows.find(r => r.id === 'other').amount, 1000);
  assert.equal(result.rows.find(r => r.id === 'switches').amount, 2695 + 11 * 115);
  assert.equal(result.rows.find(r => r.id === 'keycaps').amount, 23 * 160);
  assert.equal(starterItems.find(r => r.id === 'batteries').amount, 4554);
  assert.equal(result.work.some(w => w.includes('はんだ付け')), false);
  assert.match(buildShoppingText(result), /送料2,000円は仮予算/);
  assert.match(buildShoppingText(result), /充電器のセット代/);
});

test('starter state is independent per load and shipping can still be left unknown', () => {
  const first = createStarterState();
  first.amounts.shipping = '';
  first.owned.switches = true;
  const result = estimate(first);
  assert.equal(result.complete, false);
  assert.deepEqual(result.missing.map(r => r.id), ['shipping']);
  const fresh = createStarterState();
  assert.equal(fresh.amounts.shipping, 2000);
  assert.equal(fresh.owned.switches, undefined);
  assert.equal(estimate({ product: 'mekabu' }).referenceNote, undefined);
});
