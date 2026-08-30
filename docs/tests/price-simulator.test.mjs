import test from 'node:test';
import assert from 'node:assert/strict';
import { estimate, parseAmount, buildShoppingText } from '../src/lib/price-simulator.mjs';

test('MeKaBu prices are complete variants without a second support charge', () => {
  for (const [assembly, base, total] of [['kit', 21000, 29500], ['case', 33000, 33000], ['semi-case', 36000, 36000], ['assembled', 40000, 40000]]) {
    const r = estimate({ product: 'mekabu', assembly });
    assert.equal(r.rows.find((x) => x.id === 'base').amount, base);
    assert.equal(r.total, total);
    assert.equal(r.rows.some((x) => x.id === 'support'), false);
    assert.equal(r.rows.find((x) => x.id === 'base').url, 'https://mekabukb.booth.pm/items/8089264');
    assert.equal(r.rows.find((x) => x.id === 'left').included, assembly !== 'kit');
    assert.equal(r.rows.find((x) => x.id === 'right').included, assembly !== 'kit');
    assert.match(r.rows.find((x) => x.id === 'batteries').label, /LiPo/);
  }
});

test('MeKaBu bundle allocates exactly one encoder and one trackball across sides', () => {
  assert.equal(estimate({ product: 'mekabu', leftModule: 'tb', rightModule: 'enc' }).total, 36000);
  const twoTb = estimate({ product: 'mekabu', leftModule: 'tb', rightModule: 'tb' });
  assert.equal(twoTb.total, 40500);
  assert.equal(twoTb.rows.filter((r) => ['left', 'right'].includes(r.id) && r.included).length, 1);
  const owned = estimate({ product: 'mekabu', leftModule: 'tb', rightModule: 'tb', owned: { left: true } });
  assert.equal(owned.total, 36000);
  assert.equal(owned.rows.find((r) => r.id === 'right').included, true);
  const changed = estimate({ product: 'mekabu', leftModule: 'joy', rightModule: 'tpd' });
  assert.equal(changed.total, 44000); // Unused bundled parts do not reduce the kit price.
});

test('MeKaBu bare kit separates paid data from printing costs', () => {
  const r = estimate({ product: 'mekabu', assembly: 'kit', amounts: { case: 1500 } });
  assert.equal(r.rows.find((x) => x.id === 'caseData').amount, 2000);
  assert.equal(r.total, 31000);
  const alreadyOwned = estimate({ product: 'mekabu', assembly: 'kit', owned: { caseData: true }, amounts: { case: 1500 } });
  assert.equal(alreadyOwned.total, 29000);
  const withCase = estimate({ product: 'mekabu', assembly: 'case', amounts: { case: 1500, caseData: -1 } });
  assert.equal(withCase.rows.some((x) => ['case', 'caseData'].includes(x.id)), false);
  assert.equal(withCase.total, 33000);
});

test('Ananta has AA batteries and switch-dependent sockets and solder work', () => {
  const mx = estimate({ product: 'ananta' });
  assert.match(mx.rows.find((r) => r.id === 'batteries').label, /単3/);
  assert.match(mx.rows.find((r) => r.id === 'sockets').label, /MX/);
  assert.ok(mx.missing.some((r) => r.id === 'sockets'));
  for (const switchType of ['choc', 'alps']) {
    const r = estimate({ product: 'ananta', switchType, amounts: { sockets: 5000 } });
    assert.equal(r.rows.some((x) => x.id === 'sockets'), false);
    assert.equal(r.total, 38500);
    assert.match(r.work.join('\n'), /直接はんだ付け/);
    assert.match(r.rows.find((x) => x.id === 'keycaps').label, /通常ピッチ/);
  }
  assert.match(estimate({ product: 'ananta', assembly: 'assembled' }).work.join('\n'), /ソケットをはんだ付け/);
});

test('one-key modules add separate Choc switch and cap sets', () => {
  for (const product of ['ananta', 'mekabu']) {
    const r = estimate({ product, leftModule: 'key', rightModule: 'key' });
    assert.equal(r.rows.find((x) => x.id === 'moduleKeys').quantity, '2セット');
    assert.equal(r.rows.find((x) => x.id === 'switches').quantity, '46個');
    assert.ok(r.missing.some((x) => x.id === 'moduleKeys'));
    assert.equal(r.balls, 0);
  }
});

