import { products, getProduct, getModuleOptions, getReferenceBase, referenceDate, moduleUrl, seller, anantaIqs } from './simulator-catalog.mjs';
export { products, getProduct, getModuleOptions, getReferenceBase, referenceDate, anantaIqs };
export const catalog = { ...products[0], product: products[0].name, referenceDate, moduleUrl };
export const assemblies = products[0].assemblies;
export const modules = getModuleOptions(products[0], 'left');
export const rightModules = getModuleOptions(products[0], 'right');
export const yen = (value) => `¥${value.toLocaleString('ja-JP')}`;
export function parseAmount(raw) {
  const text = String(raw ?? '').trim();
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) && value <= 10000000 ? value : null;
}

export function estimate(state = {}) {
  const product = getProduct(state.product);
  const assembly = product.assemblies.find((a) => a.id === state.assembly) ?? product.assemblies.find((a) => a.id === product.defaultAssembly);
  const leftOptions = getModuleOptions(product, 'left');
  const rightOptions = getModuleOptions(product, 'right');
  const left = leftOptions.find((m) => m.id === state.leftModule) ?? leftOptions[0];
  const right = rightOptions.find((m) => m.id === state.rightModule) ?? rightOptions.find((m) => m.id === 'tb');
  const switchSpec = product.switches.find((s) => s.id === state.switchType) ?? product.switches[0];
  const owned = state.owned ?? {};
  const amounts = { base: getReferenceBase(product, assembly), left: left.price, right: right.price, balls: 0, caseData: product.caseDataPrice, iqsLeft: anantaIqs.price, iqsRight: anantaIqs.price, ...state.amounts };
  const warnings = [];
  for (const [provided, resolved, label] of [[state.assembly, assembly.id, '本体構成'], [state.leftModule, left.id, '左モジュール'], [state.rightModule, right.id, '右モジュール'], [state.switchType, switchSpec.id, 'スイッチ方式']]) {
    if (provided && provided !== resolved) warnings.push(`${product.name}に対応する${label}を選び直してください。`);
  }
  const balls = Number(left.id === 'tb') + Number(right.id === 'tb');
  const moduleKeys = Number(left.id === 'key') + Number(right.id === 'key');
  const iqs = { left: product.id === 'ananta' && !!state.iqsLeft, right: product.id === 'ananta' && !!state.iqsRight };
  if (iqs.left || iqs.right) {
    if (!['left', 'right'].includes(state.centralSide)) warnings.push('IQSの組み合わせ判定には、ファームウェアで設定するCentral側を選択してください。');
    else {
      const peripheral = state.centralSide === 'left' ? 'right' : 'left';
      const peripheralModule = peripheral === 'left' ? left : right;
      if (iqs[peripheral] && ['tb', 'tpd', 'joy'].includes(peripheralModule.id)) warnings.push(`Peripheral側（${peripheral === 'left' ? '左' : '右'}）の${peripheralModule.name}＋IQSはサポート対象外です。モジュールかIQSの取り付け側を変更してください。`);
    }
  }
  const rows = [];
  const add = (id, label, quantity, options = {}) => {
    const included = !!options.included;
    const isOwned = !included && id !== 'shipping' && !!owned[id];
    rows.push({ id, label, quantity, shop: '別途用意', ...options, included, owned: isOwned, amount: included || isOwned ? 0 : parseAmount(amounts[id]) });
  };
  add('base', product.purchaseMode === 'variant' ? `${product.name}：${assembly.name}` : `${product.name}本体：PCB・電子部品キット`, '1個', { url: product.productUrl, shop: product.shop });
  if (product.purchaseMode === 'support' && assembly.price) rows.push({ id: 'support', label: `サポート用「100円」：${assembly.name}`, quantity: `${assembly.supportUnits}個`, amount: assembly.price, url: product.supportUrl, shop: product.shop, included: false, owned: false });
  if (!assembly.hasCase) {
    if (product.caseDataPrice) add('caseData', 'MeKaBuケースデータ（購入者限定）', '1式', { url: product.caseUrl, shop: product.shop });
    add('case', 'ケース・印刷部品一式', '1式', { url: product.caseUrl, shop: '自分で用意' });
  }
  // Bundles supply one encoder and one trackball, not one arbitrary module per side.
  const inventory = assembly.bundledModules ? { enc: 1, tb: 1 } : {};
  for (const [side, mod] of [['left', left], ['right', right]]) {
    const included = !owned[side] && (inventory[mod.id] ?? 0) > 0;
    if (included) inventory[mod.id]--;
    add(side, `${side === 'left' ? '左' : '右'}：${mod.name}モジュール${mod.variant ? `（${mod.variant}）` : ''}`, '1個', { url: mod.url, shop: seller, included });
  }
  for (const side of ['left', 'right']) if (iqs[side]) add(side === 'left' ? 'iqsLeft' : 'iqsRight', `${side === 'left' ? '左' : '右'}外付けIQS（${anantaIqs.variant}）`, '1個', { url: anantaIqs.url, shop: seller });
  add('switches', `${switchSpec.name}スイッチ`, '46個');
  add('keycaps', switchSpec.caps, '46個');
  if (!product.socketsIncluded && !switchSpec.direct) add('sockets', switchSpec.socket, '46個');
  add('batteries', product.battery, '2個');
  if (balls) add('balls', '別サイズのボール・追加部品', `${balls}セット分`, { shop: '標準20mmボールはトラックボールモジュールに同梱' });
  if (moduleKeys) add('moduleKeys', '1キーモジュール用Chocスイッチ・対応キーキャップ', `${moduleKeys}セット`, { shop: '本体用46個とは別に用意' });
  add('shipping', '全購入先の送料', '合計', { shop: '各店舗で確認' });
  if (String(amounts.other ?? '').trim()) add('other', 'その他の追加費用', '合計', { shop: '入力額' });
  const missing = rows.filter((r) => r.amount === null);
  const total = rows.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const work = [
    ...(!assembly.hasCase ? ['ケース・印刷部品を別途準備する（印刷設備・材料・仕上げが必要）'] : []),
    ...(product.caseDataPrice && !assembly.hasCase ? ['ケースデータは本体購入者限定。正規購入後、注文番号を添えて解凍パスワードを販売者へ問い合わせる'] : []),
    ...(assembly.solder === 'all' ? ['本体の電子部品をはんだ付けする'] : []),
    ...(switchSpec.direct ? [`本体の${switchSpec.name}スイッチ46個を直接はんだ付けする（組立済みの作業範囲は注文時に確認）`] : assembly.solder !== 'none' ? ['本体のスイッチソケットをはんだ付けする'] : []),
    ...(!assembly.bodyAssembled ? ['本体ケースを組み立てる'] : []),
    'モジュールの組立済み範囲を確認し、対応ハウジングで取り付ける',
    ...(moduleKeys ? ['1キーモジュールのChocスイッチをはんだ付けする'] : []),
    ...(product.id === 'polaris' && right.id === 'iqs' ? ['IQSはGeaconPolaris用ハウジングとモジュールカバーで取り付ける'] : []),
    ...(iqs.left || iqs.right ? ['追加IQSを載せる側はOLEDを取り付けない。Central/Peripheral設定と組み合わせを確認する'] : []),
    'スイッチ46個・キーキャップ46個・指定の電池を用意する',
    '左右とモジュールに対応するファームウェア・初期設定・動作を確認する',
  ];
  return { product, assembly, left, right, switchSpec, iqs, centralSide: state.centralSide, balls, moduleKeys, rows, missing, total, work, warnings, referenceNote: state.referenceNote, complete: !missing.length && !warnings.length };
}

