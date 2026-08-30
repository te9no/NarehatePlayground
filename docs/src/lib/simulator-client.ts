import { estimate, buildShoppingText, orderText, getProduct, getModuleOptions, getReferenceBase, anantaIqs, yen } from './price-simulator.mjs';
import { createStarterState } from './beginner-build.mjs';

const form = document.querySelector<HTMLFormElement>('#configurator')!;
const element = (id: string) => document.getElementById(id)!;
const input = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
const setText = (id: string, value: string) => { element(id).textContent = value; };
const extraIds = ['caseData', 'case', 'left', 'right', 'iqsLeft', 'iqsRight', 'switches', 'keycaps', 'sockets', 'batteries', 'balls', 'moduleKeys'];
const base = import.meta.env.BASE_URL.replace(/\/$/, '') + '/';
let state: Record<string, any>;
let result: ReturnType<typeof estimate>;

function list(id: string, values: string[]) {
  element(id).replaceChildren(...values.map((value) => { const li = document.createElement('li'); li.textContent = value; return li; }));
}
function setOptions(name: string, options: {id: string, label: string}[]) {
  const select = input(name) as unknown as HTMLSelectElement;
  select.replaceChildren(...options.map((o) => new Option(o.label, o.id)));
}
function resetProduct(id: string, announce = false) {
  const p = getProduct(id);
  const a = p.assemblies.find((a) => a.id === p.defaultAssembly)!;
  form.reset();
  state = { product: p.id, assembly: a.id, leftModule: 'enc', rightModule: 'tb', switchType: p.switches[0].id, iqsLeft: false, iqsRight: false, centralSide: '', owned: {}, amounts: { base: getReferenceBase(p, a), left: 2000, right: 4500, balls: 0, caseData: p.caseDataPrice ?? '', iqsLeft: anantaIqs.price, iqsRight: anantaIqs.price } };
  setOptions('assembly', p.assemblies.map((a) => ({ id: a.id, label: `${a.name}　${p.purchaseMode === 'variant' ? yen(a.totalPrice) : a.price ? `＋${yen(a.price)}` : '追加料金なし'}` })));
  setOptions('switchType', p.switches.map((s) => ({ id: s.id, label: s.name })));
  if (announce) setText('product-change-note', `${p.name}に切り替えました。構成・入力価格・手持ちの選択を初期値に戻しました。`);
  render();
}
function render() {
  result = estimate(state);
  const p = result.product;
  element('reference-note').hidden = !state.referenceNote;
  setText('reference-note', state.referenceNote ?? '');
  input('assembly').value = result.assembly.id;
  input('switchType').value = result.switchSpec.id;
  input('centralSide').value = state.centralSide;
  element('ananta-iqs').hidden = p.id !== 'ananta';
  element('bundle-note').hidden = !result.assembly.bundledModules;
  setText('included-note', p.includedNote);
  setText('base-kind', p.purchaseMode === 'variant' ? result.assembly.name : 'PCB・電子部品キット');
  setText('visual-product', p.name);
  document.querySelectorAll<HTMLButtonElement>('[data-product]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.product === p.id)));
  document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.preset === result.assembly.id));
    const a = p.assemblies.find((a) => a.id === b.dataset.preset);
    b.disabled = !a;
    b.querySelector('span')!.textContent = a?.name ?? 'この製品では選択できません';
  });
  for (const side of ['left', 'right']) {
    document.querySelectorAll<HTMLLabelElement>(`[data-module-side="${side}"]`).forEach((label) => {
      const available = p[`${side}Modules`].includes(label.dataset.moduleId!);
      label.hidden = !available;
      const radio = label.querySelector('input')!;
      radio.disabled = !available;
      radio.checked = label.dataset.moduleId === result[side].id;
    });
  }
  setText('right-module-note', result.right.note);
  element('module-visual').className = result.left.id === 'tb' ? 'ball' : ['tpd', 'iqs', 'key'].includes(result.left.id) ? 'pad' : 'knob';
  element('right-module-visual').className = result.right.id === 'tb' ? 'ball' : ['enc', 'joy'].includes(result.right.id) ? 'knob' : 'pad';
  document.querySelectorAll<HTMLAnchorElement>('[data-guide-link]').forEach((a) => a.href = p.guide.startsWith('https:') ? p.guide : base + p.guide);
  document.querySelectorAll<HTMLAnchorElement>('[data-product-link]').forEach((a) => a.href = p.productUrl);
  (element('support-link') as HTMLAnchorElement).href = p.supportUrl;
  element('support-reference').hidden = p.purchaseMode === 'variant';

  const hints: Record<string, string> = {
    caseData: '本体購入者限定の有料データ。印刷費とは別です。購入済みなら「手持ち」を選択。',
    case: p.caseDataPrice ? '材料・外注などの印刷費。ケースデータ代は上の行に分けて計上。' : 'ケースなし構成のみ。印刷材料・外注費を入力。',
    left: result.left.note, right: result.right.note,
    switches: result.switchSpec.direct ? 'ソケットを使わず、基板に直接はんだ付け。' : p.socketsIncluded ? '本体ソケット46個は付属。' : '本体用46個分。ソケット費用は別の行に入力。',
    keycaps: result.switchSpec.hint,
    sockets: '46個分の合計額。組立済みでも同梱・実装範囲は注文時に確認。',
    batteries: p.batteryHint,
    balls: '標準20mmボールはトラボに付属（追加0円）。別サイズへ変更する費用のみ入力。手持ち利用時も部品が揃っているか確認。',
    moduleKeys: '1キーモジュールのスイッチと対応キーキャップ。本体用とは規格が異なる場合があります。',
    iqsLeft: 'SparAkashaAnanta用を1個。左右ハウジング付きでも、センサー2個分ではありません。',
    iqsRight: 'SparAkashaAnanta用を1個。左右ハウジング付きでも、センサー2個分ではありません。',
  };
  for (const id of extraIds) {
    const row = result.rows.find((r) => r.id === id);
    document.querySelector<HTMLElement>(`[data-extra="${id}"]`)!.hidden = !row;
    input(id).disabled = !row || row.included || row.owned;
    input(`owned-${id}`).checked = !!state.owned[id];
    input(`owned-${id}`).disabled = !row || row.included;
    element(`included-${id}`).hidden = !row?.included;
    // State keeps the independent quote while the UI shows a bundled zero price.
    input(id).value = row?.included ? '0' : String(state.amounts[id] ?? '');
    if (!row) continue;
    setText(`title-${id}`, row.label);
    setText(`quantity-${id}`, row.quantity);
    setText(`hint-${id}`, hints[id] ?? '');
    const link = element(`source-${id}`) as HTMLAnchorElement;
    link.hidden = !row.url;
    if (row.url) link.href = row.url;
  }
  for (const id of ['base', 'shipping', 'other']) input(id).value = String(state.amounts[id] ?? '');
  for (const id of ['base', ...extraIds, 'shipping', 'other']) {
    const row = result.rows.find((r) => r.id === id);
    input(id).setAttribute('aria-invalid', String(!!row && !row.included && !row.owned && String(state.amounts[id] ?? '').trim() !== '' && row.amount === null));
  }
  const iqsDescription = result.iqs.left || result.iqs.right ? `\n追加IQS：${result.iqs.left ? '左 ' : ''}${result.iqs.right ? '右' : ''} / Central：${result.centralSide === 'left' ? '左' : result.centralSide === 'right' ? '右' : '要確認'}` : '';
  setText('build-description', `${p.name}\n${result.assembly.name} / ${result.switchSpec.name}\n左：${result.left.name} / 右：${result.right.name}${iqsDescription}`);
  setText('total-label', result.complete ? '入力額による費用の目安' : '入力済み小計');
  setText('total', yen(result.total));
  setText('total-note', result.warnings.length ? '構成の確認が必要です。このまま注文しないでください。' : result.complete ? result.referenceNote ? '送料の初期値2,000円は仮予算です。実額に修正し、工具・USBケーブルの不足分も追加してください。' : '送料を含む / 注文前に販売価格を再確認' : `あと${result.missing.length}項目の金額が必要です。総額はまだ確定していません。`);
  setText('body-total', result.rows[0].amount === null ? '本体価格を確認' : yen(result.rows.filter((r) => ['base', 'support'].includes(r.id)).reduce((s, r) => s + (r.amount ?? 0), 0)));
  setText('extra-total', yen(result.rows.filter((r) => !['base', 'support'].includes(r.id)).reduce((s, r) => s + (r.amount ?? 0), 0)));
  element('missing-box').hidden = !result.missing.length;
  setText('missing-title', '未入力・金額を確認するもの');
  list('missing-list', result.missing.map((r) => r.label));
  element('config-warning').hidden = !result.warnings.length;
  list('warning-list', result.warnings);
  list('work-list', result.work);
  element('shopping-rows').replaceChildren(...result.rows.map((row) => {
    const tr = document.createElement('tr');
    [row.label, row.quantity, row.included ? 'キットに同梱 / 追加0円' : row.owned ? '手持ち / 追加費用なし' : row.amount === null ? '金額を確認' : yen(row.amount)].forEach((v, index) => {
      const td = document.createElement(index === 0 ? 'th' : 'td');
      if (!index) td.setAttribute('scope', 'row');
      td.textContent = v;
      if (row.amount === null && index === 2) td.className = 'unpriced';
      tr.append(td);
    });
    const td = document.createElement('td');
    if (row.url && !row.owned && !row.included) { const a = document.createElement('a'); a.href = row.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = `${row.shop} ↗`; td.append(a); }
    else td.textContent = row.included ? '本体キットの付属品を使用' : row.owned ? '必要数・対応を確認' : row.shop;
    tr.append(td); return tr;
  }));
  setText('order-note', orderText(result));
  (element('memo') as HTMLTextAreaElement).value = buildShoppingText(result);
  setText('copy-status', '');
}

