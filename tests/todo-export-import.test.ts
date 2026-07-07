// @ts-nocheck
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { setupPage } from './setup.ts';

const fixturesDir = path.resolve(__dirname, '../fixtures');

// テスト前にfixturesディレクトリを作成
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

test.describe('データのエクスポート/インポート', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  // --- ボタンの表示 ---

  test('エクスポートボタンが表示される', async ({ page }) => {
    await expect(page.locator('#btnExport')).toBeVisible();
    await expect(page.locator('#btnExport')).toContainText('エクスポート');
  });

  test('インポートボタンが表示される', async ({ page }) => {
    const importLabel = page.locator('label[aria-label="データを取り込む"]');
    await expect(importLabel).toBeVisible();
    await expect(importLabel).toContainText('インポート');
  });

  // --- エクスポート ---

  test('エクスポートボタンをクリックするとJSONファイルがダウンロードされる', async ({ page }) => {
    // ToDoを1件追加してlocalStorageにデータを作成
    await page.fill('#todoTitle', 'エクスポート用テスト');
    await page.click('button[type="submit"]');

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#btnExport').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBeTruthy();
    // ファイルの内容を確認
    const content = await download.createReadStream();
    let data = '';
    for await (const chunk of content) {
      data += chunk.toString();
    }
    const parsed = JSON.parse(data);
    expect(parsed.version).toBe(1);
    expect(parsed.items.length).toBe(1);
    expect(parsed.items[0].title).toBe('エクスポート用テスト');
  });

  test('空のlocalStorageでもエクスポートできる', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#btnExport').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBeTruthy();
    const content = await download.createReadStream();
    let data = '';
    for await (const chunk of content) {
      data += chunk.toString();
    }
    const parsed = JSON.parse(data);
    expect(parsed.version).toBe(1);
    expect(Array.isArray(parsed.items)).toBe(true);
  });

  // --- インポート ---

  test('有効なJSONファイルをインポートできる', async ({ page }) => {
    const validData = {
      version: 1,
      items: [
        {
          id: 'imported-001',
          title: 'インポートされた項目',
          description: 'エクスポートデータから復元',
          done: false,
          priority: 'high',
          dueDate: '2026-12-31',
          createdAt: '2026-07-01T10:00:00Z',
        },
      ],
    };

    const filePath = path.join(fixturesDir, 'import-test.json');
    fs.writeFileSync(filePath, JSON.stringify(validData));

    await page.setInputFiles('#importInput', filePath);

    // リレンダーを待つ
    await expect(page.locator('.todo-item__text')).toContainText('インポートされた項目');

    const stored = await page.evaluate(() => localStorage.getItem('todos'));
    const parsed = JSON.parse(stored);
    expect(parsed.items.length).toBe(1);
    expect(parsed.items[0].title).toBe('インポートされた項目');
  });

  test('複数の項目をインポートできる', async ({ page }) => {
    const multiData = {
      version: 1,
      items: [
        { id: 'a-1', title: 'A', description: '', done: false, priority: 'medium', dueDate: '', createdAt: '2026-07-01T10:00:00Z' },
        { id: 'b-2', title: 'B', description: '詳細あり', done: true, priority: 'low', dueDate: '2026-08-01', createdAt: '2026-07-02T10:00:00Z' },
      ],
    };

    const filePath = path.join(fixturesDir, 'import-multi.json');
    fs.writeFileSync(filePath, JSON.stringify(multiData));

    await page.setInputFiles('#importInput', filePath);

    await expect(page.locator('.todo-item')).toHaveCount(2);
  });

  test('無効なJSONファイルではエラーが表示される', async ({ page }) => {
    const invalidData = '{ version: 1, items: [invalid] }'; // JSONとして不正
    const filePath = path.join(fixturesDir, 'import-invalid.json');
    fs.writeFileSync(filePath, invalidData);

    await page.setInputFiles('#importInput', filePath);

    await expect(page.locator('#errorMessage')).toBeVisible();
    await expect(page.locator('#errorMessage')).toContainText('JSONの解析に失敗しました');
  });

  test('スキーマが不正なファイルではエラーが表示される', async ({ page }) => {
    const invalidSchema = { version: 'invalid', items: [] }; // version が数値ではない
    const filePath = path.join(fixturesDir, 'import-bad-schema.json');
    fs.writeFileSync(filePath, JSON.stringify(invalidSchema));

    await page.setInputFiles('#importInput', filePath);

    await expect(page.locator('#errorMessage')).toBeVisible();
    await expect(page.locator('#errorMessage')).toContainText('無効なファイル形式です');
  });

  test('items が配列でないファイルではエラーが表示される', async ({ page }) => {
    const invalidItems = { version: 1, items: 'not-array' };
    const filePath = path.join(fixturesDir, 'import-bad-items.json');
    fs.writeFileSync(filePath, JSON.stringify(invalidItems));

    await page.setInputFiles('#importInput', filePath);

    await expect(page.locator('#errorMessage')).toBeVisible();
    await expect(page.locator('#errorMessage')).toContainText('無効なファイル形式です');
  });

  test('インポート後、再読み込みでもデータが保持される', async ({ page }) => {
    const data = {
      version: 1,
      items: [{ id: 'persist-001', title: '永続化テスト', description: '', done: false, priority: 'medium', dueDate: '', createdAt: '2026-07-01T10:00:00Z' }],
    };

    const filePath = path.join(fixturesDir, 'import-persist.json');
    fs.writeFileSync(filePath, JSON.stringify(data));

    await page.setInputFiles('#importInput', filePath);

    await expect(page.locator('.todo-item__text')).toContainText('永続化テスト');

    // 再読み込み
    await page.reload();
    await expect(page.locator('.todo-item__text')).toContainText('永続化テスト');
  });
});
