import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import JobCard from "../components/JobCard";
import { getJobs, getPipelines } from "../api/client";
import type { Job, Pipeline } from "../types";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [jobRes, pipelineRes] = await Promise.all([getJobs(), getPipelines()]);
        setJobs(jobRes.data || []);
        setPipelines(pipelineRes.data || []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <Layout>
      <div className="page-header">
        <h1>Jobs</h1>
        <p>Review the background processing tasks created by webhook events.</p>
      </div>

      {loading ? (
        <div className="loading-box">Loading jobs...</div>
      ) : (
        <div className="cards-grid">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} pipelines={pipelines} />
          ))}
        </div>
      )}
    </Layout>
  );
}