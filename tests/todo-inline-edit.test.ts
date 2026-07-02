// @ts-nocheck
import { test, expect } from '@playwright/test';
import { setupPage } from './setup.ts';

test.describe('インライン編集機能', () => {
  // テスト前に localStorage をクリア
  test.beforeEach(async ({ page }) => {
    await setupPage(page);

    // ToDo を追加しておく
    await page.fill('#todoTitle', '編集テスト');
    await page.fill('#todoDescription', '元の詳細');
    await page.click('button[type="submit"]');
  });

  test.describe('タイトルのインライン編集', () => {
    test('タイトルをクリックして編集できる', async ({ page }) => {
      const titleEl = page.locator('[data-editable-title]');
      await expect(titleEl).toBeVisible();

      // タイトルテキストをクリック
      await titleEl.click();

      // input に切り替わる
      await expect(page.locator('.todo-item__title-input')).toHaveValue('編集テスト');

      // 値を変更して Enter で保存
      await page.locator('.todo-item__title-input').fill('新しいタイトル');
      await page.locator('.todo-item__title-input').press('Enter');

      // タイトルが更新されている
      await expect(page.locator('.todo-item__text')).toContainText('新しいタイトル');
    });

    test('Enter キーでタイトルを保存できる', async ({ page }) => {
      const titleEl = page.locator('[data-editable-title]');
      await titleEl.click();

      // 値を変更して Enter
      await page.locator('.todo-item__title-input').fill('Enter保存');
      await page.locator('.todo-item__title-input').press('Enter');

      await expect(page.locator('.todo-item__text')).toContainText('Enter保存');
    });

    test('タイトルを空にすると元に戻る', async ({ page }) => {
      const titleEl = page.locator('[data-editable-title]');
      await titleEl.click();

      // 空にして Enter で保存（元に戻る）
      await page.locator('.todo-item__title-input').fill('');
      await page.locator('.todo-item__title-input').press('Enter');

      // 元に戻っている（再レンダリングされる）
      await expect(page.locator('[data-editable-title]')).toBeVisible();
      await expect(page.locator('.todo-item__text')).toContainText('編集テスト');
    });

    test('タイトルを空にして Enter しても元に戻る', async ({ page }) => {
      const titleEl = page.locator('[data-editable-title]');
      await titleEl.click();

      await page.locator('.todo-item__title-input').fill('');
      await page.locator('.todo-item__title-input').press('Enter');

      await expect(page.locator('[data-editable-title]')).toBeVisible();
    });

    test('localStorage に保存される', async ({ page }) => {
      const titleEl = page.locator('[data-editable-title]');
      await titleEl.click();

      await page.locator('.todo-item__title-input').fill('永続化タイトル');
      await page.locator('.todo-item__title-input').press('Enter');

      // localStorage を確認
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('todos')));
      expect(stored.items[0].title).toBe('永続化タイトル');

      // 再読み込み後も表示される
      await page.reload();
      await expect(page.locator('.todo-item__text')).toContainText('永続化タイトル');
    });
  });

  test.describe('詳細のインライン編集', () => {
    test('詳細テキストをクリックして編集できる', async ({ page }) => {
      const descEl = page.locator('[data-editable-description]');
      await expect(descEl).toBeVisible();

      // クリック
      await descEl.click();

      // textarea に切り替わる
      await expect(page.locator('.todo-item__desc-input')).toHaveValue('元の詳細');

      // 値を変更して Enter で保存
      await page.locator('.todo-item__desc-input').fill('新しい詳細');
      await page.locator('.todo-item__desc-input').press('Enter');

      await expect(page.locator('.todo-item__description')).toContainText('新しい詳細');
    });

    test('Enter キーで詳細を保存できる', async ({ page }) => {
      const descEl = page.locator('[data-editable-description]');
      await descEl.click();

      // 値を変更して Enter（Shift なし）
      await page.locator('.todo-item__desc-input').fill('Enter保存詳細');
      await page.locator('.todo-item__desc-input').press('Enter');

      await expect(page.locator('.todo-item__description')).toContainText('Enter保存詳細');
    });

    test('Shift+Enter で改行できる', async ({ page }) => {
      const descEl = page.locator('[data-editable-description]');
      await descEl.click();

      // Shift+Enter で改行
      await page.locator('.todo-item__desc-input').fill('一行目');
      await page.locator('.todo-item__desc-input').press('Shift+Enter');
      await page.locator('.todo-item__desc-input').type('二行目');

      // 保存
      await page.locator('.todo-item__desc-input').press('Enter');

      // 改行が保持されていることを確認（white-space: pre-wrap）
      const text = await page.locator('.todo-item__description').textContent();
      expect(text).toContain('一行目');
      expect(text).toContain('二行目');
    });

    test('詳細を空にすると非表示になる', async ({ page }) => {
      const descEl = page.locator('[data-editable-description]');
      await descEl.click();

      // 空にして Enter で保存
      await page.locator('.todo-item__desc-input').fill('');
      await page.locator('.todo-item__desc-input').press('Enter');

      // 詳細が非表示になる
      await expect(page.locator('.todo-item__description')).not.toBeVisible();
    });

    test('localStorage に保存される', async ({ page }) => {
      const descEl = page.locator('[data-editable-description]');
      await descEl.click();

      await page.locator('.todo-item__desc-input').fill('永続化詳細');
      await page.locator('.todo-item__desc-input').press('Enter');

      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('todos')));
      expect(stored.items[0].description).toBe('永続化詳細');

      // 再読み込み後も表示される
      await page.reload();
      await expect(page.locator('.todo-item__description')).toContainText('永続化詳細');
    });
  });

  test.describe('完了切替との連携', () => {
    test('完了にするとタイトルと詳細に取り消し線が引かれる', async ({ page }) => {
      const checkbox = page.locator('.todo-item__checkbox').first();
      await checkbox.check();

      await expect(page.locator('.todo-item__text')).toHaveClass(/todo-item__text--done/);
    });

    test('完了解除すると取り消し線が外れる', async ({ page }) => {
      const checkbox = page.locator('.todo-item__checkbox').first();
      // 先に完了にする
      await checkbox.check();
      // 再度チェックで未完了に戻す
      await checkbox.uncheck();

      await expect(page.locator('.todo-item__text')).not.toHaveClass(/todo-item__text--done/);
    });
  });
});
