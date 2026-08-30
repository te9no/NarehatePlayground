import { getProduct, moduleCatalog, referenceDate } from './simulator-catalog.mjs';

// Reference shopping example, not a live quote. Purchase units include spares.
const polaris = getProduct('polaris');
const assembled = polaris.assemblies.find((a) => a.id === 'assembled');
export const starterItems = [
  { id: 'base', label: 'GeaconPolaris 本体キット', quantity: '1個', amount: polaris.basePrice, url: polaris.productUrl },
  { id: 'support', label: '本体の完成済みオプション', quantity: 'サポート用「100円」×110個', amount: assembled.price, url: polaris.supportUrl },
  { id: 'left', label: '左：エンコーダ', quantity: '1個', amount: moduleCatalog.enc.price, url: moduleCatalog.enc.url },
  { id: 'right', label: '右：20mmトラックボール', quantity: '1個（ボール・ハウジング付き）', amount: moduleCatalog.tb.price, url: moduleCatalog.tb.url },
  { id: 'other', label: 'モジュール2個の組立済みオプション', quantity: '500円×2個分（サポート用A「100円」×10個）', amount: 1000, url: polaris.supportUrl },
  { id: 'switches', label: 'Kailh Choc V2 赤軸', quantity: '35個入り×1 ＋ 1個入り×11 = 46個', amount: 2695 + 115 * 11, url: 'https://shop.yushakobo.jp/products/kailh-choc-v2', note: '赤軸を選択。滑らかに押せるタイプ。静音スイッチではありません。' },
  { id: 'keycaps', label: 'Junana MX 1U 凹形・白', quantity: '2個セット×23 = 46個', amount: 160 * 23, url: 'https://decentkeyboards.booth.pm/items/5551864', note: '17mmピッチ・Choc V2対応。無刻印です。印字や親指用の凸形、位置の目印付きに替える場合は別見積もり。' },
  { id: 'batteries', label: 'エネループ単4形4本＋充電器', quantity: 'K-KJ83MCD04 ×1セット（2本使用・2本予備）', amount: 4554, url: 'https://www.esco-net.com/wcs/escort/ec/detail?hHinCd=EA758YS-40D', note: 'エスコ EA758YS-40Dの税込参照価格。購入可能な販売店・送料を確認してください。' },
];
export const starterSubtotal = starterItems.reduce((sum, item) => sum + item.amount, 0);
export const starterShippingBudget = 2000;
export const starterBudget = starterSubtotal + starterShippingBudget;
export const starterNote = `初心者向け構成の参照入力（${referenceDate}）。送料2,000円は仮予算で、実際の送料ではありません。電池欄は単4形4本＋充電器のセット代、その他欄はモジュール2個の組立代1,000円。PC・データ通信対応USB-Cケーブル・取り付け工具は手持ちを使う前提です。構成を変更した場合は必要数量と組立代も見直してください。`;
export function createStarterState() {
  return { product: 'polaris', assembly: 'assembled', leftModule: 'enc', rightModule: 'tb', switchType: 'choc', centralSide: '', iqsLeft: false, iqsRight: false, owned: {}, referenceNote: starterNote,
    amounts: { ...Object.fromEntries(starterItems.filter((item) => item.id !== 'support').map((item) => [item.id, item.amount])), balls: 0, shipping: starterShippingBudget } };
}
