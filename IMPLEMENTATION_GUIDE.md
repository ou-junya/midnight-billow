# Midnight Billow - ZK Invoice Payment System

## 🎉 実装完了した部分

### 1. ✅ Compact 契約（invoice.compact）
`contract/src/invoice.compact` に以下を実装：

#### 状態管理
```compact
enum State {
  EMPTY,   // インボイス無し
  ISSUED,  // 発行済み（未払い）
  PAID     // 支払い済み
}
```

#### Ledger
- `state`: 契約の現在の状態
- `sequence`: インボイスのシーケンス番号（Counter型）
- `buyerPk`: 支払人の公開鍵（ZK証明用）
- `amount`: インボイス金額（Field型）
- `invoiceJson`: インボイスのJSON詳細（Opaque<"string">型）

#### 主要な Circuit

##### issueInvoice - インボイス発行
```compact
export circuit issueInvoice(
  invoiceAmount: Field,
  invoice: Opaque<"string">
): []
```
- 前提条件: `state == EMPTY || state == PAID`
- 実行内容:
  1. sequence をインクリメント
  2. localSecretKey() から buyerPk を生成（ZK）
  3. amount と invoiceJson を保存
  4. state を ISSUED に変更

##### payInvoice - ZK付き支払い
```compact
export circuit payInvoice(): []
```
- 前提条件: `state == ISSUED`
- **ZKの核心部分**:
  1. localSecretKey() から buyerKey を計算
  2. ledger の buyerPk と一致することを assert（誰が支払ったかは秘匿）
  3. state を PAID に変更

##### resetInvoice - インボイスリセット
```compact
export circuit resetInvoice(): []
```
- 支払い済みインボイスをクリアして、新しいインボイスを発行可能にする

### 2. ✅ Witnesses（witnesses.ts）
`contract/src/witnesses.ts` を更新：

```typescript
export type InvoicePrivateState = {
  readonly secretKey: Uint8Array;
};

export const createInvoicePrivateState = (secretKey: Uint8Array) => ({
  secretKey,
});

export const witnesses = {
  localSecretKey: ({ privateState }: WitnessContext<Ledger, InvoicePrivateState>): [
    InvoicePrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],
};
```

### 3. ✅ API Layer（api/src/）
`api/src/index.ts` と `api/src/common-types.ts` を更新：

#### InvoiceAPI クラス
主要なメソッド：
- `issueInvoice(amount: bigint, invoiceData: InvoiceData)`: インボイス発行
- `payInvoice()`: ZK付き支払い実行
- `resetInvoice()`: インボイスリセット
- `deploy(providers, logger)`: 新規契約デプロイ
- `join(providers, contractAddress, logger)`: 既存契約に参加

#### InvoiceData 型
```typescript
export type InvoiceData = {
  readonly title: string;
  readonly description: string;
  readonly issuedAt: string;
  readonly currency: string;
};
```

#### InvoiceDerivedState 型
```typescript
export type InvoiceDerivedState = {
  readonly state: State;
  readonly sequence: bigint;
  readonly amount: bigint;
  readonly invoiceData: InvoiceData | undefined;
  readonly canPay: boolean;  // この人が支払える権限があるか（ZKで判定）
};
```

### 4. ✅ ビルドとコンパイル
- ✅ `invoice.compact` のコンパイル成功
- ✅ contract パッケージのビルド成功
- ✅ api パッケージのビルド成功

---

## 🚧 残りの実装タスク（UI層）

### 5. TODO: UI Context の更新

#### BrowserDeployedBoardManager → BrowserDeployedInvoiceManager
`bboard-ui/src/contexts/BrowserDeployedBoardManager.ts` を更新：

**変更点**:
- `BBoardAPI` → `InvoiceAPI`
- `BBoardProviders` → `InvoiceProviders`
- `DeployedBBoardAPI` → `DeployedInvoiceAPI`
- `BoardDeployment` → `InvoiceDeployment`

#### DeployedBoardContext → DeployedInvoiceContext
`bboard-ui/src/contexts/DeployedBoardContext.tsx` を更新：
- コンテキスト名を変更
- BrowserDeployedInvoiceManager を使用

### 6. TODO: UI Components の更新

#### Board.tsx → InvoiceBoard.tsx
`bboard-ui/src/components/Board.tsx` を `InvoiceBoard.tsx` に変更：

**必要な変更**:

##### 表示内容
```tsx
// 現在の状態表示
if (state === State.EMPTY) {
  // 「インボイス未発行」の表示
  // → 「Issue Invoice」ボタンを表示
}

if (state === State.ISSUED) {
  // インボイス詳細を表示:
  // - Title
  // - Description
  // - Amount
  // - IssuedAt
  // - Currency
  
  if (canPay) {
    // → 「Pay with ZK」ボタンを表示
  } else {
    // → 「You are not the buyer」メッセージ
  }
}

if (state === State.PAID) {
  // 「支払い完了」の表示
  // → 「Reset Invoice」ボタンを表示（次のインボイスを発行可能にする）
}
```

##### フォームダイアログ
```tsx
// インボイス発行フォーム
<TextField label="Title" />
<TextField label="Description" />
<TextField label="Amount" type="number" />
<TextField label="Currency" />
<DatePicker label="Issued At" />
```

#### TextPromptDialog の拡張
`bboard-ui/src/components/TextPromptDialog.tsx` を拡張するか、新しい `InvoiceFormDialog.tsx` を作成：

```tsx
interface InvoiceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (invoiceData: InvoiceData, amount: bigint) => void;
}
```

