// @ts-nocheck
import { test, expect } from '@playwright/test';
import { setupPage } from '../setup.ts';

test.describe('Feature: ToDoの基本CRUD操作', () => {
  // シナリオ: ToDoを新規追加できる
  test('ToDoを新規追加できる', async ({ page }) => {
    await setupPage(page);

    // Given: 空の状態から始めています（setupPage済み）

    // When: "買い物に行く" というタイトルでToDoを追加する
    await page.fill('#todoTitle', '買い物に行く');
    await page.click('button[type="submit"]');

    // Then: 一覧に "買い物に行く" が表示される
    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.todo-item__text')).toContainText('買い物に行く');

    // And: その期限は未設定である
    await expect(page.locator('[data-editable-due]')).toContainText('期限設定');
  });

  // シナリオ: タイトル付きで詳細テキストを含むToDoを追加できる
  test('タイトルと詳細テキストを含むToDoを追加できる', async ({ page }) => {
    await setupPage(page);

    // When: "買い物に行く" というタイトル、"牛乳と卵を買う" という詳細でToDoを追加する
    await page.fill('#todoTitle', '買い物に行く');
    await page.fill('#todoDescription', '牛乳と卵を買う');
    await page.click('button[type="submit"]');

    // Then: 一覧に "買い物に行く" が表示される
    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.todo-item__text')).toContainText('買い物に行く');

    // And: "牛乳と卵を買う" という詳細も表示される
    await expect(page.locator('.todo-item__description')).toBeVisible();
    await expect(page.locator('.todo-item__description')).toContainText('牛乳と卵を買う');
  });

  // シナリオ: タイトル未入力で追加しようとするとエラーが表示される
  test('タイトル未入力で追加しようとするとエラーが表示される', async ({ page }) => {
    await setupPage(page);

    // When: タイトルを空にして追加ボタンを押す
    await page.fill('#todoTitle', '');
    await page.click('button[type="submit"]');

    // Then: エラーメッセージが表示される
    const errorMessage = page.locator('#errorMessage');
    await expect(errorMessage).toBeVisible();

    // And: ToDoは追加されない
    await expect(page.locator('.todo-item')).toHaveCount(0);
  });

  // シナリオ: 完了状態を切り替えられる
  test('完了状態を切り替えられる', async ({ page }) => {
    await setupPage(page);

    // Given: "買い物に行く" というToDoが登録されている
    await page.fill('#todoTitle', '買い物に行く');
    await page.click('button[type="submit"]');

    const checkbox = page.locator('.todo-item__checkbox').first();

    // When: その項目の完了チェックボックスをクリックする
    await checkbox.check();

    // Then: その項目は完了状態になり、取り消し線が付く
    await expect(page.locator('.todo-item__text')).toHaveClass(/todo-item__text--done/);
  });

  // シナリオ: 完了済みの項目を再クリックすると未完了に戻る
  test('完了済みの項目を再クリックすると未完了に戻る', async ({ page }) => {
    await setupPage(page);

    // Given: "買い物に行く" というToDoが完了している
    await page.fill('#todoTitle', '買い物に行く');
    await page.click('button[type="submit"]');
    await page.locator('.todo-item__checkbox').first().check();

    const checkbox = page.locator('.todo-item__checkbox').first();

    // When: その項目の完了チェックボックスを再度クリックする
    await checkbox.uncheck();

    // Then: その項目は未完了状態に戻り、取り消し線が消える
    await expect(page.locator('.todo-item__text')).not.toHaveClass(/todo-item__text--done/);
  });

  // シナリオ: ToDoを削除できる
  test('ToDoを削除できる', async ({ page }) => {
    await setupPage(page);

    // Given: "買い物に行く" というToDoが登録されている
    await page.fill('#todoTitle', '買い物に行く');
    await page.click('button[type="submit"]');

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);

    // When: その項目の削除ボタンをクリックする
    await page.locator('.todo-item__delete').first().click();

    // Then: 一覧からその項目が削除される
    await expect(page.locator('.todo-list__empty')).toBeVisible();
  });

  // シナリオ: データがlocalStorageに保存され、リロード後も維持される
  test('データがlocalStorageに保存され、リロード後も維持される', async ({ page }) => {
    await setupPage(page);

    // Given: "買い物に行く" というToDoが登録されている
    await page.fill('#todoTitle', '買い物に行く');
    await page.click('button[type="submit"]');

    // When: ページをリロードする
    await page.reload();

    // Then: 一覧に "買い物に行く" が表示されたままになる
    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.todo-item__text')).toContainText('買い物に行く');
  });

  // シナリオ: 複数のToDoを追加でき、新規項目が最上部に表示される
  test('複数のToDoを追加でき、新規項目が最上部に表示される', async ({ page }) => {
    await setupPage(page);

    // Given: "後から追加" というToDoが登録されている
    await page.fill('#todoTitle', '後から追加');
    await page.click('button[type="submit"]');

    // When: "最初に追加" というタイトルで新しいToDoを追加する
    await page.fill('#todoTitle', '最初に追加');
    await page.click('button[type="submit"]');

    // Then: 新規項目が最上部（先頭）に表示される（unshiftのためDOMは[最初に追加, 後から追加]）
    const texts = page.locator('.todo-item__text');
    await expect(texts).toHaveCount(2);
    await expect(texts.nth(0)).toContainText('最初に追加');
    await expect(texts.nth(1)).toContainText('後から追加');
  });

  // シナリオ: ToDoが空のとき「ToDoがありません」メッセージが表示される
  test('ToDoが空のとき「ToDoがありません」メッセージが表示される', async ({ page }) => {
    await setupPage(page);

    // Given: ToDo一覧が空の状態（setupPageでlocalStorageをクリア済み）

    // When/Then: "ToDoがありません" というメッセージが表示される
    const emptyMsg = page.locator('.todo-list__empty');
    await expect(emptyMsg).toBeVisible();
    await expect(emptyMsg).toContainText('ToDoがありません');
  });

  // シナリオ: 完了済みの項目も一覧に残る（消えない）
  test('完了済みの項目も一覧に残る', async ({ page }) => {
    await setupPage(page);

    // Given: "買い物に行く" というToDoが登録され、完了している
    await page.fill('#todoTitle', '買い物に行く');
    await page.click('button[type="submit"]');
    await page.locator('.todo-item__checkbox').first().check();

    // When: ToDo一覧を再表示する（ページリロード）
    await page.reload();

    // Then: その項目は一覧に表示されたままになる
    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.todo-item__text')).toContainText('買い物に行く');

    // And: その項目は取り消し線のスタイルになっている
    await expect(page.locator('.todo-item__text')).toHaveClass(/todo-item__text--done/);
  });

  // シナリオ: タイトルのみのToDo（詳細なし）が正常に追加される
  test('タイトルだけのToDoが正常に追加される', async ({ page }) => {
    await setupPage(page);

    // Given: 空の状態から始めています（setupPage済み）

    // When: "会議" というタイトルで詳細なしのToDoを追加する
    await page.fill('#todoTitle', '会議');
    await page.click('button[type="submit"]');

    // Then: 一覧に "会議" が表示される
    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.todo-item__text')).toContainText('会議');

    // And: 詳細テキストのエリアは非表示である
    const descEl = page.locator('.todo-item__description').first();
    await expect(descEl).not.toBeVisible();
  });

  // シナリオ: 期限切れのToDoが視覚的に強調される
  test('期限切れのToDoが視覚的に強調される', async ({ page }) => {
    await setupPage(page);

    // Given: "昨日終わる" という期限日のToDoが登録されている（過去の日付）
    const pastDate = '2020-01-01';
    await page.fill('#todoTitle', '昨日終わる');
    await page.fill('#todoDueDate', pastDate);
    await page.click('button[type="submit"]');

    // When: ToDo一覧を再表示する
    const dueEl = page.locator('.todo-item__due').first();
    await expect(dueEl).toBeVisible();

    // Then: その項目は期限切れを示すスタイルで表示される（期限要素にクラスが付く）
    await expect(dueEl).toHaveClass(/todo-item__due--overdue/);
  });

  // シナリオ: 長いタイトルのToDoが追加できる
  test('長いタイトルのToDoが追加できる', async ({ page }) => {
    await setupPage(page);

    // Given: 空の状態から始めています（setupPage済み）

    // When: "これは非常に長いタイトルです。いくつかの単語を含んでいます。もっと続けます。最後の部分です。" というタイトルでToDoを追加する
    const longTitle = 'これは非常に長いタイトルです。いくつかの単語を含んでいます。もっと続けます。最後の部分です。';
    await page.fill('#todoTitle', longTitle);
    await page.click('button[type="submit"]');

    // Then: 一覧にそのタイトルが表示される
    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.todo-item__text')).toContainText(longTitle);
  });

  // シナリオ: 特殊文字を含むタイトルのToDoが追加できる
  test('特殊文字を含むタイトルのToDoが追加できる', async ({ page }) => {
    await setupPage(page);

    // Given: 空の状態から始めています（setupPage済み）

    // When: "テスト！@#$% &<>'" というタイトルでToDoを追加する
    const specialTitle = 'テスト！@#$% &<>\'';
    await page.fill('#todoTitle', specialTitle);
    await page.click('button[type="submit"]');

    // Then: 一覧に "テスト！@#$% &<>'" が表示される（特殊文字がエスケープされて表示）
    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.todo-item__text')).toContainText('テスト！@#$% &<>\'');
  });

  // シナリオ: 全項目を削除すると空状態になる
  test('全項目を削除すると空状態になる', async ({ page }) => {
    await setupPage(page);

    // Given: "項目A", "項目B", "項目C" の3つのToDoが登録されている
    for (const title of ['項目A', '項目B', '項目C']) {
      await page.fill('#todoTitle', title);
      await page.click('button[type="submit"]');
    }

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(3);

    // When: 各項目を順に削除する
    for (let i = 0; i < 3; i++) {
      await page.locator('.todo-item__delete').first().click();
    }

    // Then: ToDo一覧が空になり、「ToDoがありません」メッセージが表示される
    await expect(page.locator('.todo-item')).toHaveCount(0);
    const emptyMsg = page.locator('.todo-list__empty');
    await expect(emptyMsg).toBeVisible();
    await expect(emptyMsg).toContainText('ToDoがありません');
  });
});
