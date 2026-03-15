import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import { Activity, CheckCircle2, Clock3, XCircle, BarChart3 } from "lucide-react";
import { getJobs, getMetrics, getPipelines } from "../api/client";
import type { Job, MetricsResponse, Pipeline } from "../types";

type JobsPerPipeline = {
  pipelineName: string;
  count: number;
};

type JobsPerDay = {
  date: string;
  count: number;
};

export default function AnalyticsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [jobsRes, pipelinesRes, metricsRes] = await Promise.all([
          getJobs(),
          getPipelines(),
          getMetrics(),
        ]);

        setJobs(jobsRes.data || []);
        setPipelines(pipelinesRes.data || []);
        setMetrics(metricsRes);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const jobsByStatus = useMemo(() => {
    return {
      pending: jobs.filter((job) => job.status === "pending").length,
      processing: jobs.filter((job) => job.status === "processing").length,
      completed: jobs.filter((job) => job.status === "completed").length,
      failed: jobs.filter((job) => job.status === "failed").length,
      skipped: jobs.filter((job) => job.status === "skipped").length,
    };
  }, [jobs]);

  const jobsPerPipeline = useMemo<JobsPerPipeline[]>(() => {
    const counts: Record<string, number> = {};

    for (const job of jobs) {
      counts[job.pipeline_id] = (counts[job.pipeline_id] || 0) + 1;
    }

    return Object.entries(counts)
      .map(([pipelineId, count]) => {
        const pipeline = pipelines.find((p) => p.id === pipelineId);

        return {
          pipelineName: pipeline?.name || pipelineId,
          count,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [jobs, pipelines]);

  const jobsLast7Days = useMemo<JobsPerDay[]>(() => {
    const today = new Date();
    const map: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = 0;
    }

    for (const job of jobs) {
      const key = new Date(job.created_at).toISOString().slice(0, 10);
      if (key in map) {
        map[key] += 1;
      }
    }

    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [jobs]);

  const maxPipelineCount = Math.max(...jobsPerPipeline.map((item) => item.count), 1);
  const maxDailyCount = Math.max(...jobsLast7Days.map((item) => item.count), 1);

  return (
    <Layout>
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Operational insights for jobs, pipelines, and delivery activity.</p>
      </div>

      {loading ? (
        <div className="loading-box">Loading analytics...</div>
      ) : message ? (
        <div className="info-box">{message}</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              title="Pending Jobs"
              value={jobsByStatus.pending}
              icon={Clock3}
              tone="yellow"
            />
            <StatCard
              title="Processing Jobs"
              value={jobsByStatus.processing}
              icon={Activity}
              tone="purple"
            />
            <StatCard
              title="Completed Jobs"
              value={jobsByStatus.completed}
              icon={CheckCircle2}
              tone="green"
            />
            <StatCard title="Failed Jobs" value={jobsByStatus.failed} icon={XCircle} tone="red" />
          </div>

          <div className="page-two-columns">
            <div className="cute-card">
              <h2>Jobs by Pipeline</h2>
              {jobsPerPipeline.length === 0 ? (
                <p className="muted">No jobs available.</p>
              ) : (
                <div className="details-stack">
                  {jobsPerPipeline.map((item) => (
                    <div key={item.pipelineName} style={{ marginBottom: "14px" }}>
                      <div className="row-between">
                        <span>{item.pipelineName}</span>
                        <strong>{item.count}</strong>
                      </div>
                      <div className="analytics-bar-track">
                        <div
                          className="analytics-bar-fill"
                          style={{ width: `${(item.count / maxPipelineCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="cute-card">
              <h2>Job Activity (Last 7 Days)</h2>
              {jobsLast7Days.length === 0 ? (
                <p className="muted">No recent activity.</p>
              ) : (
                <div className="details-stack">
                  {jobsLast7Days.map((item) => (
                    <div key={item.date} style={{ marginBottom: "14px" }}>
                      <div className="row-between">
                        <span>{item.date}</span>
                        <strong>{item.count}</strong>
                      </div>
                      <div className="analytics-bar-track">
                        <div
                          className="analytics-bar-fill secondary"
                          style={{ width: `${(item.count / maxDailyCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="cute-card big-card">
            <h2>Delivery Summary</h2>
            <div className="stats-grid">
              <StatCard
                title="Deliveries Sent"
                value={metrics?.metrics.deliveries_sent || 0}
                icon={BarChart3}
                tone="blue"
              />
              <StatCard
                title="Deliveries Failed"
                value={metrics?.metrics.deliveries_failed || 0}
                icon={XCircle}
                tone="red"
              />
              <StatCard
                title="Pending Retries"
                value={metrics?.metrics.pending_retries || 0}
                icon={Clock3}
                tone="yellow"
              />
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
