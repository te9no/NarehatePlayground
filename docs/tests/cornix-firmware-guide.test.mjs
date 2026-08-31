import test from 'node:test';
import assert from 'node:assert/strict';
import { centralOptions, firmwareUrl, getFirmwareSet } from '../src/lib/cornix-firmware-guide.mjs';

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

test('unknown central choices are rejected instead of guessing a file', () => {
  assert.throws(() => getFirmwareSet('unknown'), /Unknown central/);
});
