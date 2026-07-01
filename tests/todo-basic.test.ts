// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('ToDo 基本機能', () => {
  // テスト前に localStorage をクリア
  test.beforeEach(async ({ page }) => {
    await page.goto('file:///d:/todo-app/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('空タイトルで追加するとエラーが表示される', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('#errorMessage')).toBeVisible();
    await expect(page.locator('#errorMessage')).toContainText('タイトルを入力してください');
  });

  test('タイトルのみで ToDo を追加できる', async ({ page }) => {
    await page.fill('#todoTitle', 'テスト用ToDo');
    await page.click('button[type="submit"]');

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.todo-item__text')).toContainText('テスト用ToDo');
  });

  test('タイトルと詳細で ToDo を追加できる', async ({ page }) => {
    await page.fill('#todoTitle', '買い物');
    await page.fill('#todoDescription', '牛乳と卵を買う');
    await page.click('button[type="submit"]');

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.todo-item__text')).toContainText('買い物');
    await expect(page.locator('.todo-item__description')).toContainText('牛乳と卵を買う');
  });

  test('詳細なしで ToDo を追加できる', async ({ page }) => {
    await page.fill('#todoTitle', '詳細なしの項目');
    await page.click('button[type="submit"]');

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    // 詳細テキストは表示されない
    await expect(page.locator('.todo-item__description')).not.toBeVisible();
  });

  test('複数の ToDo を追加でき、新しい順に表示される', async ({ page }) => {
    await page.fill('#todoTitle', '項目A');
    await page.click('button[type="submit"]');
    await page.fill('#todoTitle', '項目B');
    await page.click('button[type="submit"]');

    const items = page.locator('.todo-item .todo-item__text');
    await expect(items).toHaveCount(2);
    // 追加順に描画（localStorage の配列順）
    await expect(items.nth(0)).toContainText('項目A');
    await expect(items.nth(1)).toContainText('項目B');
  });

  test('localStorage に保存され、再読み込み後も表示される', async ({ page }) => {
    await page.fill('#todoTitle', '永続化テスト');
    await page.click('button[type="submit"]');

    // localStorage の内容を確認
    const stored = await page.evaluate(() => localStorage.getItem('todos'));
    expect(stored).toBeTruthy();
    const data = JSON.parse(stored);
    expect(data.items.length).toBe(1);
    expect(data.items[0].title).toBe('永続化テスト');

    // 再読み込み
    await page.reload();
    await expect(page.locator('.todo-item__text')).toContainText('永続化テスト');
  });

  test('空リストのとき「ToDoがありません」と表示される', async ({ page }) => {
    await expect(page.locator('.todo-list__empty')).toBeVisible();
    await expect(page.locator('.todo-list__empty')).toContainText('ToDoがありません');
  });

  test('完了チェックボックスで状態を切り替えられる', async ({ page }) => {
    await page.fill('#todoTitle', '完了テスト');
    await page.click('button[type="submit"]');

    const checkbox = page.locator('.todo-item__checkbox').first();
    // 初期は未チェック
    await expect(checkbox).not.toBeChecked();

    // チェック → 完了
    await checkbox.check();
    await expect(page.locator('.todo-item__text')).toHaveClass(/todo-item__text--done/);

    // 再度チェック → 未完了
    await checkbox.uncheck();
    await expect(page.locator('.todo-item__text')).not.toHaveClass(/todo-item__text--done/);
  });

  test('削除ボタンで項目を削除できる', async ({ page }) => {
    await page.fill('#todoTitle', '削除テスト');
    await page.click('button[type="submit"]');

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);

    // 削除ボタンをクリック
    await page.locator('.todo-item__delete').first().click();

    await expect(page.locator('.todo-list__empty')).toBeVisible();
  });

  test('複数の項目を削除できる', async ({ page }) => {
    for (const title of ['A', 'B', 'C']) {
      await page.fill('#todoTitle', `項目${title}`);
      await page.click('button[type="submit"]');
    }

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(3);

    // 真ん中を削除
    await page.locator('.todo-item').nth(1).locator('.todo-item__delete').click();

    await expect(page.locator('.todo-item')).toHaveCount(2);
  });
});
