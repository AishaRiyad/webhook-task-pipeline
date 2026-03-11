import { useNavigate } from "react-router-dom";
import type { Job, Pipeline } from "../types";

type Props = {
  job: Job;
  pipelines: Pipeline[];
};

export default function JobCard({ job, pipelines }: Props) {
  const pipeline = pipelines.find((p) => p.id === job.pipeline_id);
  const navigate = useNavigate();

  return (
    <div className="cute-card">
      <div className="row-between">
        <h3>{pipeline?.name || "Unknown Pipeline"}</h3>
        <span className={`badge ${badgeClass(job.status)}`}>{job.status}</span>
      </div>

      <p className="muted">Job ID: {job.id}</p>
      <p className="muted">Attempts: {job.attempts}</p>
      <p className="muted">
        Created: {new Date(job.created_at).toLocaleString()}
      </p>

      <div className="card-actions">
        <button
          className="secondary-btn"
          onClick={() => navigate(`/jobs/${job.id}`)}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

function badgeClass(status: string) {
  if (status === "completed") return "badge-green";
  if (status === "processing") return "badge-blue";
  if (status === "pending") return "badge-yellow";
  if (status === "failed") return "badge-red";
  if (status === "skipped") return "badge-gray";
  return "badge-gray";
}