const firmwareBase = 'https://raw.githubusercontent.com/te9no/zmk-keyboard-cornix/main/firmware/zmk-keyboard-cornix/main/';

export const centralOptions = [
  { id: 'tps43', name: 'TPS43 トラックパッド', device: 'Cornix TP Central', normal: 'cornix_tps43_production.uf2', description: 'Cornixトラパの標準構成' },
  { id: 'trackball', name: 'Madula ＋ トラックボール', device: 'Madula Central', normal: 'madula_trackball.uf2', description: 'PMW3610トラックボール' },
  { id: 'trackpoint', name: 'Madula ＋ トラックポイント', device: 'Madula Central', normal: 'madula_trackpoint.uf2', description: 'ADS1220 LPPSトラックポイント' },
  { id: 'iqs', name: 'Madula ＋ IQSトラックパッド', device: 'Madula Central', normal: 'madula_iqs.uf2', description: 'IQS9151トラックパッド' },
];

export const peripheralFirmware = [
  { role: 'Cornix 左', device: '左キーボード', normal: 'cornix_left_production.uf2', reset: 'cornix_left_settings_reset.uf2' },
  { role: 'Cornix 右', device: '右キーボード', normal: 'cornix_right_production.uf2', reset: 'cornix_right_settings_reset.uf2' },
];

export function firmwareUrl(filename) {
  return `${firmwareBase}${filename}`;
}

export function getFirmwareSet(centralId = 'tps43') {
  const central = centralOptions.find((option) => option.id === centralId);
  if (!central) throw new Error(`Unknown central: ${centralId}`);
  const normal = [
    { role: '中央機器', device: central.device, filename: central.normal },
    ...peripheralFirmware.map(({ role, device, normal: filename }) => ({ role, device, filename })),
  ];
  const recovery = [
    { role: '中央機器', device: `${central.device}（XIAO BLE）`, reset: 'cornix_tps43_settings_reset.uf2', normal: central.normal },
    ...peripheralFirmware.map(({ role, device, reset, normal }) => ({ role, device, reset, normal })),
  ];
  return { central, normal, recovery };
}