export function orderText(result) {
  const { product, assembly } = result;
  if (product.purchaseMode === 'variant') return `MeKaBu Projectの商品ページで「${assembly.name}」を選んで購入する試算です。本体価格にこの構成の代金を含むため、サポート用の追加料金は重ねて計上しません。別構成へ交換しても同梱モジュール分の値引きは計算しません。`;
  return assembly.supportUnits ? `${product.shop}で本体と一緒にサポート用「100円」を${assembly.supportUnits}個購入し、希望する「${assembly.name}」を連絡してください。「10,000円」の商品とは別です。` : '本体はPCB・電子部品のみ。ケース・モジュール・別売部品は購入リストに沿って用意してください。';
}
export function buildShoppingText(result) {
  return [
    `${result.product.name} 構成メモ（試算）`,
    ...(result.referenceNote ? [result.referenceNote] : []),
    `本体：${result.assembly.name} / 左：${result.left.name} / 右：${result.right.name}`,
    `本体スイッチ：${result.switchSpec.name} / 電池：${result.product.battery}`,
    ...(result.iqs.left || result.iqs.right ? [`追加IQS：${result.iqs.left ? '左 ' : ''}${result.iqs.right ? '右' : ''} / Central：${result.centralSide === 'left' ? '左' : result.centralSide === 'right' ? '右' : '要確認'}`] : []),
    `右モジュール：${result.right.note}`,
    ...result.rows.map((r) => `・${r.label} × ${r.quantity}：${r.included ? 'キットに同梱（追加0円）' : r.owned ? '手持ちを使う（追加購入なし）' : r.amount === null ? '金額未入力・要確認' : yen(r.amount)}${r.url ? `\n  ${r.url}` : ''}`),
    `${result.complete ? '入力額による費用の目安' : '入力済み小計（総額未確定）'}：${yen(result.total)}`,
    ...result.warnings.map((w) => `構成の確認：${w}`),
    ...(result.missing.length ? [`未入力：${result.missing.map((r) => r.label).join('、')}`] : []),
    `BOOTH参照日：${referenceDate}。価格・在庫・同梱品は注文時に確認。工具・印刷設備・任意の追加品は入力しない限り含みません。`,
    orderText(result),
  ].join('\n');
}
