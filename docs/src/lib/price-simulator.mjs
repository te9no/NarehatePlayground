// All prices are a dated reference, not a live quote or stock check.
export const catalog = {
  product: 'GeaconPolaris',
  referenceDate: '2026-08-30',
  basePrice: 27000,
  productUrl: 'https://te9no.booth.pm/items/7995609',
  supportUrl: 'https://te9no.booth.pm/items/8017110',
  moduleUrl: 'https://te9no.booth.pm/item_lists/mVWTaLGj',
  caseUrl: 'https://github.com/te9no/zmk-config-GeaconPolaris/',
};

export const assemblies = [
  { id: 'kit', name: '基板・電子部品のみ', price: 0, supportUnits: 0, hasCase: false, solder: 'all' },
  { id: 'semi', name: '半組・ケースなし', price: 3000, supportUnits: 30, hasCase: false, solder: 'sockets' },
  { id: 'case', name: 'ケース付きキット', price: 2000, supportUnits: 20, hasCase: true, solder: 'all' },
  { id: 'semi-case', name: '半組 ＋ ケース付き', price: 5000, supportUnits: 50, hasCase: true, solder: 'sockets' },
  { id: 'assembled', name: '本体組立済み', price: 11000, supportUnits: 110, hasCase: true, solder: 'none' },
];

export const modules = [
  { id: 'enc', name: 'エンコーダ', detail: '回転操作を追加', price: 2000, url: 'https://te9no.booth.pm/items/8375550' },
  { id: 'tb', name: 'トラックボール', detail: '左手でもポインター操作', price: 4500, url: 'https://te9no.booth.pm/items/8375514' },
  { id: 'joy', name: 'スティック ＋ エンコーダ', detail: 'スティックと回転操作', price: 3500, url: 'https://te9no.booth.pm/items/8375543' },
];

export const rightModules = [
  { id: 'tpd', name: 'トラックパッド', detail: 'トラパ・指でポインター操作', price: 4500, url: 'https://te9no.booth.pm/items/7840306', note: 'ハウジング付属。参照日時点では在庫なし。入荷状況を商品ページで確認してください。' },
  { ...modules.find((m) => m.id === 'tb'), detail: 'トラボ・ボールでポインター操作', note: '20mmボール・ハウジング付属。' },
  { id: 'iqs', name: 'IQSトラックパッド', detail: 'IQS・複数指のジェスチャ', price: 9000, url: 'https://te9no.booth.pm/items/8375474', note: '「GeaconPolaris用」を選択。FFCケーブル・ハウジング・モジュールカバー付属。' },
];

export const yen = (value) => `¥${value.toLocaleString('ja-JP')}`;

// Empty and invalid inputs must never silently become a zero-yen purchase.
export function parseAmount(raw) {
  const text = String(raw ?? '').trim();
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) && value <= 10000000 ? value : null;
}

