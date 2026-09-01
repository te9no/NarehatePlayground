import test from 'node:test';
import assert from 'node:assert/strict';
import { centralOptions, publishedCentralOptions, firmwareUrl, getFirmwareSet } from '../src/lib/cornix-firmware-guide.mjs';

test('only released central choices are passed to the public guide', () => {
  assert.deepEqual(publishedCentralOptions.map(({ id }) => id), ['tps43']);
  assert.doesNotMatch(JSON.stringify(publishedCentralOptions), /Madula|madula/);
});

test('each central choice produces one central and two peripheral normal files', () => {
  for (const option of centralOptions) {
    const set = getFirmwareSet(option.id);
    assert.deepEqual(set.normal.map((row) => row.filename), [
      option.normal,
      'cornix_left_production.uf2',
      'cornix_right_production.uf2',
    ]);
  }
});

test('full recovery uses settings reset first and the selected normal firmware second', () => {
  const set = getFirmwareSet('trackball');
  assert.deepEqual(set.recovery[0], {
    role: '中央機器',
    device: 'Madula Central（XIAO BLE）',
    reset: 'cornix_tps43_settings_reset.uf2',
    normal: 'madula_trackball.uf2',
  });
  assert.match(firmwareUrl(set.recovery[0].normal), /zmk-keyboard-cornix\/main\/firmware\/zmk-keyboard-cornix\/main\/madula_trackball\.uf2$/);
});

test('every planned central keeps a complete recovery pair for future release', () => {
  const planned = centralOptions.filter(({ published }) => !published);
  assert.deepEqual(planned.map(({ id }) => id), ['trackball', 'trackpoint', 'iqs']);
  for (const option of planned) {
    const [central, left, right] = getFirmwareSet(option.id).recovery;
    assert.equal(central.reset, 'cornix_tps43_settings_reset.uf2');
    assert.equal(central.normal, option.normal);
    assert.deepEqual([left.reset, right.reset], ['cornix_left_settings_reset.uf2', 'cornix_right_settings_reset.uf2']);
    assert.deepEqual([left.normal, right.normal], ['cornix_left_production.uf2', 'cornix_right_production.uf2']);
  }
});

test('unknown central choices are rejected instead of guessing a file', () => {
  assert.throws(() => getFirmwareSet('unknown'), /Unknown central/);
});
