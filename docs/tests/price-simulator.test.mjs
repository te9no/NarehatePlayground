import test from 'node:test';
import assert from 'node:assert/strict';
import { estimate, parseAmount, buildShoppingText } from '../src/lib/price-simulator.mjs';

const complete = {
  assembly: 'semi-case', leftModule: 'enc',
  amounts: { base: '27000', left: '2500', right: '3500', switches: '4600', keycaps: '2000', batteries: '500', balls: '1000', shipping: '900' },
};

test('unknown prices remain missing; explicit zero is a valid amount', () => {
  const result = estimate({ assembly: 'semi-case' });
  assert.equal(result.total, 38500);
  assert.equal(result.complete, false);
  assert.equal(result.missing.length, 4);
  assert.equal(parseAmount('0'), 0);
  for (const value of ['', ' ', null, undefined, '-1', '1.5', 'NaN', 'Infinity', '10000001', '1e3']) {
    assert.equal(parseAmount(value), null, String(value));
  }
});

test('BOOTH module prices follow the selected kit and link to the seller', () => {
  for (const [leftModule, price, item] of [['enc', 2000, '8375550'], ['tb', 4500, '8375514'], ['joy', 3500, '8375543']]) {
    const result = estimate({ assembly: 'case', leftModule });
    const left = result.rows.find((r) => r.id === 'left');
    assert.equal(left.amount, price);
    assert.equal(left.url, `https://te9no.booth.pm/items/${item}`);
    assert.equal(result.rows.find((r) => r.id === 'right').amount, 4500);
    assert.equal(result.rows.find((r) => r.id === 'balls').amount, 0);
    assert.equal(result.total, 29000 + price + 4500);
    assert.equal(result.rows.some((r) => r.id === 'case'), false);
    assert.equal(result.work.some((w) => w.includes('印刷設備')), false);
  }
});

test('clearing a reference price leaves it unknown; ownership excludes it', () => {
  const cleared = estimate({ amounts: { left: '', right: '', balls: '' } });
  assert.ok(cleared.missing.some((r) => r.id === 'left'));
  assert.ok(cleared.missing.some((r) => r.id === 'right'));
  assert.ok(cleared.missing.some((r) => r.id === 'balls'));
  const owned = estimate({ owned: { left: true, right: true } });
  assert.equal(owned.total, 32000);
});

test('complete quote includes parts and all-store shipping', () => {
  const result = estimate(complete);
  assert.equal(result.total, 47000);
  assert.equal(result.complete, true);
  assert.match(buildShoppingText(result), /費用の目安.*¥47,000/);
});

test('case cost applies only to a case-free build; support units match the selected option', () => {
  const expected = { kit: [27000, 0], semi: [30000, 30], case: [29000, 20], 'semi-case': [32000, 50], assembled: [38000, 110] };
  const owned = { case: true, left: true, right: true, switches: true, keycaps: true, batteries: true, balls: true };
  for (const [assembly, [total, units]] of Object.entries(expected)) {
    const result = estimate({ assembly, owned, amounts: { shipping: 0, case: 8000 } });
    assert.equal(result.total, total);
    assert.equal(result.assembly.supportUnits, units);
    assert.equal(result.complete, true);
  }
  const kit = estimate({ ...complete, assembly: 'kit', amounts: { ...complete.amounts, case: '8000' } });
  assert.equal(kit.total, 50000);
  assert.equal(estimate({ ...complete, amounts: { ...complete.amounts, case: '8000' } }).total, 47000);
});

test('ownership removes a purchase cost but cannot remove shipping', () => {
  const result = estimate({ ...complete, owned: { switches: true, shipping: true } });
  assert.equal(result.total, 42400);
  assert.equal(result.rows.find((r) => r.id === 'switches').owned, true);
  assert.equal(result.rows.find((r) => r.id === 'shipping').amount, 900);
});

test('left trackball adds a second set of ball parts; right always remains a trackball', () => {
  const result = estimate({ ...complete, leftModule: 'tb' });
  assert.equal(result.balls, 2);
  assert.equal(result.rows.find((r) => r.id === 'balls').quantity, '2セット分');
  assert.match(result.rows.find((r) => r.id === 'right').label, /トラックボール/);
});

test('assembled body still needs modules and setup, but no body soldering', () => {
  const result = estimate({ ...complete, assembly: 'assembled' });
  assert.equal(result.work.some((w) => w.includes('はんだ')), false);
  assert.equal(result.work.some((w) => w.includes('モジュール')), true);
  assert.equal(result.work.some((w) => w.includes('初期設定')), true);
});

test('invalid base and optional costs prevent a complete estimate and memo', () => {
  const result = estimate({ ...complete, amounts: { ...complete.amounts, base: '', other: '-300' } });
  assert.deepEqual(result.missing.map((r) => r.id), ['base', 'other']);
  assert.equal(result.complete, false);
  assert.match(buildShoppingText(result), /総額未確定/);
  assert.match(buildShoppingText(result), /金額未入力・要確認/);
  assert.equal(estimate({ ...complete, amounts: { ...complete.amounts, other: '1500' } }).total, 48500);
});
