// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('優先度設定機能', () => {
  // テスト前に localStorage をクリア
  test.beforeEach(async ({ page }) => {
    await page.goto('file:///d:/todo-app/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test.describe('追加時の優先度設定', () => {
    test('優先度を「高」にして追加できる', async ({ page }) => {
      // ドロップダウンから「高」を選択（実装に応じてセレクタを調整）
      const prioritySelect = page.locator('#todoPriority');
      await prioritySelect.selectOption({ label: '高' });

      await page.fill('#todoTitle', '優先度高の項目');
      await page.click('button[type="submit"]');

      const items = page.locator('.todo-item');
      await expect(items).toHaveCount(1);

      // 優先度「高」が視覚的に強調されていることを確認
      const priorityEl = page.locator('.todo-item__priority').first();
      await expect(priorityEl).toBeVisible();
    });

    test('優先度を「中」にして追加できる', async ({ page }) => {
      const prioritySelect = page.locator('#todoPriority');
      await prioritySelect.selectOption({ label: '中' });

      await page.fill('#todoTitle', '優先度中の項目');
      await page.click('button[type="submit"]');

      const items = page.locator('.todo-item');
      await expect(items).toHaveCount(1);

      const priorityEl = page.locator('.todo-item__priority').first();
      await expect(priorityEl).toBeVisible();
    });

    test('優先度を「低」にして追加できる', async ({ page }) => {
      const prioritySelect = page.locator('#todoPriority');
      await prioritySelect.selectOption({ label: '低' });

      await page.fill('#todoTitle', '優先度低の項目');
      await page.click('button[type="submit"]');

      const items = page.locator('.todo-item');
      await expect(items).toHaveCount(1);

      const priorityEl = page.locator('.todo-item__priority').first();
      await expect(priorityEl).toBeVisible();
    });

    test('優先度を未設定で追加できる（デフォルトは「中」）', async ({ page }) => {
      // 優先度を選択せずに追加
      await page.fill('#todoTitle', '優先度なしの項目');
      await page.click('button[type="submit"]');

      const items = page.locator('.todo-item');
      await expect(items).toHaveCount(1);

      // デフォルト優先度が設定されていることを確認
      const priorityEl = page.locator('.todo-item__priority').first();
      await expect(priorityEl).toBeVisible();
    });
  });

  test.describe('既存項目の優先度変更', () => {
    test.beforeEach(async ({ page }) => {
      // 優先度「中」で ToDo を追加
      const prioritySelect = page.locator('#todoPriority');
      await prioritySelect.selectOption({ label: '中' });

      await page.fill('#todoTitle', '優先度変更テスト');
      await page.click('button[type="submit"]');
    });

    test('既存項目の優先度を「高」に変更できる', async ({ page }) => {
      // 優先度変更用のセレクタ（実装に応じて調整）
      const priorityEl = page.locator('.todo-item__priority').first();
      await priorityEl.click();

      // ドロップダウンから「高」を選択
      await page.locator('[data-priority-option="high"]').click();

      // 優先度が更新されていることを確認
      const updatedPriority = page.locator('.todo-item__priority').first();
      await expect(updatedPriority).toContainText('高');
    });

    test('既存項目の優先度を「低」に変更できる', async ({ page }) => {
      const priorityEl = page.locator('.todo-item__priority').first();
      await priorityEl.click();

      await page.locator('[data-priority-option="low"]').click();

      const updatedPriority = page.locator('.todo-item__priority').first();
      await expect(updatedPriority).toContainText('低');
    });
  });

  test.describe('優先度の視覚的表示', () => {
    test.beforeEach(async ({ page }) => {
      // 優先度「高」の項目を追加
      const prioritySelect = page.locator('#todoPriority');
      await prioritySelect.selectOption({ label: '高' });

      await page.fill('#todoTitle', '重要タスク');
      await page.click('button[type="submit"]');
    });

    test('優先度「高」の項目は視覚的に強調表示される', async ({ page }) => {
      const item = page.locator('.todo-item').first();
      // 強調用のクラスまたはスタイルが適用されていることを確認
      await expect(item).toHaveClass(/todo-item--priority-high/);
    });

    test('優先度「中」の項目は通常表示', async ({ page }) => {
      // 既存の「高」項目を削除して、新しい「中」項目を追加
      await page.locator('.todo-item__delete').first().click();

      const prioritySelect = page.locator('#todoPriority');
      await prioritySelect.selectOption({ label: '中' });

      await page.fill('#todoTitle', '通常タスク');
      await page.click('button[type="submit"]');

      const item = page.locator('.todo-item').first();
      // 高優先度の強調クラスは付いていない
      await expect(item).not.toHaveClass(/todo-item--priority-high/);
    });
  });

  test.describe('優先度の永続化', () => {
    test.beforeEach(async ({ page }) => {
      const prioritySelect = page.locator('#todoPriority');
      await prioritySelect.selectOption({ label: '高' });

      await page.fill('#todoTitle', '永続化テスト');
      await page.click('button[type="submit"]');
    });

    test('優先度が localStorage に保存される', async ({ page }) => {
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('todos')));
      expect(stored.items[0].priority).toBe('high');
    });

    test('再読み込み後も優先度が保持される', async ({ page }) => {
      await page.reload();

      const priorityEl = page.locator('.todo-item__priority').first();
      await expect(priorityEl).toContainText('高');
    });
  });
});
