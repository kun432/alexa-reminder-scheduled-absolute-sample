# alexa-reminder-scheduled-absolute-sample

【大阪】スマートスピーカーミーティング 2019/07/25 のLTで作った、リマインダースキルのサンプルです。

https://osaka-driven-dev.connpass.com/event/134869/

https://speakerdeck.com/kun432/retaining-users-with-alexas-notification

## 使い方

以下の手順は、hosted skillが前提となっていますのでご注意ください。

1. git clone します。
2. カスタムスキルを作成し、alexa hostedを選択します。
3. アクセス権で「リマインダー」を有効にします。
4. model/ja-JP.json を開発者コンソールのJSONエディターにドラッグアンドドロップします。
5. モデルを保存・ビルドします
6. コードエディタでpackage.jsonを開いて、lambda/package.jsonの内容ですべて上書きして、一旦保存・デプロイします。
7. コードエディタでindex.jsを開いて、lambda/index.jsの内容ですべて上書きして、保存・デプロイします。

## その他

不備等あればご指摘ください