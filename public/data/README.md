# public/data

MVPで使用する静的データをここに配置します。

- `map-data.json`: スポット、回遊ルート、避難所、カメラプリセットなどのアプリ用seedデータ
- `flood_risk.geojson`: 国土数値情報 洪水浸水想定区域データ（河川単位）をQGISで加工した表示用GeoJSON

`flood_risk.geojson` は、多摩川 / 想定最大規模 / 2025年データを武蔵小杉周辺に切り出したものです。アプリでは浸水深ランクを色と3Dポリゴンの高さに反映し、最大浸水想定を確認できるようにしています。

`source/` や `flood_risk_raw.geojson` はQGIS作業用の中間ファイルです。公開表示に使う正規データは `flood_risk.geojson` です。