### 7. TODO: App.tsx の更新
`bboard-ui/src/App.tsx` で：
- `DeployedBoardProvider` → `DeployedInvoiceProvider`
- `<Board />` → `<InvoiceBoard />`
- タイトルを「Midnight Billow」に変更

### 8. TODO: グローバル設定の更新
`bboard-ui/src/globals.ts`:
- `BOARD_CONTRACT_ADDRESS` → `INVOICE_CONTRACT_ADDRESS`

---

## 🎯 ZKの仕組み（実装済み）

### どこでZKが効いているか

#### 1. インボイス発行時（issueInvoice）
```compact
const sk = localSecretKey();  // ← witness（秘密）
const pk = buyerKey(sk, sequence);  // ← ZK回路で計算
buyerPk = disclose(pk);  // ← 公開鍵のみオンチェーンに保存
```
- **秘密**: 発行者の秘密鍵 `sk`
- **公開**: `buyerPk`（秘密鍵から導出された公開鍵）
- **効果**: 秘密鍵を知らない人には、この pk が誰のものか分からない

#### 2. 支払い時（payInvoice）
```compact
const sk = localSecretKey();  // ← witness（秘密）
const pk = buyerKey(sk, sequence);  // ← ZK回路で再計算
assert(buyerPk == pk);  // ← ZKで検証
```
- **秘密**: 支払い実行者の秘密鍵 `sk`
- **検証**: オンチェーンの `buyerPk` と一致するか
- **効果**: 
  - ✅ 秘密鍵を開示せずに「正当な支払人である」ことを証明
  - ✅ トランザクションから「誰が支払ったか」は分からない
  - ✅ でも「正当な支払人が支払った」ことだけは検証できる

---

## 📊 データフロー

### インボイス発行フロー
```
User Input (UI)
  → InvoiceData { title, description, issuedAt, currency }
  → JSON.stringify()
  → Opaque<"string">
  → issueInvoice(amount, invoiceJson)
  → ZK Proof Generation (localSecretKey → buyerPk)
  → On-chain: { state: ISSUED, amount, buyerPk, invoiceJson }
```

### 支払いフロー（ZK）
```
User Click "Pay with ZK" (UI)
  → payInvoice()
  → ZK Proof Generation:
      - Compute: pk = buyerKey(localSecretKey(), sequence)
      - Assert: pk == ledger.buyerPk
  → If Valid: state → PAID
  → If Invalid: Transaction fails
```

### 状態確認フロー
```
On-chain Ledger State
  → indexer observes
  → API layer combines with private state
  → Compute canPay = (buyerKey(localSecretKey, sequence) == buyerPk)
  → UI displays: state, amount, invoiceData, canPay
```

---

## 🚀 次のステップ

### 最小限で動かすための順序
1. **BrowserDeployedBoardManager** の名称変更と import 更新
2. **DeployedBoardContext** の更新
3. **InvoiceBoard コンポーネント** の作成（シンプル版でOK）
4. **App.tsx** の更新
5. テスト実行

### 推奨する実装順序
```
1. contexts/DeployedInvoiceContext.tsx（名称変更）
2. contexts/BrowserDeployedInvoiceManager.ts（import と型を修正）
3. components/InvoiceBoard.tsx（最小限の UI）
4. App.tsx（コンテキストとコンポーネントを繋ぐ）
5. デザイン調整とフォーム実装
```

---

## 🎨 UI 実装のヒント

### Material-UI コンポーネント例
```tsx
// インボイスカード
<Card>
  <CardContent>
    <Typography variant="h5">{invoiceData.title}</Typography>
    <Typography variant="body2">{invoiceData.description}</Typography>
    <Typography variant="h4">Amount: {amount} {invoiceData.currency}</Typography>
    <Typography variant="caption">Issued: {invoiceData.issuedAt}</Typography>
  </CardContent>
  <CardActions>
    {canPay && <Button onClick={handlePay}>Pay with ZK</Button>}
  </CardActions>
</Card>
```

### 状態に応じた表示
```tsx
const InvoiceBoard = () => {
  const { state, amount, invoiceData, canPay } = useInvoiceDerivedState();

  return (
    <Box>
      {state === State.EMPTY && <IssueInvoiceForm />}
      {state === State.ISSUED && (
        <InvoiceCard 
          data={invoiceData} 
          amount={amount} 
          canPay={canPay} 
        />
      )}
      {state === State.PAID && <PaidInvoiceDisplay />}
    </Box>
  );
};
```

---

## 📝 重要な設計ポイント

### 1. ZK の役割は限定的だが essential
- 💡 **「支払権限のチェック」だけをZKで実装**
- これだけでも「なんちゃってZK」ではなく、本物の ZK アプリケーション
- トークン移転まで ZK 化しようとすると複雑度が爆発的に増加

### 2. オンチェーンデータは最小限
- インボイスJSONには個人情報を含めない
- 金額と基本的なメタデータのみ
- buyerPk で匿名性を担保

### 3. example-bboard の構造を最大限活用
- State, sequence, Opaque<"string"> の使い方はそのまま
- publicKey → buyerKey の名称変更のみ
- post/takeDown → issueInvoice/payInvoice への置き換え

---

## 🎓 学習のポイント

この実装から学べること：

1. **ZK-SNARK の基本**: witness 関数と secret 値の扱い方
2. **Compact 言語**: 状態管理、circuit、ledger の書き方
3. **Midnight SDK**: API層、Provider、Contract deployment
4. **プライバシー保護**: 公開情報と秘密情報の分離

---

完成まであと一歩です！UI 層の実装を頑張ってください！🚀
