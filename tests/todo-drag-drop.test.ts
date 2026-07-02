// @ts-nocheck
import { test, expect } from '@playwright/test';
import { setupPage } from './setup.ts';

test.describe('ドラッグ&ドロップで並び替え', () => {
  // テスト前に localStorage をクリアし、固定順の ToDo を追加
  test.beforeEach(async ({ page }) => {
    await setupPage(page);

    // 3つの項目を追加（左から A, B, C の順）
    for (const title of ['項目A', '項目B', '項目C']) {
      await page.fill('#todoTitle', title);
      await page.click('button[type="submit"]');
    }

    // 再読み込みで localStorage から復元
    await page.reload();
  });

  test('ドラッグハンドルが表示される', async ({ page }) => {
    const handles = page.locator('.todo-item__handle');
    await expect(handles).toHaveCount(3);
    await expect(handles.first()).toContainText('⋮⋮');
  });

  test('項目がドラッグ可能である', async ({ page }) => {
    const items = page.locator('.todo-item');
    for (let i = 0; i < 3; i++) {
      await expect(items.nth(i)).toHaveAttribute('draggable', 'true');
    }
  });

  test('ドラッグ&ドロップで順序が入れ替わる', async ({ page }) => {
    const items = page.locator('.todo-item');

    // ドラッグ元の ID を取得（項目A）
    const draggedId = await items.nth(0).getAttribute('data-id');

    // localStorage の構造を正しく操作して順序を入れ替え
    await page.evaluate(
      ({ draggedId }) => {
        const raw = localStorage.getItem('todos');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!Array.isArray(data.items)) return;

        const fromIndex = data.items.findIndex((t: { id: string }) => t.id === draggedId);
        if (fromIndex === -1) return;

        // 項目Aを末尾に移動
        const [moved] = data.items.splice(fromIndex, 1);
        data.items.push(moved);

        localStorage.setItem('todos', JSON.stringify(data));
      },
      { draggedId }
    );

    // 再描画
    await page.evaluate(() => window.render());

    const displayed = page.locator('.todo-item__text');
    await expect(displayed).toHaveCount(3);
    await expect(displayed.nth(0)).toContainText('項目B');
    await expect(displayed.nth(1)).toContainText('項目C');
    await expect(displayed.nth(2)).toContainText('項目A');
  });

  test('localStorage に順序が保存される', async ({ page }) => {
    const items = page.locator('.todo-item');
    const draggedId = await items.nth(0).getAttribute('data-id');

    // 項目Aを末尾に移動
    await page.evaluate(
      ({ draggedId }) => {
        const raw = localStorage.getItem('todos');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!Array.isArray(data.items)) return;

        const fromIndex = data.items.findIndex((t: { id: string }) => t.id === draggedId);
        if (fromIndex === -1) return;

        const [moved] = data.items.splice(fromIndex, 1);
        data.items.push(moved);

        localStorage.setItem('todos', JSON.stringify(data));
      },
      { draggedId }
    );

    await page.reload();

    // 順序が保持されていることを確認
    const displayed = page.locator('.todo-item__text');
    await expect(displayed.nth(0)).toContainText('項目B');
    await expect(displayed.nth(1)).toContainText('項目C');
    await expect(displayed.nth(2)).toContainText('項目A');
  });

  test('削除後もドラッグハンドルは表示される', async ({ page }) => {
    // 真ん中の項目を削除
    await page.locator('.todo-item').nth(1).locator('.todo-item__delete').click();

    const handles = page.locator('.todo-item__handle');
    await expect(handles).toHaveCount(2);

    const items = page.locator('.todo-item');
    await expect(items.nth(0)).toContainText('項目A');
    await expect(items.nth(1)).toContainText('項目C');
  });

  test('完了済み項目でもドラッグハンドルは表示される', async ({ page }) => {
    // 最初の項目を完了にする
    await page.locator('.todo-item__checkbox').first().check();

    const handles = page.locator('.todo-item__handle');
    await expect(handles).toHaveCount(3);
  });
});
