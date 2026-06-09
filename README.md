# Musashi-Kosugi 3D Walk + Safety Explorer

武蔵小杉駅周辺を対象に、Google Maps Platform の 3D Maps と無料GISデータを組み合わせて、街歩き・回遊性・防災情報を同じ3D空間で確認するPoCです。

このPoCは、観光・街歩きの見せ方を入口にしながら、多摩川周辺の浸水リスク、避難所、駅周辺導線などを重ねて「見て楽しい地図」から「判断できる地図」へ広げることを目的にしています。

## Concept

- 対象エリア: 武蔵小杉駅から半径約1.5km
- 主な体験: 3D地図上でスポット、回遊ルート、防災レイヤーを切り替えながら確認する
- デモ対象: 社内PoC、自治体/不動産/観光向け提案、GIS活用検証
- デプロイ想定: Render
- フロントエンド: Next.js + TypeScript + Tailwind CSS

## Why Musashi-Kosugi

武蔵小杉はPoC対象として相性が良いエリアです。

- 駅周辺に商業施設、公共施設、公園、河川空間が集まっている
- 高層建築が多く、3D地図の視覚的な効果が出やすい
- 多摩川が近く、浸水想定や避難所情報を重ねる意味がある
- 観光・回遊だけでなく、防災・都市理解の文脈に展開しやすい

## MVP Features

### 3D Map

- Google 3D Maps for JavaScript で武蔵小杉駅周辺を表示
- 初期カメラは武蔵小杉駅周辺の俯瞰ビュー
- カメラプリセットを用意
  - 駅俯瞰
  - 多摩川方向
  - 街歩き視点
  - 防災説明視点
- APIキー未設定時は、地図領域に設定不足メッセージを表示

### Walk Layer

- 街歩きスポットを地図上に表示
  - 武蔵小杉駅
  - 商業施設
  - 公園
  - 多摩川沿いスポット
  - 公共施設
- スポットをクリックすると詳細パネルを表示
  - 名称
  - 種別
  - 短い説明
  - 出典
  - 周辺メモ
- 3〜5地点を巡るモデル回遊ルートを表示

### Safety Layer

- 浸水想定区域を半透明ポリゴンで表示
- 避難所または広域避難場所候補をマーカー表示
- 選択地点ごとに以下を表示
  - 浸水想定区域内/外
  - 近い避難所候補
  - 駅からの距離感
  - 注意メモ

### Layer Controls

- 回遊スポット
- 回遊ルート
- 浸水想定
- 避難所
- 行政/町丁目境界
- レイヤー透明度

### Presentation Mode

- デモ用にカメラが順番に移動するモード
- MVPでは読み込み遅延や操作ミスを避けるため、3ステップに絞る
- 想定シナリオ
  1. 武蔵小杉駅を俯瞰
  2. 駅周辺の回遊スポットとモデルルートを表示
  3. 多摩川方向へカメラ移動し、浸水想定と避難所候補を重ねて表示

## Data Sources

MVPでは無料GISデータと手動seedデータを中心に使います。Google Places APIはMVPでは使わず、後続拡張として扱います。

| Data | Purpose | Notes |
|---|---|---|
| PLATEAU | 川崎市の都市モデル/建物属性確認 | 必要に応じて参照。Google 3D Mapsの見た目と併用する |
| 国土数値情報 | 浸水想定、鉄道駅、公共施設、避難施設候補 | データ加工してGeoJSON化 |
| 国土地理院 | 標高、背景補助、出典確認 | 必要に応じて利用 |
| OpenStreetMap | スポット/道路/歩行者導線の補完 | ライセンス表記に注意 |
| Manual seed data | デモ用スポット/回遊ルート | MVP初期実装を速くするために許容 |

出典は画面下部または詳細パネルに表示します。

## Data Processing

MVPでは、GISデータ加工の初期ボトルネックを避けるため、以下の手順に固定します。

- 原則として `ogr2ogr` で元データをGeoJSONへ変換する
- 武蔵小杉駅中心、半径約1.5kmの切り出しは `Turf.js` のbuffer/intersectで行う
- QGISは目視確認、属性確認、境界の妥当性チェックに使う
- 表示用GeoJSONには、地図表示と詳細パネルに必要な属性だけ残す
- MVPデータは `public/data/` 配下に静的ファイルとして配置する
- 大きなデータ、複雑なポリゴン、頻繁な更新が必要になった場合のみ、後続でPostGISまたはMVT配信を検討する

## Non-Functional Requirements

- Tailwind CSSでUIを構築する
- Render環境変数でGoogle Maps APIキーを管理する
- 大きなGISデータはそのまま読み込まず、対象範囲に切り出したGeoJSONを使う
- 初期MVPではPostGISやMVT配信は使わない
- PC表示を優先し、モバイルでは地図優先・詳細パネルは下部ドロワーにする
- 画面内テキストは説明過多にせず、デモ時に自然に操作できるUIにする
- モバイルは同僚への共有を想定し、360px幅でも主要操作が崩れないようにする
- モバイルではレイヤー操作を下部シートにまとめ、詳細パネルは地図を覆いすぎない高さに制限する
- カメラプリセットとプレゼンモード開始は、PC/モバイルの両方で最初に触れる操作として固定表示する

## Google Maps GitHub References