test('Ananta external IQS counts sensors, requires role selection and rejects unsupported peripheral combinations', () => {
  const noRole = estimate({ product: 'ananta', iqsLeft: true });
  assert.equal(noRole.rows.find((r) => r.id === 'iqsLeft').amount, 9500);
  assert.equal(noRole.total, 48000);
  assert.match(noRole.warnings.join(''), /Central/);
  for (const peripheralModule of ['tb', 'tpd', 'joy']) {
    const r = estimate({ product: 'ananta', iqsRight: true, centralSide: 'left', rightModule: peripheralModule });
    assert.match(r.warnings.join(''), /サポート対象外/);
    assert.equal(r.complete, false);
  }
  const two = estimate({ product: 'ananta', leftModule: 'enc', rightModule: 'enc', iqsLeft: true, iqsRight: true, centralSide: 'left' });
  assert.equal(two.total, 55000);
  assert.equal(two.warnings.length, 0);
  assert.equal(two.rows.filter((r) => r.id.startsWith('iqs')).length, 2);
  assert.match(two.work.join(''), /OLEDを取り付けない/);
  assert.match(buildShoppingText(two), /Central：左/);
  const inverse = estimate({ product: 'ananta', leftModule: 'tb', rightModule: 'enc', iqsLeft: true, centralSide: 'right' });
  assert.match(inverse.warnings.join(''), /Peripheral側（左）/);
});

test('product-specific settings cannot silently form a valid incompatible configuration', () => {
  const mekabu = estimate({ product: 'mekabu', rightModule: 'iqs', switchType: 'mx', iqsLeft: true, amounts: { iqsLeft: 9500 } });
  assert.equal(mekabu.complete, false);
  assert.equal(mekabu.warnings.length, 2);
  assert.equal(mekabu.rows.some((r) => r.id === 'iqsLeft'), false);
  assert.equal(mekabu.total, 36000);
  assert.equal(estimate({ product: 'polaris', amounts: { caseData: 2000, sockets: 1500, moduleKeys: 1000, iqsLeft: 9500 } }).total, 38500);
});

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

test('ball parts follow the trackball count on both sides', () => {
  const result = estimate({ ...complete, leftModule: 'tb' });
  assert.equal(result.balls, 2);
  assert.equal(result.rows.find((r) => r.id === 'balls').quantity, '2セット分');
  assert.match(result.rows.find((r) => r.id === 'right').label, /トラックボール/);
  const leftOnly = estimate({ leftModule: 'tb', rightModule: 'tpd' });
  assert.equal(leftOnly.balls, 1);
  assert.equal(leftOnly.rows.find((r) => r.id === 'balls').quantity, '1セット分');
  for (const rightModule of ['tpd', 'iqs']) {
    const noBalls = estimate({ leftModule: 'enc', rightModule, amounts: { balls: '1200' } });
    assert.equal(noBalls.balls, 0);
    assert.equal(noBalls.rows.some((r) => r.id === 'balls'), false);
    assert.equal(noBalls.total, rightModule === 'tpd' ? 38500 : 43000);
    assert.equal(estimate({ rightModule, amounts: { balls: '-1' } }).missing.some((r) => r.id === 'balls'), false);
  }
});

test('right trackpad and Polaris IQS use their own quote, link, and memo', () => {
  for (const [rightModule, amount, item] of [['tpd', 4500, '7840306'], ['iqs', 9000, '8375474']]) {
    const result = estimate({ rightModule });
    const row = result.rows.find((r) => r.id === 'right');
    assert.equal(row.amount, amount);
    assert.equal(row.url, `https://te9no.booth.pm/items/${item}`);
    assert.ok(buildShoppingText(result).includes(`右：${result.right.name}`));
    assert.equal(buildShoppingText(result).includes('右：トラックボール'), false);
    if (rightModule === 'iqs') assert.match(row.label, /GeaconPolaris用/);
  }
  assert.equal(estimate({ rightModule: 'iqs', owned: { right: true } }).total, 34000);
  assert.ok(estimate({ rightModule: 'iqs', amounts: { right: '' } }).missing.some((r) => r.id === 'right'));
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
