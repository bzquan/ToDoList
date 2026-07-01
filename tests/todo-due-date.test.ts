// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('期限日付機能', () => {
  // テスト前に localStorage をクリア
  test.beforeEach(async ({ page }) => {
    await page.goto('file:///d:/todo-app/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test.describe('追加時の期限日設定', () => {
    test('追加時に期限日を設定できる', async ({ page }) => {
      // 未来の日付を設定（2030年を仮定）
      await page.fill('#todoTitle', '期限あり');
      await page.fill('#todoDueDate', '2030-12-31');
      await page.click('button[type="submit"]');

      const dueEl = page.locator('.todo-item__due').first();
      await expect(dueEl).toBeVisible();
      // 表示形式は y/m/d に整形される
      await expect(dueEl).toContainText('2030/12/31');
    });

    test('期限日なしで追加できる', async ({ page }) => {
      await page.fill('#todoTitle', '期限なし');
      await page.click('button[type="submit"]');

      // 期限なし → 「期限設定」リンクが表示される
      const dueLink = page.locator('[data-editable-due]');
      await expect(dueLink).toContainText('期限設定');
    });
  });

  test.describe('既存項目の期限日変更', () => {
    test.beforeEach(async ({ page }) => {
      // 期限ありの ToDo を追加
      await page.fill('#todoTitle', '期限変更テスト');
      await page.fill('#todoDueDate', '2030-06-15');
      await page.click('button[type="submit"]');
    });

    test('期限テキストをクリックして編集できる', async ({ page }) => {
      const dueEl = page.locator('[data-editable-due]').first();
      await expect(dueEl).toContainText('2030/06/15');

      // クリックでインライン入力に切り替え
      await dueEl.click();

      await expect(page.locator('.todo-item__due-input')).toHaveValue('2030-06-15');
    });

    test('新しい期限日を設定して保存できる', async ({ page }) => {
      const dueEl = page.locator('[data-editable-due]').first();
      await dueEl.click();

      // 日付を変更して保存ボタンをクリック
      await page.locator('.todo-item__due-input').fill('2031-01-01');
      await page.locator('.todo-item__due-save').click();

      await expect(page.locator('.todo-item__due')).toContainText('2031/01/01');
    });

    test('Enter キーで期限日を変更できる', async ({ page }) => {
      const dueEl = page.locator('[data-editable-due]').first();
      await dueEl.click();

      // 日付を変更して Enter
      await page.locator('.todo-item__due-input').fill('2031-06-01');
      await page.locator('.todo-item__due-input').press('Enter');

      await expect(page.locator('.todo-item__due')).toContainText('2031/06/01');
    });

    test('期限日を空にして削除できる', async ({ page }) => {
      const dueEl = page.locator('[data-editable-due]').first();
      await dueEl.click();

      // 空にして保存
      await page.locator('.todo-item__due-input').fill('');
      await page.locator('.todo-item__due-save').click();

      // 期限表示が非表示になる（期限設定リンクが表示される）
      const dueLink = page.locator('[data-editable-due]');
      await expect(dueLink).toContainText('期限設定');
    });

    test('localStorage に保存される', async ({ page }) => {
      const dueEl = page.locator('[data-editable-due]').first();
      await dueEl.click();

      await page.locator('.todo-item__due-input').fill('2032-12-25');
      await page.locator('.todo-item__due-save').click();

      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('todos')));
      expect(stored.items[0].dueDate).toBe('2032-12-25');

      // 再読み込み後も表示される
      await page.reload();
      await expect(page.locator('.todo-item__due')).toContainText('2032/12/25');
    });
  });

  test.describe('期限未設定項目の期限追加', () => {
    test.beforeEach(async ({ page }) => {
      // 期限なしで ToDo を追加
      await page.fill('#todoTitle', '期限後から設定');
      await page.click('button[type="submit"]');
    });

    test('「期限設定」リンクが表示される', async ({ page }) => {
      const dueLink = page.locator('[data-editable-due]');
      await expect(dueLink).toBeVisible();
      await expect(dueLink).toContainText('期限設定');
    });

    test('「期限設定」をクリックして期限を追加できる', async ({ page }) => {
      const dueLink = page.locator('[data-editable-due]').first();
      await dueLink.click();

      // インライン入力に切り替わる
      await expect(page.locator('.todo-item__due-input')).toBeVisible();

      // 日付を設定して保存
      await page.locator('.todo-item__due-input').fill('2030-09-15');
      await page.locator('.todo-item__due-save').click();

      // 期限が表示される
      await expect(page.locator('.todo-item__due')).toContainText('2030/09/15');
    });
  });

  test.describe('完了済み項目の期限日', () => {
    test.beforeEach(async ({ page }) => {
      // 期限ありの ToDo を追加して完了にする
      await page.fill('#todoTitle', '完了済み');
      await page.fill('#todoDueDate', '2030-01-01');
      await page.click('button[type="submit"]');

      await page.locator('.todo-item__checkbox').first().check();
    });

    test('完了済みの項目でも期限日を変更できる', async ({ page }) => {
      const dueEl = page.locator('[data-editable-due]').first();
      await dueEl.click();

      await page.locator('.todo-item__due-input').fill('2031-05-05');
      await page.locator('.todo-item__due-save').click();

      await expect(page.locator('.todo-item__due')).toContainText('2031/05/05');
    });
  });
});
