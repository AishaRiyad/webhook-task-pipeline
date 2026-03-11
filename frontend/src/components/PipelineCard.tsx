import type { Pipeline, PipelineLink } from "../types";

type Props = {
  pipeline: Pipeline;
  links?: PipelineLink[];
  onDelete?: (pipelineId: string) => void;
  onDeleteLink?: (sourcePipelineId: string, targetPipelineId: string) => void;
};

export default function PipelineCard({ pipeline, links = [], onDelete, onDeleteLink }: Props) {
  return (
    <div className="cute-card">
      <div className="row-between">
        <h3>{pipeline.name}</h3>
        <span className={`badge ${pipeline.is_active ? "badge-green" : "badge-gray"}`}>
          {pipeline.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <p className="muted">Action: {pipeline.action_type}</p>
      <p className="muted">Webhook: /webhooks/{pipeline.source_key}</p>

      <div className="card-section">
        <p className="small-label">Chained Pipelines</p>

        {links.length === 0 ? (
          <p className="muted">No chained pipelines</p>
        ) : (
          <div className="link-list">
            {links.map((link) => (
              <div key={link.id} className="link-row">
                <span className="chip">{link.target_pipeline_name || link.target_pipeline_id}</span>

                {onDeleteLink && (
                  <button
                    className="mini-danger-btn"
                    onClick={() => onDeleteLink(pipeline.id, link.target_pipeline_id)}
                  >
                    Remove Link
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {onDelete && (
        <div className="card-actions">
          <button className="danger-btn" onClick={() => onDelete(pipeline.id)}>
            Delete Pipeline
          </button>
        </div>
      )}
    </div>
  );
}
