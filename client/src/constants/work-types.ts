export const WORK_TYPES_WITH_DESCRIPTION = [
  {
    id: 'store-health',
    label: '店舗型ヘルス',
    description: `店舗に来店されたお客様に対して接客を行う業態です。専用の個室での接客となり、研修制度も充実。お店のスタッフのサポートを受けながら働くことができます。`,
  },
  {
    id: 'delivery-health',
    label: 'デリバリーヘルス',
    description: `お客様のご指定場所へ伺い接客を行う業態です。待機場所を自由に選べ、移動時間中も自分の時間として使えます。お店のスタッフがしっかりとサポートいたします。`,
  },
  {
    id: 'hotel-health',
    label: 'ホテルヘルス',
    description: `ホテルの客室で接客を行う業態です。店舗のスタッフがサポートする環境で、清潔な場所での接客が可能です。研修制度があり、経験に応じたサポート体制があります。`,
  },
  {
    id: 'fuzoku-esthe',
    label: '風俗エステ',
    description: `マッサージやアロマトリートメントなど、エステ的要素を取り入れた業態です。基本的な技術は研修で習得できます。リラックスした雰囲気の中でサービスを提供できます。`,
  },
  {
    id: 'm-seikan',
    label: 'M性感',
    description: `M性感独特のサービスを提供する専門的な業態です。技術習得のための研修制度が充実しており、経験を積むことでより高い収入を目指すことができます。`,
  },
  {
    id: 'onakura',
    label: 'オナクラ',
    description: `接触が少なく、比較的軽度なサービス内容の業態です。短時間勤務も可能で、他のお仕事との掛け持ちもしやすいのが特徴です。基本的なサービス内容から始められます。`,
  },
];

export const TIME_OPTIONS = [
  { value: '30', label: '30分' },
  { value: '40', label: '40分' },
  { value: '50', label: '50分' },
  { value: '60', label: '60分' },
  { value: '70', label: '70分' },
  { value: '80', label: '80分' },
  { value: '90', label: '90分' },
];

export const RATE_OPTIONS = [
  { value: '3000', label: '3,000円' },
  { value: '4000', label: '4,000円' },
  { value: '5000', label: '5,000円' },
  { value: '6000', label: '6,000円' },
  { value: '7000', label: '7,000円' },
  { value: '8000', label: '8,000円' },
  { value: '9000', label: '9,000円' },
  { value: '10000', label: '10,000円' },
  { value: '11000', label: '11,000円' },
  { value: '12000', label: '12,000円' },
  { value: '13000', label: '13,000円' },
  { value: '14000', label: '14,000円' },
  { value: '15000', label: '15,000円' },
  { value: '16000', label: '16,000円' },
  { value: '17000', label: '17,000円' },
  { value: '18000', label: '18,000円' },
  { value: '19000', label: '19,000円' },
  { value: '20000', label: '20,000円' },
  { value: '21000', label: '21,000円' },
  { value: '22000', label: '22,000円' },
  { value: '23000', label: '23,000円' },
  { value: '24000', label: '24,000円' },
  { value: '25000', label: '25,000円' },
  { value: '26000', label: '26,000円' },
  { value: '27000', label: '27,000円' },
  { value: '28000', label: '28,000円' },
  { value: '29000', label: '29,000円' },
  { value: '30000', label: '30,000円以上' },
];

export const GUARANTEE_OPTIONS = [
  { value: 'none', label: '希望なし' },
  { value: '10000', label: '10,000円' },
  { value: '20000', label: '20,000円' },
  { value: '30000', label: '30,000円' },
  { value: '40000', label: '40,000円' },
  { value: '50000', label: '50,000円' },
  { value: '60000', label: '60,000円' },
  { value: '70000', label: '70,000円' },
  { value: '80000', label: '80,000円' },
  { value: '90000', label: '90,000円' },
  { value: '100000', label: '100,000円以上' },
];

// 総勤務時間を10時間から24時間まで1時間ずつ
export const WAITING_HOURS = Array.from({ length: 15 }, (_, i) => ({
  value: String(i + 10),
  label: `${i + 10}時間`,
}));

export const prefectures = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];