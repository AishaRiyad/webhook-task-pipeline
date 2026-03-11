import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import {
  CheckCircle2,
  Clock3,
  Send,
  Server,
  XCircle,
} from "lucide-react";
import { getMetrics } from "../api/client";
import type { MetricsResponse } from "../types";

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await getMetrics();
        setMetrics(response);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load metrics");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const data = metrics?.metrics;

  return (
    <Layout>
      <div className="page-header">
        <h1>Metrics</h1>
        <p>High-level operational metrics for pipelines, jobs, and deliveries.</p>
      </div>

      {loading ? (
        <div className="loading-box">Loading metrics...</div>
      ) : message ? (
        <div className="info-box">{message}</div>
      ) : !data ? (
        <div className="loading-box">No metrics available.</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              title="Total Pipelines"
              value={data.pipelines}
              icon={Server}
              tone="pink"
            />
            <StatCard
              title="Processed Jobs"
              value={data.jobs_processed}
              icon={CheckCircle2}
              tone="green"
            />
            <StatCard
              title="Failed Jobs"
              value={data.jobs_failed}
              icon={XCircle}
              tone="red"
            />
            <StatCard
              title="Delivered"
              value={data.deliveries_sent}
              icon={Send}
              tone="blue"
            />
            <StatCard
              title="Failed Deliveries"
              value={data.deliveries_failed}
              icon={XCircle}
              tone="red"
            />
            <StatCard
              title="Pending Retries"
              value={data.pending_retries}
              icon={Clock3}
              tone="yellow"
            />
          </div>

          <div className="cute-card big-card">
            <h2>Metrics Summary</h2>
            <p className="muted">
              This page reads real aggregated values from the backend metrics endpoint.
              It summarizes how many pipelines belong to the current user, how many jobs
              were processed or failed, and how subscriber deliveries are performing.
            </p>

            <p className="muted" style={{ marginTop: "12px" }}>
              <strong>Last Updated:</strong>{" "}
              {metrics.timestamp ? new Date(metrics.timestamp).toLocaleString() : "N/A"}
            </p>
          </div>
        </>
      )}
    </Layout>
  );
}