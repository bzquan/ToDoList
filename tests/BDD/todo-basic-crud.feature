Feature: ToDoの基本CRUD操作

  ToDoリストアプリの基本機能（追加・一覧表示・完了切替・削除）を検証する。

@guid-86e19b74-a080-4df0-8a40-6570f5a5df75
  Scenario: ToDoを新規追加できる
    Given 空の状態から始めています
    When "買い物に行く" というタイトルでToDoを追加する
    Then 一覧に "買い物に行く" が表示される
    And その期限は未設定である

@guid-5ec9c39a-96a8-4f71-8087-e54b68b315de
  Scenario: タイトル付きで詳細テキストを含むToDoを追加できる
    Given 空の状態から始めています
    When "買い物に行く" というタイトル、"牛乳と卵を買う" という詳細でToDoを追加する
    Then 一覧に "買い物に行く" が表示される
    And "牛乳と卵を買う" という詳細も表示される

@guid-b6c61186-f54d-4bdd-a95b-5f6d235b2a1f
  Scenario: タイトル未入力で追加しようとするとエラーが表示される
    Given 空の状態から始めています
    When タイトルを空にして追加ボタンを押す
    Then エラーメッセージが表示される
    And ToDoは追加されない

@guid-7713919a-1066-4bd7-bcbf-00ed1cf268f1
  Scenario: 完了状態を切り替えられる
    Given "買い物に行く" というToDoが登録されている
    When その項目の完了チェックボックスをクリックする
    Then その項目は完了状態になり、取り消し線が付く

@guid-4bfb7add-2407-4d6f-95f0-6d4585dd93ea
  Scenario: 完了済みの項目を再クリックすると未完了に戻る
    Given "買い物に行く" というToDoが完了している
    When その項目の完了チェックボックスを再度クリックする
    Then その項目は未完了状態に戻り、取り消し線が消える

@guid-80c012b1-5a76-494a-9cb5-85f9e718b0c3
  Scenario: ToDoを削除できる
    Given "買い物に行く" というToDoが登録されている
    When その項目の削除ボタンをクリックする
    Then 一覧からその項目が削除される

@guid-9c402196-7b16-41e7-b514-8a403d713ced
  Scenario: データがlocalStorageに保存され、リロード後も維持される
    Given "買い物に行く" というToDoが登録されている
    When ページをリロードする
    Then 一覧に "買い物に行く" が表示されたままになる

@guid-0a0d2860-ec67-46bd-8272-1b9ab5a0085b
  Scenario: 複数のToDoを追加でき、新規項目が最上部に表示される
    Given "後から追加" というToDoが登録されている
    When "最初に追加" というタイトルで新しいToDoを追加する
    Then 一覧の先頭に "最初に追加" が表示され、その下に "後から追加" が表示される（最新追加が先頭）

@guid-1f3a8c2e-d4b7-4e91-b8c5-6a0d9e4f7c31
  Scenario: ToDoが空のとき「ToDoがありません」メッセージが表示される
    Given ToDo一覧が空の状態から始めています
    Then "ToDoがありません" というメッセージが表示される

@guid-9b2e5d7f-a1c3-4860-b4e2-f3a6c8d1e502
  Scenario: 完了済みの項目も一覧に残る（消えない）
    Given "買い物に行く" というToDoが登録され、完了している
    When ページをリロードする
    Then その項目は一覧に表示されたままになる
    And その項目は取り消し線のスタイルになっている

@guid-4c7b3e9a-f2d1-4856-a0e3-d5e8f1b2c6a3
  Scenario: タイトルのみのToDo（詳細なし）が正常に追加される
    Given 空の状態から始めています
    When "会議" というタイトルで詳細なしのToDoを追加する
    Then 一覧に "会議" が表示される
    And 詳細テキストのエリアは非表示である

@guid-8d5e2f1a-c3b4-4967-9e0d-a7c6b8f3d1e4
  Scenario: 期限切れのToDoが視覚的に強調される
    Given "昨日終わる" という期限日のToDoが登録されている
    When ToDo一覧を再表示する
    Then その項目は期限切れを示すスタイルで表示される

@guid-2a6f9c3e-b5d7-4810-a0e1-f4b8d2c6e3a5
  Scenario: 長いタイトルのToDoが追加できる
    Given 空の状態から始めています
    When "これは非常に長いタイトルです。いくつかの単語を含んでいます。もっと続けます。最後の部分です。" というタイトルでToDoを追加する
    Then 一覧にそのタイトルが表示される

@guid-7e4d1b2f-a9c6-4830-b5e2-d3f7a1c8e4b6
  Scenario: 特殊文字を含むタイトルのToDoが追加できる
    Given 空の状態から始めています
    When "テスト！@#$% &<>'" というタイトルでToDoを追加する
    Then 一覧に "テスト!@#$% &<>'" が表示される

@guid-3b8e5f1a-d2c7-4960-b0e3-a6d9f2c8e1a7
  Scenario: 全項目を削除すると空状態になる
    Given "項目A", "項目B", "項目C" の3つのToDoが登録されている
    When 各項目を順に削除する
    Then ToDo一覧が空になり、「ToDoがありません」メッセージが表示される
