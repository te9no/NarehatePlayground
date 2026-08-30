// BOOTH and the linked build guides were checked on this date. No live quote.
export const referenceDate = '2026-08-30';
export const seller = 'なれはてぷれいぐらうんど';
export const moduleUrl = 'https://te9no.booth.pm/item_lists/mVWTaLGj';
export const supportUrl = 'https://te9no.booth.pm/items/8017110';
export const moduleCatalog = {
  enc: { id: 'enc', name: 'エンコーダ', detail: '回転操作を追加', price: 2000, url: 'https://te9no.booth.pm/items/8375550', note: 'ノブ・ハウジング付属。' },
  tb: { id: 'tb', name: 'トラックボール', detail: 'トラボ・ボールで操作', price: 4500, url: 'https://te9no.booth.pm/items/8375514', note: '20mmボール・ハウジング付属。' },
  joy: { id: 'joy', name: 'スティック ＋ エンコーダ', detail: 'スティックと回転操作', price: 3500, url: 'https://te9no.booth.pm/items/8375543', note: 'スティック・ノブ・ハウジング付属。' },
  tpd: { id: 'tpd', name: 'トラックパッド', detail: 'トラパ・指で操作', price: 4500, url: 'https://te9no.booth.pm/items/7840306', note: 'ハウジング付属。参照日時点で在庫なし。入荷状況を確認してください。' },
  key: { id: 'key', name: '1キーモジュール', detail: 'Chocスイッチで1キー追加', price: 2000, url: 'https://te9no.booth.pm/items/8375557', note: 'Chocスイッチと対応キーキャップは別途用意。スイッチは直接はんだ付け。' },
  iqs: { id: 'iqs', name: 'IQSトラックパッド', detail: 'IQS・複数指のジェスチャ', price: 9000, url: 'https://te9no.booth.pm/items/8375474', variant: 'GeaconPolaris用', note: '「GeaconPolaris用」を選択。FFCケーブル・ハウジング・モジュールカバー付属。' },
};
export const anantaIqs = { price: 9500, url: 'https://te9no.booth.pm/items/8375474', variant: 'SparAkashaAnanta用（左右ハウジングセット）' };
const standardAssemblies = [
  { id: 'kit', name: '基板・電子部品のみ', price: 0, supportUnits: 0, hasCase: false, solder: 'all' },
  { id: 'semi', name: '半組・ケースなし', price: 3000, supportUnits: 30, hasCase: false, solder: 'sockets' },
  { id: 'case', name: 'ケース付きキット', price: 2000, supportUnits: 20, hasCase: true, solder: 'all' },
  { id: 'semi-case', name: '半組 ＋ ケース付き', price: 5000, supportUnits: 50, hasCase: true, solder: 'sockets' },
  { id: 'assembled', name: '本体組立済み', price: 11000, supportUnits: 110, hasCase: true, solder: 'none', bodyAssembled: true },
];
const choc = { id: 'choc', name: 'Choc V2互換', caps: '17mmピッチ用キーキャップ', hint: 'MX型十字ステム対応・17mmピッチ用。', socket: 'Choc V2用ソケット' };
const sharedModules = ['enc', 'tb', 'joy', 'key', 'tpd'];
export const products = [
  {
    id: 'polaris', name: 'GeaconPolaris', description: '46キー / GRIN配列 / Choc V2', basePrice: 27000,
    productUrl: 'https://te9no.booth.pm/items/7995609', shop: seller, supportUrl,
    guide: 'guides/20geaconpolaris/', caseUrl: 'https://github.com/te9no/zmk-config-GeaconPolaris/',
    assemblies: standardAssemblies, purchaseMode: 'support', defaultAssembly: 'semi-case',
    leftModules: ['enc', 'tb', 'joy'], rightModules: ['tpd', 'tb', 'iqs'], switches: [choc],
    battery: '単4形Ni-MH充電池', batteryHint: '左右各1個、計2個。一次電池は使用しないでください。',
    socketsIncluded: true, includedNote: 'ソケット46個は付属。ケース付き構成の標準アクセントプレートはゴールド（PETG）です。',
  },
  {
    id: 'ananta', name: 'SparAkashaAnanta', description: '46キー / Lotus配列 / MX・Choc V2・ALPS', basePrice: 27000,
    productUrl: 'https://te9no.booth.pm/items/8305059', shop: seller, supportUrl,
    guide: 'guides/22sparakashaananta/', caseUrl: 'https://github.com/te9no/zmk-config-SparAkashaAnanta/',
    // The BOOTH listing explicitly excludes socket soldering from its assembled option.
    assemblies: standardAssemblies.map((a) => a.id === 'assembled' ? { ...a, solder: 'sockets' } : a),
    purchaseMode: 'support', defaultAssembly: 'semi-case', leftModules: sharedModules, rightModules: sharedModules,
    switches: [
      { id: 'mx', name: 'MX互換', caps: 'MX対応・通常ピッチ用キーキャップ', hint: '通常ピッチ・MXステム対応。', socket: 'MX用ソケット' },
      { ...choc, caps: 'Choc V2対応・通常ピッチ用キーキャップ', hint: '通常ピッチ・Choc V2のMX型十字ステム対応。', direct: true },
      { id: 'alps', name: 'ALPS互換', caps: 'ALPS対応・通常ピッチ用キーキャップ', hint: '通常ピッチ・ALPSステム対応。', direct: true },
    ],
    battery: '単3形Ni-MH充電池', batteryHint: '左右各1個、計2個。一次電池は使用しないでください。',
    socketsIncluded: false, includedNote: 'MX用ソケット46個は別途用意。Choc V2・ALPSはスイッチを直接はんだ付けします。IQSを載せる側はOLEDを取り付けないでください。',
  },
  {
    id: 'mekabu', name: 'MeKaBu', description: '46キー / オーソリニア配列 / Choc V2', basePrice: 21000,
    productUrl: 'https://mekabukb.booth.pm/items/8089264', shop: 'MeKaBu Project', supportUrl: 'https://mekabukb.booth.pm/items/7950812',
    guide: 'https://modulable-keyboard-developer.github.io/', caseUrl: 'https://booth.pm/ja/items/7631759', caseDataPrice: 2000,
    purchaseMode: 'variant', defaultAssembly: 'semi-case',
    assemblies: [
      { id: 'kit', name: 'PCB・電子部品キット（印刷部品、モジュールなし）', price: 0, totalPrice: 21000, hasCase: false, solder: 'all' },
      { id: 'case', name: '組立キット', price: 12000, totalPrice: 33000, hasCase: true, solder: 'all', bundledModules: true },
      { id: 'semi-case', name: '半組キット', price: 15000, totalPrice: 36000, hasCase: true, solder: 'sockets', bundledModules: true },
      { id: 'assembled', name: '組み立て済みセット', price: 19000, totalPrice: 40000, hasCase: true, solder: 'none', bodyAssembled: true, bundledModules: true },
    ],
    leftModules: sharedModules, rightModules: sharedModules, switches: [choc],
    battery: '対応LiPoバッテリー', batteryHint: '左右各1個、計2個。公式ガイドの電圧・寸法・コネクタ極性と、購入キットへの同梱状況を確認。含まれる場合は0円を入力。',
    socketsIncluded: true, includedNote: 'Choc V2ソケット46個は商品説明の部品表に記載。組立・半組・組み立て済みセットはケースとエンコーダ1個・トラボ1個付き。参照日時点で本体は在庫なし。',
  },
];
export const getProduct = (id) => products.find((p) => p.id === id) ?? products[0];
export const getModuleOptions = (product, side) => product[`${side}Modules`].map((id) => moduleCatalog[id]);
export const getReferenceBase = (product, assembly) => product.purchaseMode === 'variant' ? assembly.totalPrice : product.basePrice;
