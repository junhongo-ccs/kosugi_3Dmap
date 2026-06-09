import type { Spot } from "./mapTypes";

type SpotDetailModalProps = {
  spot: Spot | null;
  onClose: () => void;
};

export default function SpotDetailModal({ spot, onClose }: SpotDetailModalProps) {
  if (!spot) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="spot-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spot-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="閉じる">
          ×
        </button>
        <div className="detail">
          <p className="detail-kind">{spot.category}</p>
          <h2 id="spot-modal-title">{spot.name}</h2>
          <p>{spot.role}</p>
        </div>
        <div className="note-block">
          <h3>街歩き</h3>
          <p>{spot.walkMemo}</p>
        </div>
        <div className="note-block">
          <h3>防災</h3>
          <p>{spot.safetyMemo}</p>
        </div>
        <div className="group compact">
          <p className="row">
            <span>{spot.floodStatus === "浸水想定区域内" ? "⚠ 浸水想定" : "浸水想定"}</span>
            <strong className={spot.floodStatus === "浸水想定区域内" ? "flood-warn" : undefined}>
              {spot.floodStatus}
            </strong>
          </p>
          <p className="row">
            <span>近隣の指定避難所</span>
            <strong>{spot.nearestShelter}</strong>
          </p>
        </div>
        <p className="memo">出典: {spot.source}</p>
      </section>
    </div>
  );
}
