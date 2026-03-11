import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { getJobDetails, getPipelines } from "../api/client";
import type { JobDetailsResponse, Pipeline } from "../types";

export default function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [jobData, setJobData] = useState<JobDetailsResponse | null>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      if (!id) return;

      try {
        const [jobRes, pipelineRes] = await Promise.all([
          getJobDetails(id),
          getPipelines(),
        ]);

        setJobData(jobRes.data);
        setPipelines(pipelineRes.data || []);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Failed to load job details"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const job = jobData?.job;
  const deliveries = jobData?.deliveries || [];
  const attempts = jobData?.attempts || [];
  const pipeline = pipelines.find((p) => p.id === job?.pipeline_id);

  return (
    <Layout>
      <div className="page-header row-between">
        <div>
          <h1>Job Details</h1>
          <p>Inspect processing result, deliveries, and subscriber attempts.</p>
        </div>

        <button className="secondary-btn" onClick={() => navigate("/jobs")}>
          Back to Jobs
        </button>
      </div>

      {loading ? (
        <div className="loading-box">Loading job details...</div>
      ) : message ? (
        <div className="info-box">{message}</div>
      ) : !job ? (
        <div className="loading-box">Job not found.</div>
      ) : (
        <div className="details-layout">
          <div className="details-column">
            <div className="cute-card">
              <h2>Job Information</h2>
              <p className="muted"><strong>Job ID:</strong> {job.id}</p>
              <p className="muted"><strong>Pipeline:</strong> {pipeline?.name || job.pipeline_id}</p>
              <p className="muted"><strong>Status:</strong> {job.status}</p>
              <p className="muted"><strong>Attempts:</strong> {job.attempts}</p>
              <p className="muted"><strong>Created At:</strong> {new Date(job.created_at).toLocaleString()}</p>
              {job.completed_at && (
                <p className="muted"><strong>Completed At:</strong> {new Date(job.completed_at).toLocaleString()}</p>
              )}
              {job.failed_at && (
                <p className="muted"><strong>Failed At:</strong> {new Date(job.failed_at).toLocaleString()}</p>
              )}
            </div>

            <div className="cute-card">
              <h2>Deliveries</h2>
              {deliveries.length === 0 ? (
                <p className="muted">No deliveries found for this job.</p>
              ) : (
                <div className="details-stack">
                  {deliveries.map((delivery) => (
                    <div key={delivery.id} className="sub-card">
                      <div className="row-between">
                        <h3>Subscriber Delivery</h3>
                        <span className={`badge ${deliveryBadge(delivery.status)}`}>
                          {delivery.status}
                        </span>
                      </div>

                      <p className="muted"><strong>Target URL:</strong> {delivery.target_url || delivery.subscriber_id}</p>
                      <p className="muted"><strong>Attempts:</strong> {delivery.attempts} / {delivery.max_attempts}</p>

                      {delivery.last_response_status !== null &&
                        delivery.last_response_status !== undefined && (
                          <p className="muted">
                            <strong>Last Response Status:</strong> {delivery.last_response_status}
                          </p>
                        )}

                      {delivery.last_error && (
                        <p className="muted"><strong>Last Error:</strong> {delivery.last_error}</p>
                      )}

                      {delivery.next_retry_at && (
                        <p className="muted">
                          <strong>Next Retry:</strong> {new Date(delivery.next_retry_at).toLocaleString()}
                        </p>
                      )}

                      {delivery.delivered_at && (
                        <p className="muted">
                          <strong>Delivered At:</strong> {new Date(delivery.delivered_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="details-column">
            <div className="cute-card">
              <h2>Delivery Attempt Logs</h2>
              {attempts.length === 0 ? (
                <p className="muted">No attempt logs found.</p>
              ) : (
                <div className="details-stack">
                  {attempts.map((attempt) => (
                    <div key={attempt.id} className="sub-card">
                      <div className="row-between">
                        <h3>Attempt #{attempt.attempt_number}</h3>
                        <span className={`badge ${attempt.response_status && attempt.response_status >= 200 && attempt.response_status < 300 ? "badge-green" : "badge-yellow"}`}>
                          {attempt.response_status ? `HTTP ${attempt.response_status}` : "No Response"}
                        </span>
                      </div>

                      <p className="muted">
                        <strong>Attempted At:</strong> {new Date(attempt.attempted_at).toLocaleString()}
                      </p>

                      {attempt.error_message && (
                        <p className="muted"><strong>Error:</strong> {attempt.error_message}</p>
                      )}

                      {attempt.response_body && (
                        <div className="json-box">
                          <strong>Response Body</strong>
                          <pre>{attempt.response_body}</pre>
                        </div>
                      )}

                      <div className="json-box">
                        <strong>Request Payload</strong>
                        <pre>{JSON.stringify(attempt.request_payload, null, 2)}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function deliveryBadge(status: string) {
  if (status === "delivered") return "badge-green";
  if (status === "failed") return "badge-red";
  if (status === "retry_pending") return "badge-yellow";
  if (status === "pending") return "badge-blue";
  return "badge-gray";
}