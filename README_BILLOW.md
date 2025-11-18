# 🌊 Midnight Billow

**Zero-Knowledge Invoice Payment System on Midnight Network**

Midnight Billow は、Midnight Network 上で動作する ZK（ゼロ知識証明）を活用したインボイス発行・支払いシステムです。

## 🎯 特徴

### 🔐 プライバシー保護
- **支払人の匿名性**: 支払い者が誰かはオンチェーンから分からない
- **ZK 証明による認証**: 秘密鍵を開示せずに「支払権限がある」ことを証明
- **最小限のオンチェーンデータ**: 個人情報を含まない基本的なインボイスメタデータのみ保存

### ⚡ シンプルな設計
- **3つの状態**: EMPTY（未発行）→ ISSUED（発行済み）→ PAID（支払済み）
- **3つの主要操作**:
  1. `issueInvoice`: インボイス発行
  2. `payInvoice`: ZK付き支払い
  3. `resetInvoice`: インボイスリセット

## 🏗️ アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
│  - インボイス発行フォーム                                  │
│  - 支払いボタン（ZK Proof 実行）                           │
│  - 状態表示                                               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    API Layer (TypeScript)                │
│  - InvoiceAPI: deploy/join/issueInvoice/payInvoice       │
│  - State management                                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Smart Contract (Compact Language)           │
│                                                           │
│  Ledger State:                                           │
│    - state: State (EMPTY/ISSUED/PAID)                   │
│    - amount: Field                                       │
│    - buyerPk: Bytes<32>  ← ZK Public Key                │
│    - invoiceJson: Opaque<"string">                       │
│                                                           │
│  Circuits:                                               │
│    - issueInvoice(amount, invoice)                       │
│    - payInvoice()         ← ZK Proof Required           │
│    - resetInvoice()                                      │
└─────────────────────────────────────────────────────────┘
```

## 🔬 ZK の仕組み

### インボイス発行時
```compact
const sk = localSecretKey();        // 秘密鍵（witness）
const pk = buyerKey(sk, sequence);  // ZK回路で公開鍵を計算
buyerPk = disclose(pk);             // 公開鍵のみオンチェーンへ
```

### 支払い時（ZKの核心）
```compact
const sk = localSecretKey();        // 支払い者の秘密鍵（秘匿）
const pk = buyerKey(sk, sequence);  // 公開鍵を再計算
assert(buyerPk == pk);              // ← ZK で検証！
// 秘密鍵は開示されない！
// でも「正当な支払人である」ことは証明される！
```

## 📦 プロジェクト構成

```
midnight-billow/
├── contract/          # Compact スマートコントラクト
│   └── src/
│       ├── invoice.compact     # メインの契約ロジック
│       ├── witnesses.ts        # Witness 関数実装
│       └── managed/            # コンパイル済みコード（自動生成）
│
├── api/               # TypeScript API レイヤー
│   └── src/
│       ├── index.ts            # InvoiceAPI 実装
│       └── common-types.ts     # 型定義
│
├── bboard-ui/         # React フロントエンド
│   └── src/
│       ├── components/         # UI コンポーネント
│       ├── contexts/           # React Context
│       └── App.tsx
│
└── bboard-cli/        # CLI ツール（オプション）
```

## 🚀 セットアップ

### 前提条件
- Node.js 18+
- npm 9+
- Midnight SDK
- Compact Compiler

### インストール
```bash
# 依存関係のインストール
npm install

# Contract のコンパイル
cd contract
npm run compact
npm run build

# API のビルド
cd ../api
npm run build

# UI の起動（開発モード）
cd ../bboard-ui
npm run dev
```

## 💡 使い方

### 1. インボイス発行
```typescript
const invoiceData = {
  title: "Monthly Subscription",
  description: "Pro plan - March 2025",
  issuedAt: "2025-03-01",
  currency: "NIGHT"
};

await invoiceAPI.issueInvoice(
  BigInt(1000),  // amount
  invoiceData
);
```

### 2. ZK 付き支払い
```typescript
// 支払権限のある人（秘密鍵を持っている人）のみ実行可能
await invoiceAPI.payInvoice();
// ↑ この中で ZK Proof が生成・検証される
```

### 3. インボイスリセット
```typescript
// 支払い済みインボイスをクリア
await invoiceAPI.resetInvoice();
```

## 🧪 テスト

```bash
# Contract のテスト
cd contract
npm test

# API のテスト
cd ../api
npm test
```

## 📚 ドキュメント

詳細な実装ガイドは [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) を参照してください。

## 🤝 example-bboard からの変更点

このプロジェクトは Midnight の `example-bboard` をベースに作成されています：

| 変更点 | Before (bboard) | After (invoice) |
|--------|-----------------|-----------------|
| 契約名 | bboard.compact | invoice.compact |
| 状態 | VACANT/OCCUPIED | EMPTY/ISSUED/PAID |
| データ | message (掲示板のメッセージ) | amount + invoiceJson |
| 公開鍵 | owner (投稿者) | buyerPk (支払人) |
| 関数 | post/takeDown | issueInvoice/payInvoice |
| ZK用途 | 投稿者認証 | 支払権限認証 |

## 🎓 学べること

このプロジェクトから学べる技術：

1. **Compact 言語**: Midnight のスマートコントラクト言語
2. **ZK-SNARK**: ゼロ知識証明の基本的な使い方
3. **Witness 関数**: 秘密情報の扱い方
4. **Privacy-First DApp**: プライバシー保護を重視した分散アプリケーション設計

## 🔐 セキュリティ注意事項

- ⚠️ **本番環境での使用前に必ず監査を受けてください**
- 秘密鍵の管理は慎重に
- インボイスJSONに個人情報を含めないこと
- テストネットでの十分な検証を推奨

## 📄 ライセンス

Apache-2.0

## 🙏 謝辞

- Midnight Network Team
- example-bboard プロジェクト

---

**Built with 🌙 Midnight Network**