function selectAssembly(id: string) {
  const p = getProduct(state.product);
  const a = p.assemblies.find((a) => a.id === id);
  if (!a) return;
  state.assembly = id;
  if (p.purchaseMode === 'variant') state.amounts.base = getReferenceBase(p, a);
  render();
}
form.addEventListener('submit', (e) => e.preventDefault());
form.addEventListener('input', (e) => {
  const target = e.target as HTMLInputElement;
  if (target.type === 'number') { state.amounts[target.name] = target.value; render(); }
});
form.addEventListener('change', (e) => {
  const target = e.target as HTMLInputElement;
  if (target.name === 'assembly') { selectAssembly(target.value); return; }
  if (target.name === 'leftModule' || target.name === 'rightModule') {
    const side = target.name === 'leftModule' ? 'left' : 'right';
    const selected = getModuleOptions(getProduct(state.product), side).find((m) => m.id === target.value)!;
    state[target.name] = selected.id;
    state.amounts[side] = selected.price; state.owned[side] = false;
    state.amounts.balls = 0; state.owned.balls = false;
    state.amounts.moduleKeys = ''; state.owned.moduleKeys = false;
  } else if (target.name === 'switchType') {
    state.switchType = target.value;
    for (const id of ['switches', 'keycaps', 'sockets']) { state.amounts[id] = ''; state.owned[id] = false; }
  } else if (target.name.startsWith('owned-')) state.owned[target.name.slice(6)] = target.checked;
  else if (['enable-iqsLeft', 'enable-iqsRight'].includes(target.name)) { const id = target.name.slice(7); state[id] = target.checked; state.amounts[id] = anantaIqs.price; state.owned[id] = false; }
  else if (target.name === 'centralSide') state.centralSide = target.value;
  render();
});
document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b) => b.addEventListener('click', () => selectAssembly(b.dataset.preset!)));
document.querySelectorAll<HTMLButtonElement>('[data-product]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.product !== state.product) resetProduct(b.dataset.product!, true); }));
element('copy-list').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(buildShoppingText(result)); setText('copy-status', '構成メモをコピーしました。'); }
  catch { const fallback = element('copy-fallback') as HTMLDetailsElement; fallback.hidden = false; fallback.open = true; const memo = element('memo') as HTMLTextAreaElement; memo.focus(); memo.select(); setText('copy-status', '下の構成メモを選択してコピーしてください。'); }
});
resetProduct('polaris');
// Accept only a named local preset; arbitrary URL prices are never trusted.
if (new URLSearchParams(window.location.search).get('preset') === 'polaris-starter') {
  state = createStarterState();
  state.referenceNote += ` 内訳・購入先：${new URL(`${base}test/choose/#starter`, window.location.origin).href}`;
  render();
  setText('product-change-note', 'はじめての推奨構成を読み込みました。送料の仮予算を実額に直してください。');
}