export function estimate(state) {
  const assembly = assemblies.find((x) => x.id === state.assembly) ?? assemblies[3];
  const left = modules.find((x) => x.id === state.leftModule) ?? modules[0];
  const right = rightModules.find((x) => x.id === state.rightModule) ?? rightModules[1];
  // Defaults come from the linked BOOTH kits. Explicitly cleared prices stay unknown.
  const amounts = { left: left.price, right: right.price, balls: 0, ...state.amounts };
  const owned = state.owned ?? {};
  const balls = Number(left.id === 'tb') + Number(right.id === 'tb');
  const definitions = [
    ...(!assembly.hasCase ? [{ id: 'case', label: 'ケース・印刷部品一式', quantity: '1式', url: catalog.caseUrl, shop: '自分で用意' }] : []),
    { id: 'left', label: `左：${left.name}モジュール`, quantity: '1個', url: left.url, shop: 'なれはてぷれいぐらうんど' },
    { id: 'right', label: `右：${right.name}モジュール${right.id === 'iqs' ? '（GeaconPolaris用）' : ''}`, quantity: '1個', url: right.url, shop: 'なれはてぷれいぐらうんど' },
    { id: 'switches', label: 'Choc V2互換スイッチ', quantity: '46個', shop: '別途用意' },
    { id: 'keycaps', label: '17mmピッチ用キーキャップ', quantity: '46個', shop: '別途用意' },
    { id: 'batteries', label: '単4形Ni-MH充電池', quantity: '2個', shop: '別途用意' },
    ...(balls ? [{ id: 'balls', label: '別サイズのボール・追加部品', quantity: `${balls}セット分`, shop: '標準20mmボールはトラックボールモジュールに同梱' }] : []),
    { id: 'shipping', label: '全購入先の送料', quantity: '合計', shop: '各店舗で確認' },
  ];
  const rows = [
    { id: 'base', label: '本体：PCB・電子部品キット', quantity: '1個', amount: parseAmount(amounts.base ?? catalog.basePrice), url: catalog.productUrl, shop: 'なれはてぷれいぐらうんど', owned: false },
    ...(assembly.price ? [{ id: 'support', label: `サポート用「100円」：${assembly.name}`, quantity: `${assembly.supportUnits}個`, amount: assembly.price, url: catalog.supportUrl, shop: 'なれはてぷれいぐらうんど', owned: false }] : []),
    ...definitions.map((row) => ({ ...row, owned: row.id !== 'shipping' && !!owned[row.id], amount: row.id !== 'shipping' && owned[row.id] ? 0 : parseAmount(amounts[row.id]) })),
  ];
  if (String(amounts.other ?? '').trim()) rows.push({ id: 'other', label: 'その他の追加費用', quantity: '合計', amount: parseAmount(amounts.other), shop: '入力額', owned: false });
  const missing = rows.filter((row) => row.amount === null);
  const total = rows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const work = [
    ...(!assembly.hasCase ? ['ケース・印刷部品を別途準備する（印刷設備・材料・仕上げが必要）'] : []),
    ...(assembly.solder === 'all' ? ['本体の電子部品・ソケットをはんだ付けする'] : assembly.solder === 'sockets' ? ['本体のスイッチソケットをはんだ付けする'] : []),
    ...(assembly.solder !== 'none' ? ['本体ケースを組み立てる'] : []),
    '選んだモジュールの商品説明に沿って組み立て・取り付ける（ハウジングは付属。本体の組立オプションとは別）',
    ...(right.id === 'iqs' ? ['IQSはGeaconPolaris用ハウジングとモジュールカバーで取り付ける'] : []),
    'スイッチ46個・キーキャップ46個・指定の電池を用意する',
    '左右とモジュールに対応するファームウェア・初期設定・動作を確認する',
  ];
  return { assembly, left, right, balls, rows, missing, total, work, complete: missing.length === 0 };
}

export function buildShoppingText(result) {
  return [
    `${catalog.product} 構成メモ（試算）`,
    `本体：${result.assembly.name} / 左：${result.left.name} / 右：${result.right.name}`,
    `右モジュール：${result.right.note}`,
    ...result.rows.map((r) => `・${r.label} × ${r.quantity}：${r.owned ? '手持ちを使う（追加購入なし）' : r.amount === null ? '金額未入力・要確認' : yen(r.amount)}${r.url ? `\n  ${r.url}` : ''}`),
    `${result.complete ? '入力額による費用の目安' : '入力済み小計（総額未確定）'}：${yen(result.total)}`,
    ...(result.missing.length ? [`未入力：${result.missing.map((r) => r.label).join('、')}`] : []),
    `BOOTH参照日：${catalog.referenceDate}。モジュール価格は各商品ページを参照。ハウジング付属。${result.balls ? '標準20mmボールはトラックボールモジュールに同梱。' : ''}`,
    '販売価格・在庫・同梱品は注文時に確認。工具・印刷設備・任意の追加品は、その他費用に入力しない限り含みません。',
    ...(result.assembly.price ? [`本体とサポート用「100円」を${result.assembly.supportUnits}個、同時購入し、希望構成を販売者に連絡してください。`] : []),
  ].join('\n');
}
