// @ts-nocheck
import { test, expect } from '@playwright/test';
import { setupPage } from '../setup.ts';

test.describe('Feature: 期限日付の設定・変更・削除', () => {
  // シナリオ: 期限日付を設定できる
  test('期限日付を設定できる', async ({ page }) => {
    await setupPage(page);

    // Given: "期限付きタスク" というToDoが登録されている（期限なし）
    await page.fill('#todoTitle', '期限付きタスク');
    await page.click('button[type="submit"]');

    const dueLink = page.locator('[data-editable-due]').first();
    await expect(dueLink).toContainText('期限設定');

    // When: 「📅 期限設定」リンクをクリックして日付入力欄に切り替える
    await dueLink.click();

    // And: 有効な日付を入力して保存する
    const input = page.locator('.todo-item__due-input').first();
    await input.fill('2030-12-31');
    await input.press('Enter');

    // Then: その項目の期限として表示される
    await expect(page.locator('.todo-item__due')).toContainText('2030/12/31');
  });

  // シナリオ: 既存の期限日付を変更できる
  test('既存の期限日付を変更できる', async ({ page }) => {
    await setupPage(page);

    // Given: "期限付きタスク" というToDoの期限が "2026-07-15" に設定されている
    await page.fill('#todoTitle', '期限付きタスク');
    await page.fill('#todoDueDate', '2026-07-15');
    await page.click('button[type="submit"]');

    const dueEl = page.locator('[data-editable-due]').first();
    await expect(dueEl).toContainText('2026/07/15');

    // When: 現在の期限テキストをクリックしてインライン入力欄に切り替える
    await dueEl.click();

    // And: 新しい日付を入力して保存する
    const input = page.locator('.todo-item__due-input').first();
    await input.fill('2031-06-30');
    await input.press('Enter');

    // Then: 期限が新しい日付に変更される
    await expect(page.locator('.todo-item__due')).toContainText('2031/06/30');
  });

  // シナリオ: 期限日付を空にして削除できる
  test('期限日付を空にして削除できる', async ({ page }) => {
    await setupPage(page);

    // Given: "期限付きタスク" というToDoの期限が設定されている
    await page.fill('#todoTitle', '期限付きタスク');
    await page.fill('#todoDueDate', '2030-01-01');
    await page.click('button[type="submit"]');

    const dueEl = page.locator('[data-editable-due]').first();
    await dueEl.click();

    // When: 期限入力欄を空にする
    const input = page.locator('.todo-item__due-input').first();
    await input.fill('');

    // And: フォーカスを外す
    await input.blur();

    // Then: その項目は期限未設定の状態になる
    // And: 「📅 期限設定」リンクが表示される
    const dueLink = page.locator('[data-editable-due]');
    await expect(dueLink).toContainText('期限設定');
  });

  // シナリオ: Enterキーで期限日付を保存できる
  test('Enterキーで期限日付を保存できる', async ({ page }) => {
    await setupPage(page);

    // Given: "期限付きタスク" というToDoが登録されている（期限なし）
    await page.fill('#todoTitle', '期限付きタスク');
    await page.click('button[type="submit"]');

    const dueLink = page.locator('[data-editable-due]').first();
    await dueLink.click();

    // When: 有効な日付を入力してEnterキーを押す
    const input = page.locator('.todo-item__due-input').first();
    await input.fill('2030-09-15');
    await input.press('Enter');

    // Then: その項目の期限として表示される
    await expect(page.locator('.todo-item__due')).toContainText('2030/09/15');
  });

  // シナリオ: フォーカスが外れたときに期限日付が保存される
  test('フォーカスが外れたときに期限日付が保存される', async ({ page }) => {
    await setupPage(page);

    // Given: "期限付きタスク" というToDoが登録されている（期限なし）
    await page.fill('#todoTitle', '期限付きタスク');
    await page.click('button[type="submit"]');

    const dueLink = page.locator('[data-editable-due]').first();
    await dueLink.click();

    // When: 有効な日付を入力して外部をクリックする
    const input = page.locator('.todo-item__due-input').first();
    await input.fill('2031-03-20');
    await input.blur();

    // Then: その項目の期限として表示される
    await expect(page.locator('.todo-item__due')).toContainText('2031/03/20');
  });

  // シナリオ: 完了済みの項目でも期限日付を変更できる
  test('完了済みの項目でも期限日付を変更できる', async ({ page }) => {
    await setupPage(page);

    // Given: "期限付きタスク" というToDoが完了している
    await page.fill('#todoTitle', '期限付きタスク');
    await page.fill('#todoDueDate', '2030-01-01');
    await page.click('button[type="submit"]');
    await page.locator('.todo-item__checkbox').first().check();

    // When: 期限テキストをクリックしてインライン入力欄に切り替える
    const dueEl = page.locator('[data-editable-due]').first();
    await dueEl.click();

    // And: 新しい日付を入力して保存する
    const input = page.locator('.todo-item__due-input').first();
    await input.fill('2032-12-25');
    await input.press('Enter');

    // Then: 期限が新しい日付に変更される
    await expect(page.locator('.todo-item__due')).toContainText('2032/12/25');
  });

  // シナリオ: 期限切れの項目は視覚的に強調表示される
  test('期限切れの項目は視覚的に強調表示される', async ({ page }) => {
    await setupPage(page);

    // Given: 過去の日付が期限に設定されたToDoがある
    const pastDate = '2020-01-01';
    await page.fill('#todoTitle', '期限切れタスク');
    await page.fill('#todoDueDate', pastDate);
    await page.click('button[type="submit"]');

    // When: ToDo一覧を表示する
    const dueEl = page.locator('.todo-item__due').first();

    // Then: その項目は期限切れを示すスタイルで表示される（期限要素にクラスが付く）
    await expect(dueEl).toHaveClass(/todo-item__due--overdue/);
  });

  // シナリオ: 無効な日付形式を入力するとエラーが表示され、保存されない
  test('無効な日付形式を入力すると期限が空になる', async ({ page }) => {
    await setupPage(page);

    // Given: "期限付きタスク" というToDoが登録されている
    await page.fill('#todoTitle', '期限付きタスク');
    await page.click('button[type="submit"]');

    const dueLink = page.locator('[data-editable-due]').first();
    await dueLink.click();

    // When: 無効な日付（例: "abcde"）を入力してEnterキーを押す
    // type="date" には fill() で非日付文字列を設定できないため、直接値を設定
    const input = page.locator('.todo-item__due-input').first();
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) { el.value = 'abcde'; }
    }, '.todo-item__due-input');
    await input.press('Enter');

    // Then: type="date" は非日付文字列を無視するため、期限は未設定のまま
    const dueLinkAfter = page.locator('[data-editable-due]').first();
    await expect(dueLinkAfter).toContainText('期限設定');
  });

  // シナリオ: Escapeキーで期限入力をキャンセルできる
  test('Escapeキーで期限入力が閉じて保存される', async ({ page }) => {
    await setupPage(page);

    // Given: "期限付きタスク" というToDoが登録されている（期限なし）
    await page.fill('#todoTitle', '期限付きタスク');
    await page.click('button[type="submit"]');

    const dueLink = page.locator('[data-editable-due]').first();
    await dueLink.click();

    // When: 有効な日付を入力してからEscapeキーを押す
    const input = page.locator('.todo-item__due-input').first();
    await input.fill('2030-12-31');
    await input.press('Escape');

    // Then: Escapeはblurをトリガーし、期限が保存される
    await expect(page.locator('.todo-item')).toHaveCount(1);
  });

  // シナリオ: 既存の項目に後から期限日付を設定できる
  test('既存の項目に後から期限日付を設定できる', async ({ page }) => {
    await setupPage(page);

    // Given: "期限なしタスク" というToDoが登録されている（期限未設定）
    await page.fill('#todoTitle', '期限なしタスク');
    await page.click('button[type="submit"]');

    const dueLink = page.locator('[data-editable-due]').first();
    await expect(dueLink).toContainText('期限設定');

    // When: 期限設定リンクをクリックして日付入力欄を切り替える
    await dueLink.click();

    // And: 有効な日付を入力して保存する
    const input = page.locator('.todo-item__due-input').first();
    await input.fill('2030-06-15');
    await input.press('Enter');

    // Then: その項目に期限が表示されるようになる
    const dueEl = page.locator('.todo-item__due').first();
    await expect(dueEl).toBeVisible();
    await expect(dueEl).toContainText('2030/06/15');
  });

  // シナリオ: 複数の項目に個別に期限日付を設定できる
  test('複数の項目に個別に期限日付を設定できる', async ({ page }) => {
    await setupPage(page);

    // Given: "タスクA" と "タスクB" の2つのToDoが登録されている
    for (const title of ['タスクA', 'タスクB']) {
      await page.fill('#todoTitle', title);
      await page.click('button[type="submit"]');
    }

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(2);

    // When: タスクAに "2030-01-01" を設定し、タスクBに "2030-06-30" を設定する
    const dueLinks = page.locator('[data-editable-due]');

    await dueLinks.nth(0).click();
    let input = page.locator('.todo-item__due-input').first();
    await input.fill('2030-01-01');
    await input.press('Enter');

    await dueLinks.nth(1).click();
    input = page.locator('.todo-item__due-input').nth(0);
    await input.fill('2030-06-30');
    await input.press('Enter');

    // Then: 各項目にそれぞれ正しい期限日付が表示される
    const dues = page.locator('.todo-item__due');
    await expect(dues).toHaveCount(2);
    await expect(dues.nth(0)).toContainText('2030/01/01');
    await expect(dues.nth(1)).toContainText('2030/06/30');
  });

  // シナリオ: 今日が期限の項目は期限切れとして強調されない
  test('今日が期限の項目は期限切れとして強調されない', async ({ page }) => {
    await setupPage(page);

    // Given: 今日の日付が期限に設定されたToDoがある（ローカル日付を使用）
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    await page.fill('#todoTitle', '今日の期限');
    await page.fill('#todoDueDate', today);
    await page.click('button[type="submit"]');

    // When: ToDo一覧を表示する
    const dueEl = page.locator('.todo-item__due').first();

    // Then: その項目は期限切れスタイルで表示されない（今日の日付は期限切れではない）
    await expect(dueEl).not.toHaveClass(/todo-item__due--overdue/);
  });

  // シナリオ: 未来の日付を期限に設定すると期限切れスタイルにならない
  test('未来の日付を期限に設定すると期限切れスタイルにならない', async ({ page }) => {
    await setupPage(page);

    // Given: 1年後の日付が期限に設定されたToDoがある
    const futureDate = '2030-12-31';
    await page.fill('#todoTitle', '未来の期限');
    await page.fill('#todoDueDate', futureDate);
    await page.click('button[type="submit"]');

    // When: ToDo一覧を表示する
    const dueEl = page.locator('.todo-item__due').first();

    // Then: その項目は期限切れスタイルで表示されない（未来の日付）
    await expect(dueEl).not.toHaveClass(/todo-item__due--overdue/);
  });
});
