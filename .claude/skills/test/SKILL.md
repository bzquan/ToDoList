----
name: test
description: ToDoリストのテストを実施する。機能追加、機能変更などにてindex.htmlが変更された時、テストを実施する
user-invocable: true
----

# テストスキル

## 概要

単一HTMLファイル（`index.html`）のToDoリストアプリに対するPlaywright E2Eテストの実行・保守を行う。

---

## テストの実行方法

```bash
# 全テストを実行
npx playwright test

# 特定ファイルのみ実行
npx playwright test tests/todo-basic.test.ts

# 特定のテストケースのみ実行（名前部分一致）
npx playwright test -g "期限日"

# テレポートをブラウザで表示
npx playwright show-report
```

---

## テスト構成

| ファイル | 内容 |
|----------|------|
| `tests/todo-basic.test.ts` | 追加・一覧表示・完了切替・削除・localStorage永続化 |
| `tests/todo-inline-edit.test.ts` | タイトル/詳細のインライン編集、Enter保存、改行、空文字バリデーション |
| `tests/todo-due-date.test.ts` | 期限日の設定・変更・削除、期限なし項目への後から設定 |
| `tests/todo-priority.test.ts` | 優先度（高・中・低）の設定・変更・視覚的表示・永続化 |
| `tests/todo-drag-drop.test.ts` | ドラッグハンドルの表示、順序入れ替え、localStorageへの反映 |
| `tests/todo-export-import.test.ts` | エクスポート（JSONダウンロード）、インポート（ファイル読み込み・スキーマ検証）、エラーケース |

---

## テストレポート

テスト実行後にファイル別の件数と合計を表示する:

```bash
# 全テスト実行（結果付きで件数を確認）
npx playwright test --reporter=line
```

出力例:
```
  [chromium] › tests/todo-basic.test.ts:12:7 ... ✓ (50ms)
  [chromium] › tests/todo-inline-edit.test.ts:18:9 ... ✓ (60ms)
  ...
  48 passed (2.3s)
```

ファイル別の件数を動的に確認する場合:

```bash
# grepでテストケースを数え上げる
grep -c '^\s*test\([' tests/todo-basic.test.ts    # → 10
grep -c '^\s*test\([' tests/todo-inline-edit.test.ts  # → 12
grep -c '^\s*test\([' tests/todo-due-date.test.ts   # → 10
grep -c '^\s*test\([' tests/todo-priority.test.ts   # → 10
grep -c '^\s*test\([' tests/todo-drag-drop.test.ts  # → 6
grep -c '^\s*test\([' tests/todo-export-import.test.ts  # → 10
```

---

## テスト実行時のチェックリスト

テストを実行する前に以下の点を確認する:

1. **index.html が最新の状態か** — 変更前の古いHTMLでテストすると誤差が出る
2. **CSSクラス名・データ属性が一致するか** — セレクタ（`.todo-item__text` など）が実装と合致しているか
3. **ファイルパスの絶対パス** — `file:///d:/todo-app/index.html` が環境によって変わる可能性がある

---

## テスト失敗時の対応手順

1. 失敗したテストケースを特定する
2. エラーメッセージ（`expected ... to be visible / have text` など）を確認
3. `index.html` の実装とテストのセレクタ・期待値を照合
4. **実装が正しい** → テストを修正
5. **テストが正しい** → 実装にバグがある（報告して修正する）

---

## 新しいテストを追加する場合

- 仕様書 [.docs/spec.md](.docs/spec.md) の機能ごとに適切なファイルに追加する
- 既存の `test.describe` グループに追加するか、新しいグループを作成する
- セレクタは実装のクラス名（`.todo-item__*`）とデータ属性（`[data-editable-*]`）を使用
- localStorage を操作する場合は `page.evaluate()` で直接アクセス

---

## 注意事項

- テストはブラウザ直接開き形式のため、`file://` プロトコルで `index.html` を指定する
- 各テストの `beforeEach` で `localStorage.clear()` + `reload()` して状態を初期化している
- ドラッグ&ドロップのテストは実際のDPI操作ではなく、localStorageを直接書き換えて再描画することで順序変更を検証する（ブラウザ間のDPI動作差に依存しない）
