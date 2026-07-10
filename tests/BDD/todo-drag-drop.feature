Feature: ドラッグ&ドロップによる並び替え

  ToDo項目をドラッグ&ドロップで自由に並べ替える機能を検証する。

  Scenario: ドラッグハンドルが表示される
    Given ToDoが2つ以上登録されている
    When ToDo一覧を表示する
    Then 各項目の左端にドラッグハンドル（⋮⋮）が表示される

  Scenario: ドラッグハンドルをドラッグして順序を入れ替えられる
    Given "A" と "B" の順でToDoが登録されている
    When "A" のドラッグハンドルを "B" の下にドラッグ&ドロップする
    Then ToDoの順序が "B", "A" に入れ替わる

  Scenario: ドラッグ中の項目は視覚的に区別される
    Given ToDoが2つ以上登録されている
    When 項目のドラッグハンドルを押し始めて dragstart イベントが発火したとき
    Then その項目が半透明（opacity: 0.5）になる

  Scenario: ドロップした位置にプレースホルダーが表示される
    Given "A" と "B" の順でToDoが登録されている
    When "A" を "B" の上にドラッグしたとき
    Then "B" の上にドロップ位置を示す線または領域が表示される

  Scenario: ドラッグ&ドロップの結果はlocalStorageに保存される
    Given "A" と "B" の順で登録されている
    When "A" を "B" の下にドラッグ&ドロップする
    And ページをリロードする
    Then ToDoの順序が "B", "A" のまま維持される

  Scenario: 3項目以上でも自由に並び替えられる
    Given "A", "B", "C" の順でToDoが登録されている
    When "C" を "A" と "B" の間にドラッグ&ドロップする
    Then ToDoの順序が "A", "C", "B" に入れ替わる

  Scenario: ドラッグハンドルを上にドラッグして先頭に移動できる
    Given "A", "B" の順でToDoが登録されている
    When "B" のドラッグハンドルを "A" の上にドラッグ&ドロップする
    Then ToDoの順序が "B", "A" に入れ替わる

  Scenario: ドロップして元の位置に戻してもデータは壊れない
    Given "A" と "B" の順でToDoが登録されている
    When "A" を元の位置にドラッグ&ドロップする（変化なし）
    Then ToDoの順序は "A", "B" のまま変わらない

  Scenario: ドラッグ操作中にEscapeキーを押すとドラッグ状態がクリアされる
    Given "A" と "B" の順でToDoが登録されている
    When ドラッグハンドルを押し始めて dragstart イベントが発火する
    And ドラッグ終了イベント（dragend）が発火する
    Then ドラッグ中の視覚効果（半透明）が解除され、順序は変更されない

  Scenario: 完了済みの項目もドラッグ&ドロップで並び替えできる
    Given "A"（完了済み）と "B" の順でToDoが登録されている
    When "A" を "B" の下にドラッグ&ドロップする
    Then ToDoの順序が "B", "A" に入れ替わる

  Scenario: 項目が1つのときもドラッグハンドルが表示される
    Given ToDoが1つだけ登録されている
    When ToDo一覧を表示する
    Then ドラッグハンドルが表示される（ドラッグ操作は不可）
