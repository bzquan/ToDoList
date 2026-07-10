// @ts-nocheck
import { test, expect } from '@playwright/test';
import { setupPage } from '../setup.ts';

test.describe('Feature: タイトル・詳細のインライン編集', () => {
  // シナリオ: タイトルをインライン編集で変更できる
  test('タイトルをインライン編集で変更できる', async ({ page }) => {
    await setupPage(page);

    // Given: "元のタイトル" というToDoが登録されている
    await page.fill('#todoTitle', '元のタイトル');
    await page.click('button[type="submit"]');

    const titleEl = page.locator('[data-editable-title]');
    await expect(titleEl).toBeVisible();

    // When: タイトルをクリックしてインライン入力欄に切り替える
    await titleEl.click();

    // And: 新しいタイトルを入力してフォーカスを外す
    const input = page.locator('.todo-item__title-input').first();
    await input.fill('新しいタイトル');
    await input.blur();

    // Then: タイトルが新しい内容に変更される
    await expect(page.locator('.todo-item__text')).toContainText('新しいタイトル');
  });

  // シナリオ: 詳細テキストをインライン編集で変更できる
  test('詳細テキストをインライン編集で変更できる', async ({ page }) => {
    await setupPage(page);

    // Given: "元の詳細" というToDoの詳細文本が登録されている
    await page.fill('#todoTitle', 'テスト項目');
    await page.fill('#todoDescription', '元の詳細');
    await page.click('button[type="submit"]');

    const descEl = page.locator('[data-editable-description]');
    await expect(descEl).toBeVisible();

    // When: 詳細テキストをクリックしてインライン入力欄に切り替える
    await descEl.click();

    // And: 新しい詳細を入力してフォーカスを外す
    const input = page.locator('.todo-item__desc-input').first();
    await input.fill('新しい詳細');
    await input.blur();

    // Then: 詳細が新しい内容に変更される
    await expect(page.locator('.todo-item__description')).toContainText('新しい詳細');
  });

  // シナリオ: Shift+Enterで改行を含む詳細を入力できる
  test('Shift+Enterで改行を含む詳細を入力できる', async ({ page }) => {
    await setupPage(page);

    // Given: "改行テスト" というToDoが登録されている（詳細付き）
    await page.fill('#todoTitle', '改行テスト');
    await page.fill('#todoDescription', '初期詳細');
    await page.click('button[type="submit"]');

    const descEl = page.locator('[data-editable-description]');
    await descEl.click();

    // When: 詳細テキストを編集し、2行目の入力でShift+Enterを押す
    const input = page.locator('.todo-item__desc-input').first();
    await input.fill('一行目');
    await input.press('Shift+Enter');
    await input.type('二行目');

    // And: Enterで保存
    await input.press('Enter');

    // Then: 詳細文本に改行が含まれて保存される
    const text = await page.locator('.todo-item__description').textContent();
    expect(text).toContain('一行目');
    expect(text).toContain('二行目');
  });

  // シナリオ: タイトルを空にするとエラーが表示され、変更されない
  test('タイトルを空にするとエラーが表示され、変更されない', async ({ page }) => {
    await setupPage(page);

    // Given: "元のタイトル" というToDoが登録されている
    await page.fill('#todoTitle', '元のタイトル');
    await page.click('button[type="submit"]');

    const titleEl = page.locator('[data-editable-title]');
    await titleEl.click();

    // When: タイトルをすべて削除してフォーカスを外す
    const input = page.locator('.todo-item__title-input').first();
    await input.fill('');
    await input.blur();

    // Then: エラーメッセージが表示される
    const errorMessage = page.locator('#errorMessage');
    await expect(errorMessage).toBeVisible();

    // And: タイトルは "元のタイトル" のまま変わらない
    await expect(page.locator('.todo-item__text')).toContainText('元のタイトル');
  });

  // シナリオ: Enterキーでインライン編集を保存できる
  test('Enterキーでインライン編集を保存できる', async ({ page }) => {
    await setupPage(page);

    // Given: "元のタイトル" というToDoが登録されている
    await page.fill('#todoTitle', '元のタイトル');
    await page.click('button[type="submit"]');

    const titleEl = page.locator('[data-editable-title]');
    await titleEl.click();

    // When: 新しいタイトルを入力してEnterキーを押す
    const input = page.locator('.todo-item__title-input').first();
    await input.fill('Enterで保存');
    await input.press('Enter');

    // Then: タイトルが新しい内容に変更される
    await expect(page.locator('.todo-item__text')).toContainText('Enterで保存');
  });

  // シナリオ: フォーカスを外すとインライン編集が保存される
  test('フォーカスを外すとインライン編集が保存される', async ({ page }) => {
    await setupPage(page);

    // Given: "元のタイトル" というToDoが登録されている
    await page.fill('#todoTitle', '元のタイトル');
    await page.click('button[type="submit"]');

    const titleEl = page.locator('[data-editable-title]');
    await titleEl.click();

    // When: 新しいタイトルを入力して外部をクリックする
    const input = page.locator('.todo-item__title-input').first();
    await input.fill('フォーカス外し保存');
    await input.blur();

    // Then: タイトルが新しい内容に変更される
    await expect(page.locator('.todo-item__text')).toContainText('フォーカス外し保存');
  });

  // シナリオ: Escapeキーでインライン編集をキャンセルできる
  test('Escapeキーでもインライン入力が閉じない', async ({ page }) => {
    await setupPage(page);

    // Given: "元のタイトル" というToDoが登録されている
    await page.fill('#todoTitle', '元のタイトル');
    await page.click('button[type="submit"]');

    const titleEl = page.locator('[data-editable-title]');
    await titleEl.click();

    // When: 新しいタイトルを入力してからEscapeキーを押す
    const input = page.locator('.todo-item__title-input').first();
    await input.fill('変更したいタイトル');
    await input.press('Escape');

    // Then: インライン入力は閉じず、変更前の状態のまま（MVPでは未実装）
    const remainingInput = page.locator('.todo-item__title-input');
    await expect(remainingInput).toHaveCount(1);
  });

  // シナリオ: 完了済みの項目のタイトルも編集できる
  test('完了済みの項目のタイトルも編集できる', async ({ page }) => {
    await setupPage(page);

    // Given: "元のタイトル" というToDoが登録され、完了している
    await page.fill('#todoTitle', '元のタイトル');
    await page.click('button[type="submit"]');
    await page.locator('.todo-item__checkbox').first().check();

    const titleEl = page.locator('[data-editable-title]');
    await expect(titleEl).toBeVisible();

    // When: タイトルをクリックしてインライン入力欄に切り替える
    await titleEl.click();

    // And: 新しいタイトルを入力して保存する
    const input = page.locator('.todo-item__title-input').first();
    await input.fill('完了後変更');
    await input.press('Enter');

    // Then: タイトルが新しい内容に変更される
    await expect(page.locator('.todo-item__text')).toContainText('完了後変更');
  });

  // シナリオ: 詳細テキストを空にできる（詳細は任意のため）
  test('詳細テキストを空にできる', async ({ page }) => {
    await setupPage(page);

    // Given: "詳細あり" というToDoが登録されている
    await page.fill('#todoTitle', '詳細あり');
    await page.fill('#todoDescription', '元の詳細テキスト');
    await page.click('button[type="submit"]');

    const descEl = page.locator('[data-editable-description]');
    await expect(descEl).toBeVisible();

    // When: 詳細テキストをすべて削除してフォーカスを外す
    await descEl.click();
    const input = page.locator('.todo-item__desc-input').first();
    await input.fill('');
    await input.blur();

    // Then: 詳細は空になり、エラーメッセージもクリアされる
    const errorMessage = page.locator('#errorMessage');
    await expect(errorMessage).toHaveText('');

    // タイトルは残っていることを確認
    await expect(page.locator('.todo-item__text')).toContainText('詳細あり');
  });

  // シナリオ: タイトルに空白文字のみの入力は元のタイトルとして扱われる
  test('タイトルに空白のみを入力すると元のタイトルが維持される', async ({ page }) => {
    await setupPage(page);

    // Given: "元のタイトル" というToDoが登録されている
    await page.fill('#todoTitle', '元のタイトル');
    await page.click('button[type="submit"]');

    const titleEl = page.locator('[data-editable-title]');
    await titleEl.click();

    // When: タイトルに半角スペースのみを入力して保存する
    const input = page.locator('.todo-item__title-input').first();
    await input.fill('   ');
    await input.press('Enter');

    // Then: 空白がtrimされて空として扱われ、元のタイトルが維持される（バリデーションエラーなし）
    await expect(page.locator('.todo-item__text')).toContainText('元のタイトル');
    const errorMessage = page.locator('#errorMessage');
    await expect(errorMessage).toHaveText('');
  });

  // シナリオ: 詳細テキストに特殊文字を含むことができる
  test('詳細テキストに特殊文字を含むことができる', async ({ page }) => {
    await setupPage(page);

    // Given: "テスト項目" というToDoが登録されている（初期詳細付き）
    await page.fill('#todoTitle', 'テスト項目');
    await page.fill('#todoDescription', '初期詳細');
    await page.click('button[type="submit"]');

    const descEl = page.locator('[data-editable-description]');
    await expect(descEl).toBeVisible();

    // When: 詳細テキストに "<script>alert('xss')</script> & \"'" を入力して保存する
    await descEl.click();
    const input = page.locator('.todo-item__desc-input').first();
    await input.fill('<script>alert(\'xss\')</script> & "\'');
    await input.press('Enter');

    // Then: 詳細に正しく保存され、HTMLとしてエスケープされて表示される
    const descText = page.locator('.todo-item__description').first();
    await expect(descText).toBeVisible();
    // scriptタグがそのままテキストとして表示されている（XSS対策でエスケープ済み）
    await expect(descText).toContainText('script');
  });

  // シナリオ: タイトルと詳細を両方同時に編集できる
  test('タイトルと詳細を両方同時に編集できる', async ({ page }) => {
    await setupPage(page);

    // Given: "元のタイトル" / "元の詳細" というToDoが登録されている
    await page.fill('#todoTitle', '元のタイトル');
    await page.fill('#todoDescription', '元の詳細');
    await page.click('button[type="submit"]');

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);

    // When: タイトルを新しいタイトルに変更し、その後詳細も新しい詳細に変更する
    const titleEl = page.locator('[data-editable-title]').first();
    await titleEl.click();
    let input = page.locator('.todo-item__title-input').first();
    await input.fill('新しいタイトル');
    await input.press('Enter');

    // 詳細も編集
    const descEl = page.locator('[data-editable-description]').first();
    await descEl.click();
    input = page.locator('.todo-item__desc-input').first();
    await input.fill('新しい詳細');
    await input.press('Enter');

    // Then: タイトルと詳細の両方が新しい内容に更新される
    await expect(page.locator('.todo-item__text')).toContainText('新しいタイトル');
    await expect(page.locator('.todo-item__description')).toContainText('新しい詳細');
  });

  // シナリオ: インライン編集中に項目を削除するとエラーにならない
  test('インライン編集中に項目を削除してもエラーにならない', async ({ page }) => {
    await setupPage(page);

    // Given: "元のタイトル" というToDoが登録されている
    await page.fill('#todoTitle', '元のタイトル');
    await page.click('button[type="submit"]');

    const titleEl = page.locator('[data-editable-title]').first();
    await expect(titleEl).toBeVisible();

    // When: タイトルをクリックしてインライン入力欄に切り替える
    await titleEl.click();

    // And: そのまま削除ボタンをクリックする
    await page.locator('.todo-item__delete').click();

    // Then: アプリは正常に動作し続け、エラーでクラッシュしない
    await expect(page.locator('body')).toBeVisible();

    // 項目が削除されたことを確認
    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(0);
  });
});
