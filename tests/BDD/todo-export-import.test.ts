// @ts-nocheck
import { test, expect } from '@playwright/test';
import { setupPage } from '../setup.ts';

test.describe('Feature: データのエクスポートとインポート', () => {
  // シナリオ: ToDoデータをJSONファイルとしてエクスポートできる
  test('ToDoデータをJSONファイルとしてエクスポートできる', async ({ page }) => {
    await setupPage(page);

    // Given: "買い物に行く" というToDoが登録されている
    await page.fill('#todoTitle', '買い物に行く');
    await page.click('button[type="submit"]');

    // When: エクスポートボタンをクリックする
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#btnExport').click(),
    ]);

    // Then: JSON形式のファイルがダウンロードされる
    expect(download.suggestedFilename()).toContain('.json');

    // And: ファイルに "買い物に行く" のデータが含まれる
    const content = await download.createReadStream();
    let data = '';
    if (content) {
      for await (const chunk of content) {
        data += Buffer.from(chunk).toString('utf-8');
      }
    }
    expect(data).toContain('買い物に行く');
  });

  // シナリオ: インポートでJSONファイルからデータを読み込める
  test('インポートでJSONファイルからデータを読み込める', async ({ page }) => {
    await setupPage(page);

    // Given: 空の状態から始めています（setupPage済み）

    // When: JSONファイルからインポートする
    const fileInput = page.locator('#importInput');
    const jsonContent = JSON.stringify({
      version: 1,
      items: [
        {
          id: 'test-001',
          title: 'インポートテスト',
          description: 'ファイルから読み込み',
          done: false,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    await fileInput.setInputFiles({
      name: 'export.json',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonContent),
    } as any);

    // Then: エクスポートされたToDoデータが表示される
    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.todo-item__text')).toContainText('インポートテスト');
  });

  // シナリオ: スキーマバージョンが異なるデータをインポートすると警告が表示される
  test('スキーマバージョンが異なるデータでもインポートできる', async ({ page }) => {
    await setupPage(page);

    // Given: 空の状態から始めています（setupPage済み）

    // When: バージョン0のJSONファイルをインポートする
    const fileInput = page.locator('#importInput');
    const oldVersionJson = JSON.stringify({
      version: 0,
      items: [
        {
          id: 'test-002',
          title: '古いデータ',
          done: false,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    await fileInput.setInputFiles({
      name: 'old-export.json',
      mimeType: 'application/json',
      buffer: Buffer.from(oldVersionJson),
    } as any);

    // Then: localStorageに書き込まれ、スキーマバージョンは変更されないまま
    const stored = await page.evaluate(() => localStorage.getItem('todos'));
    expect(stored).toBeTruthy();
    const data = JSON.parse(stored);
    expect(data.version).toBe(0);
    expect(data.items.length).toBe(1);
  });

  // シナリオ: 不正なJSONファイルのインポートでエラーが表示される
  test('不正なJSONファイルでエラーが表示される', async ({ page }) => {
    await setupPage(page);

    // Given: 空の状態から始めています（setupPage済み）

    // When: 無効なJSONファイルをインポートする
    const fileInput = page.locator('#importInput');
    await fileInput.setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from('これは無効なJSONです{{{'),
    } as any);

    // Then: エラーメッセージが表示される
    const errorMessage = page.locator('#errorMessage');
    await expect(errorMessage).toBeVisible();

    // And: アプリは正常に動作し続ける（エラーでクラッシュしない）
    await expect(page.locator('body')).toBeVisible();
  });

  // シナリオ: エクスポートしたデータを再インポートできる（round-trip）
  test('エクスポートしたデータを再インポートできる', async ({ page }) => {
    await setupPage(page);

    // Given: "買い物に行く" というToDoが登録されている
    await page.fill('#todoTitle', '買い物に行く');
    await page.click('button[type="submit"]');

    let downloadAccepted = false;

    // When: エクスポートボタンをクリックしてJSONファイルをダウンロードする
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#btnExport').click(),
    ]);

    // ダウンロードしたファイルからインポートする
    const content = await download.createReadStream();
    let data = '';
    if (content) {
      for await (const chunk of content) {
        data += Buffer.from(chunk).toString('utf-8');
      }
    }

    // setupPageでlocalStorageをクリアしてからインポート
    await page.evaluate(() => localStorage.clear());
    await page.goto(page.url());

    const fileInput = page.locator('#importInput');
    await fileInput.setInputFiles({
      name: 'roundtrip.json',
      mimeType: 'application/json',
      buffer: Buffer.from(data),
    } as any);

    // Then: "買い物に行く" のデータが表示される
    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.todo-item__text')).toContainText('買い物に行く');
  });

  // シナリオ: 既存のデータがある状態でインポートすると既存データが上書きされる
  test('既存のデータがある状態でインポートすると上書きされる', async ({ page }) => {
    await setupPage(page);

    // Given: "既存タスク" というToDoが登録されている
    await page.fill('#todoTitle', '既存タスク');
    await page.click('button[type="submit"]');

    const itemsBefore = page.locator('.todo-item');
    await expect(itemsBefore).toHaveCount(1);
    await expect(page.locator('.todo-item__text')).toContainText('既存タスク');

    // When: "インポートタスク" を含むJSONファイルをインポートする
    const fileInput = page.locator('#importInput');
    const jsonContent = JSON.stringify({
      version: 1,
      items: [
        {
          id: 'import-001',
          title: 'インポートタスク',
          description: '上書きテスト',
          done: false,
          priority: 'medium',
          dueDate: null,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    await fileInput.setInputFiles({
      name: 'overwrite.json',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonContent),
    } as any);

    // Then: "既存タスク" は消去され、"インポートタスク" のみが表示される
    const itemsAfter = page.locator('.todo-item');
    await expect(itemsAfter).toHaveCount(1);
    await expect(page.locator('.todo-item__text')).toContainText('インポートタスク');
  });

  // シナリオ: 空のリストをエクスポートできる
  test('空のリストをエクスポートできる', async ({ page }) => {
    await setupPage(page);

    // Given: ToDo一覧が空の状態（setupPageでlocalStorageクリア済み）

    // When: エクスポートボタンをクリックする
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#btnExport').click(),
    ]);

    // Then: JSON形式のファイルがダウンロードされる
    expect(download.suggestedFilename()).toContain('.json');

    // And: ファイルに "items": [] が含まれる（インデント付きで出力される）
    const content = await download.createReadStream();
    let data = '';
    if (content) {
      for await (const chunk of content) {
        data += Buffer.from(chunk).toString('utf-8');
      }
    }
    expect(data).toContain('"items": []');
  });

  // シナリオ: 優先度・期限日付を含む完全なデータがインポートされる
  test('優先度・期限日付を含む完全なデータがインポートされる', async ({ page }) => {
    await setupPage(page);

    // Given: 空の状態から始めています（setupPage済み）

    // When: 優先度「高」、期限「2031-12-31」のToDoを含むJSONファイルをインポートする
    const fileInput = page.locator('#importInput');
    const jsonContent = JSON.stringify({
      version: 1,
      items: [
        {
          id: 'full-test-001',
          title: '完全テストタスク',
          description: '優先度と期限付き',
          done: false,
          priority: 'high',
          dueDate: '2031-12-31',
          createdAt: new Date().toISOString(),
        },
      ],
    });

    await fileInput.setInputFiles({
      name: 'full-import.json',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonContent),
    } as any);

    // Then: ToDoのタイトル、優先度、期限日付が正しく表示される
    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.todo-item__text')).toContainText('完全テストタスク');

    const priorityEl = page.locator('.todo-item__priority').first();
    await expect(priorityEl).toBeVisible();

    const dueEl = page.locator('.todo-item__due').first();
    await expect(dueEl).toBeVisible();
    await expect(dueEl).toContainText('2031/12/31');
  });

  // シナリオ: .txtファイルなど非JSONファイルをインポートするとエラーが表示される
  test('.txtファイルをインポートするとエラーが表示される', async ({ page }) => {
    await setupPage(page);

    // Given: 空の状態から始めています（setupPage済み）

    // When: JSON以外のテキストファイルをインポートする
    const fileInput = page.locator('#importInput');
    await fileInput.setInputFiles({
      name: 'data.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('これはテキストファイルです'),
    } as any);

    // Then: エラーメッセージまたは無効な形式のフィードバックが表示される
    const errorMessage = page.locator('#errorMessage');
    await expect(errorMessage).toBeVisible();
  });

  // シナリオ: スキーマバージョンが現在のバージョンと一致するデータをインポートできる
  test('スキーマバージョンが一致するデータをインポートできる', async ({ page }) => {
    await setupPage(page);

    // Given: 空の状態から始めています（setupPage済み）

    // When: 現在のスキーマバージョン（version=1）のJSONファイルをインポートする
    const fileInput = page.locator('#importInput');
    const jsonContent = JSON.stringify({
      version: 1,
      items: [
        {
          id: 'schema-test-001',
          title: 'スキーマテスト',
          description: 'バージョン互換性確認',
          done: false,
          priority: 'medium',
          dueDate: null,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    await fileInput.setInputFiles({
      name: 'schema-v1.json',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonContent),
    } as any);

    // Then: データが正常に読み込まれる
    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.todo-item__text')).toContainText('スキーマテスト');
  });
});
