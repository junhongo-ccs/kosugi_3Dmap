import type { LayerKey, Spot } from "./mapTypes";

type ExplorerPanelProps = {
  layerEntries: Array<[LayerKey, string]>;
  layers: Record<LayerKey, boolean>;
  activeSpot: Spot;
  spots: Spot[];
  onToggleLayer: (key: LayerKey) => void;
  onSelectSpot: (spot: Spot) => void;
  onOpenSpotDetail: (spot: Spot) => void;
};

export default function ExplorerPanel({
  layerEntries,
  layers,
  activeSpot,
  spots,
  onToggleLayer,
  onSelectSpot,
  onOpenSpotDetail,
}: ExplorerPanelProps) {
  return (
    <aside className="panel" aria-label="layer controls and detail panel">
      <section className="panel-section">
        <h2>Layer Controls</h2>
        <div className="legend" aria-label="map legend">
          <span><i className="legend-dot legend-spot" />回遊スポット</span>
          <span><i className="legend-dot legend-shelter" />指定避難所</span>
        </div>
        <div className="group">
          {layerEntries.map(([key, label]) => (
            <label className="row" key={key}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={Boolean(layers[key])}
                onChange={() => onToggleLayer(key)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="panel-section">
        <h2>仮スポット一覧</h2>
        <div className="spot-list">
          {spots.map((spot) => (
            <button
              key={spot.id}
              className={spot.id === activeSpot.id ? "spot-card spot-card-active" : "spot-card"}
              type="button"
              onClick={() => {
                onSelectSpot(spot);
                onOpenSpotDetail(spot);
              }}
            >
              <span>{spot.name}</span>
            </button>
          ))}
        </div>
      </section>

      <small>出典表示エリア: 川崎市指定避難所一覧 / 国土数値情報 / OSM / Manual seed data</small>
    </aside>
  );
}
