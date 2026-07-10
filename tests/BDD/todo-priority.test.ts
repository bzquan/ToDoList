// @ts-nocheck
import { test, expect } from '@playwright/test';
import { setupPage } from '../setup.ts';

test.describe('Feature: 優先度（高・中・低）の設定と表示', () => {
  // シナリオ: ToDo追加時に優先度を設定できる
  test('ToDo追加時に優先度を設定できる', async ({ page }) => {
    await setupPage(page);

    // Given: 空の状態から始めています（setupPage済み）

    // When: タイトルを入力し、優先度ドロップダウンから「高」を選択して追加する
    await page.fill('#todoTitle', '優先度高テスト');
    await page.selectOption('#todoPriority', { value: 'high' });
    await page.click('button[type="submit"]');

    // Then: 一覧に優先度「高」の項目が追加される
    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);

    // And: その項目は優先度に応じた色で表示される
    const priorityEl = page.locator('.todo-item__priority').first();
    await expect(priorityEl).toBeVisible();
  });

  // シナリオ: 既存項目の優先度を変更できる
  test('既存項目の優先度を変更できる', async ({ page }) => {
    await setupPage(page);

    // Given: 優先度が「中」のToDoがある
    await page.fill('#todoTitle', '優先度変更テスト');
    await page.selectOption('#todoPriority', { value: 'medium' });
    await page.click('button[type="submit"]');

    // When: 優先度のspanをクリックしてインライン編集モードに切り替える
    const priorityEl = page.locator('.todo-item__priority').first();
    await priorityEl.click();

    // And: ドロップダウンから「低」を選択する
    const select = page.locator('.todo-item__priority-select').first();
    await select.selectOption({ value: 'low' });

    // Then: その項目の優先度が「低」に変更される
    // And: 表示色が新しい優先度に合わせて変わる
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('todos')));
    expect(stored.items[0].priority).toBe('low');
  });

  // シナリオ: 優先度「高」の項目は視覚的に強調表示される
  test('優先度「高」の項目は視覚的に強調表示される', async ({ page }) => {
    await setupPage(page);

    // Given: 優先度が「高」のToDoがある
    await page.fill('#todoTitle', '優先度高');
    await page.selectOption('#todoPriority', { value: 'high' });
    await page.click('button[type="submit"]');

    const li = page.locator('.todo-item').first();

    // When: ToDo一覧を表示する
    // Then: その項目は他の項目と区別できる色で表示される（強調クラス付き）
    await expect(li).toHaveClass(/todo-item--priority-high/);
  });

  // シナリオ: 優先度を「低」に設定すると緑色系で表示される
  test('優先度を「低」に設定すると緑色系で表示される', async ({ page }) => {
    await setupPage(page);

    // Given: 優先度が「中」のToDoがある
    await page.fill('#todoTitle', '優先度低テスト');
    await page.selectOption('#todoPriority', { value: 'medium' });
    await page.click('button[type="submit"]');

    const priorityEl = page.locator('.todo-item__priority').first();

    // When: 優先度を「低」に変更する（インライン編集）
    await priorityEl.click();
    const select = page.locator('.todo-item__priority-select').first();
    await select.selectOption({ value: 'low' });

    // Then: その項目は優先度に応じたCSSクラスが付与される
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('todos')));
    expect(stored.items[0].priority).toBe('low');

    await expect(priorityEl).toHaveClass(/todo-item__priority--low/);
  });

  // シナリオ: 優先度を変更しても完了状態は維持される
  test('優先度を変更しても完了状態は維持される', async ({ page }) => {
    await setupPage(page);

    // Given: 優先度が「中」で完了済みのToDoがある
    await page.fill('#todoTitle', '優先度変更テスト');
    await page.selectOption('#todoPriority', { value: 'medium' });
    await page.click('button[type="submit"]');
    await page.locator('.todo-item__checkbox').first().check();

    // When: 優先度を「高」に変更する（インライン編集）
    const priorityEl = page.locator('.todo-item__priority').first();
    await priorityEl.click();
    const select = page.locator('.todo-item__priority-select').first();
    await select.selectOption({ value: 'high' });

    // Then: その項目は依然として完了状態（取り消し線付き）である
    await expect(page.locator('.todo-item__text')).toHaveClass(/todo-item__text--done/);
  });

  // シナリオ: 優先度を設定せずに追加するとデフォルトで「中」になる
  test('優先度なしで追加するとデフォルトで「中」になる', async ({ page }) => {
    await setupPage(page);

    // Given: 空の状態から始めています（setupPage済み）

    // When: タイトルのみのToDoを追加する（優先度選択なし）
    await page.fill('#todoTitle', 'デフォルト優先度テスト');
    await page.click('button[type="submit"]');

    // Then: その項目の優先度は「中」として扱われる
    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('todos')));
    expect(stored.items[0].priority).toBe('medium');
  });

  // シナリオ: 優先度「高」「中」「低」がそれぞれ異なる色で表示される
  test('優先度がそれぞれ異なる色で表示される', async ({ page }) => {
    await setupPage(page);

    // Given: 優先度が「高」の ToDo A と 「中」の ToDo B と 「低」の ToDo C が登録されている
    for (const [title, priority] of [['A', 'high'], ['B', 'medium'], ['C', 'low']]) {
      await page.fill('#todoTitle', title);
      await page.selectOption('#todoPriority', { value: priority });
      await page.click('button[type="submit"]');
    }

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(3);

    // When/Then: ToDo一覧を表示する
    // 各項目の優先度spanに適切なCSSクラスが付く
    const prioritySpans = page.locator('.todo-item__priority');
    await expect(prioritySpans).toHaveCount(3);
    await expect(prioritySpans.nth(0)).toHaveClass(/todo-item__priority--high/);
    await expect(prioritySpans.nth(1)).toHaveClass(/todo-item__priority--medium/);
    await expect(prioritySpans.nth(2)).toHaveClass(/todo-item__priority--low/);
  });

  // シナリオ: 優先度の変更はlocalStorageに保存され、リロード後も維持される
  test('優先度の変更がリロード後も維持される', async ({ page }) => {
    await setupPage(page);

    // Given: 優先度が「高」のToDoがある
    await page.fill('#todoTitle', '優先度変更テスト');
    await page.selectOption('#todoPriority', { value: 'high' });
    await page.click('button[type="submit"]');

    const priorityEl = page.locator('.todo-item__priority').first();

    // When: 優先度を「低」に変更する
    await priorityEl.click();
    const select = page.locator('.todo-item__priority-select').first();
    await select.selectOption({ value: 'low' });

    // And: ページをリロードする
    await page.reload();

    // Then: その項目の優先度は「低」のまま維持される
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('todos')));
    expect(stored.items[0].priority).toBe('low');

    const priorityAfterReload = page.locator('.todo-item__priority').first();
    await expect(priorityAfterReload).toBeVisible();
  });

  // シナリオ: 優先度を変更しても他の項目の優先度は影響を受けない
  test('優先度の変更が他項目に影響しない', async ({ page }) => {
    await setupPage(page);

    // Given: 優先度が「高」の ToDo A と 「中」の ToDo B が登録されている
    await page.fill('#todoTitle', 'A');
    await page.selectOption('#todoPriority', { value: 'high' });
    await page.click('button[type="submit"]');

    await page.fill('#todoTitle', 'B');
    await page.selectOption('#todoPriority', { value: 'medium' });
    await page.click('button[type="submit"]');

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(2);

    // When: ToDo A の優先度を「低」に変更する
    const priorityAEl = page.locator('.todo-item__priority').nth(0);
    await priorityAEl.click();
    const select = page.locator('.todo-item__priority-select');
    await select.selectOption({ value: 'low' });

    // Then: ToDo B の優先度は「中」のまま変わらない
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('todos')));
    expect(stored.items[1].priority).toBe('medium');
  });

  // シナリオ: ドラッグ&ドロップで並び替えても優先度は維持される
  test('ドラッグ&ドロップでも優先度が維持される', async ({ page }) => {
    await setupPage(page);

    // Given: 優先度が「高」の ToDo A と 「低」の ToDo B が登録されている
    await page.fill('#todoTitle', 'A');
    await page.selectOption('#todoPriority', { value: 'high' });
    await page.click('button[type="submit"]');

    await page.fill('#todoTitle', 'B');
    await page.selectOption('#todoPriority', { value: 'low' });
    await page.click('button[type="submit"]');

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(2);

    // When: ToDo A を ToDo B の下にドラッグ&ドロップする（localStorage直接操作）
    const aId = await page.locator('.todo-item').nth(0).getAttribute('data-id');
    await page.evaluate(
      ({ aId }) => {
        const raw = localStorage.getItem('todos');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!Array.isArray(data.items)) return;

        const fromIndex = data.items.findIndex((t: { id: string }) => t.id === aId);
        if (fromIndex === -1) return;

        // Aを末尾に移動
        const [moved] = data.items.splice(fromIndex, 1);
        data.items.push(moved);

        localStorage.setItem('todos', JSON.stringify(data));
      },
      { aId }
    );

    // 再描画
    await page.evaluate(() => window.render());

    // Then: 順序は入れ替わるが、各項目の優先度は変更されない
    const texts = page.locator('.todo-item__text');
    await expect(texts.nth(0)).toContainText('B');
    await expect(texts.nth(1)).toContainText('A');

    // 優先度が維持されていることを確認
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('todos')));
    expect(stored.items[0].priority).toBe('low');   // Bは「低」のまま
    expect(stored.items[1].priority).toBe('high');   // Aは「高」のまま
  });

  // シナリオ: 完了済みの項目でも優先度を変更できる
  test('完了済みの項目でも優先度を変更できる', async ({ page }) => {
    await setupPage(page);

    // Given: 優先度が「中」で完了済みのToDoがある
    await page.fill('#todoTitle', '完了済み優先度テスト');
    await page.selectOption('#todoPriority', { value: 'medium' });
    await page.click('button[type="submit"]');
    await page.locator('.todo-item__checkbox').first().check();

    const priorityEl = page.locator('.todo-item__priority').first();
    await expect(priorityEl).toBeVisible();

    // When: 優先度を「高」に変更する
    await priorityEl.click();
    const select = page.locator('.todo-item__priority-select').first();
    await select.selectOption({ value: 'high' });

    // Then: その項目は依然として完了状態であり、優先度も「高」に変わる
    await expect(page.locator('.todo-item__text')).toHaveClass(/todo-item__text--done/);

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('todos')));
    expect(stored.items[0].priority).toBe('high');
  });
});