実装時はGoogle Maps Platform公式/公式関連のGitHubリポジトリを参照します。MVPではサンプルコードをそのままコピーするのではなく、API読み込み、3D Maps初期化、マーカー、イベント処理、テスト構成の実装パターンを参考にします。

| Repository | Use |
|---|---|
| [googlemaps](https://github.com/googlemaps/) | Google Maps Platformの公式ライブラリ/ツール一覧の確認 |
| [googlemaps-samples](https://github.com/googlemaps-samples) | Maps API/SDKの公式サンプル一覧の確認 |
| [googlemaps-samples/js-api-samples](https://github.com/googlemaps-samples/js-api-samples) | Maps JavaScript APIのTypeScript/Viteサンプル、Playwright構成、API利用パターンの参照 |
| [googlemaps/js-api-loader](https://github.com/googlemaps/js-api-loader) | Google Maps JavaScript APIを動的読み込みする実装候補 |
| [googlemaps/extended-component-library](https://github.com/googlemaps/extended-component-library) | Place Picker/Place OverviewなどのWeb Componentsを後続拡張で検討 |

MVPでの採用方針:

- Google Places APIは使わないため、Extended Component Libraryは後続拡張扱いにする
- 3D Mapsのロード方法は公式ドキュメントと `js-api-loader` の実装方針を比較して決める
- `js-api-samples` のPlaywright構成を参考に、地図の初期表示とUI操作の最低限のE2Eテストを用意する
- 公式サンプル由来のコードを取り込む場合は、Apache-2.0ライセンス表記とTerms of Serviceを確認する

## Cost Guardrails

Google Maps Platformは料金体系が変わる可能性があるため、実装前に公式料金ページを確認します。

MVPで必ず設定するもの:

- Google Cloud Billingの予算アラート
- APIキーのHTTPリファラー制限
- 3D Maps関連APIのクォータ上限
- Renderの環境変数管理

MVPではGoogle Places APIを使わないため、課金対象を主に3D Maps関連に絞ります。

APIキー管理方針:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` はクライアントに露出する前提で扱う
- 本番用キーはRender公開URLのHTTPリファラーだけを許可する
- ローカル開発用キーは `localhost` / `127.0.0.1` のHTTPリファラーだけを許可する
- 本番用キーとローカル開発用キーは分ける
- `.env.local` はGitにコミットしない
- Google Cloud側でAPI制限を設定し、不要なAPIからキーを使えないようにする

## Render Deployment

想定環境変数:

```txt
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_APP_DEFAULT_LAT=35.5761
NEXT_PUBLIC_APP_DEFAULT_LNG=139.6566
NEXT_PUBLIC_APP_DEFAULT_RANGE_KM=1.5
```

想定デプロイ手順:

```txt
1. GitHub repositoryをRenderに接続
2. 環境変数を設定
3. MVPはStatic Siteとして作成する
4. API Routes/SSRが必要になったらWeb Serviceへ切り替える
5. Build command / Publish directoryはNext.jsの構成に合わせて設定する
6. 公開URLをGoogle Maps APIキーのHTTPリファラーに追加
7. 予算アラートとクォータ上限を確認
```

Render設定の初期方針:

```txt
Service type: Static Site
Repository: junhongo-ccs/kosugi_3Dmap
Branch: main
Build command: npm install && npm run build
Publish directory: out
Auto-deploy: On
```

Next.js側はStatic Exportを前提にし、サーバー依存の機能をMVPでは避けます。

参考:

```txt
https://render.com/docs/deploy-nextjs-app
https://render.com/docs/static-sites
https://render.com/docs/configure-environment-variables
```

## Milestones

### 1. MVP Map Shell

- Next.js + Tailwind初期構成
- Google 3D Maps表示
- カメラプリセットUI
- APIキー未設定時のfallback表示
- Google Maps公式GitHubサンプルの参照方針確認

### 2. GIS Layers

- 武蔵小杉seedスポットGeoJSON
- モデル回遊ルートGeoJSON
- 浸水想定GeoJSON
- 避難所/公共施設GeoJSON
- レイヤーON/OFFと出典表示

### 3. Presentation Demo

- プレゼンモード
- 詳細サイドパネル
- 3〜5地点の回遊シナリオ
- デモ用スクリーンショット

### 4. Deploy & Cost Guardrails

- Renderデプロイ
- Google Cloudの予算アラート
- APIキー制限
- READMEの公開用整備

## Acceptance Criteria

- ローカルで武蔵小杉駅周辺の3D地図が表示される
- 回遊スポット、回遊ルート、浸水想定、避難所レイヤーを切り替えられる
- スポットクリックで詳細パネルが更新される
- プレゼンモードで3ステップのデモシナリオを一通り見せられる
- 360px幅のモバイル表示で主要操作が重ならない
- ローカル用/本番用のAPIキー制限方針がREADMEに記載されている
- Render公開URLで同じ体験ができる
- READMEだけで目的、起動方法、データ出典、料金リスクが理解できる

## Future Extensions

- Google Places API / Places UI Kitによるスポット情報の高度化
- PLATEAUデータの属性活用
- PostGISまたはMVT配信による大規模GISデータ対応
- ユーザーが地点を選んで回遊ルートを自動生成
- 浸水リスク、駅距離、避難所距離の簡易スコアリング
- 複数エリア比較
