import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import { Activity, CheckCircle2, Clock3, Server, XCircle, RefreshCcw } from "lucide-react";
import { getJobs, getPipelines } from "../api/client";
import type { Job, Pipeline } from "../types";

export default function DashboardPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const summary = useMemo(() => {
    return {
      totalPipelines: pipelines.length,
      totalJobs: jobs.length,
      completedJobs: jobs.filter((j) => j.status === "completed").length,
      pendingJobs: jobs.filter((j) => j.status === "pending").length,
      processingJobs: jobs.filter((j) => j.status === "processing").length,
      failedJobs: jobs.filter((j) => j.status === "failed").length,
    };
  }, [pipelines, jobs]);

  useEffect(() => {
    async function load() {
      try {
        const [pipelineRes, jobRes] = await Promise.all([getPipelines(), getJobs()]);
        setPipelines(pipelineRes.data || []);
        setJobs(jobRes.data || []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <Layout>
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <p>Monitor your webhook pipeline system in one beautiful place.</p>
      </div>

      {loading ? (
        <div className="loading-box">Loading dashboard...</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              title="Total Pipelines"
              value={summary.totalPipelines}
              icon={Server}
              tone="pink"
            />
            <StatCard title="Total Jobs" value={summary.totalJobs} icon={Activity} tone="blue" />
            <StatCard
              title="Completed Jobs"
              value={summary.completedJobs}
              icon={CheckCircle2}
              tone="green"
            />
            <StatCard
              title="Pending Jobs"
              value={summary.pendingJobs}
              icon={Clock3}
              tone="yellow"
            />
            <StatCard
              title="Processing Jobs"
              value={summary.processingJobs}
              icon={RefreshCcw}
              tone="purple"
            />
            <StatCard title="Failed Jobs" value={summary.failedJobs} icon={XCircle} tone="red" />
          </div>

          <div className="cute-card big-card">
            <h2>About this project</h2>
            <p className="muted">
              This dashboard is connected to your backend APIs. It shows pipelines, background jobs,
              and the chaining flow where one pipeline triggers another automatically.
            </p>
          </div>
        </>
      )}
    </Layout>
  );
}
