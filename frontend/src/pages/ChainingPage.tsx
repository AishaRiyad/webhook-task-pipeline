import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  createPipelineLink,
  deletePipelineLink,
  getPipelineLinks,
  getPipelines,
} from "../api/client";
import type { Pipeline, PipelineLink } from "../types";

export default function ChainingPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [linksBySource, setLinksBySource] = useState<Record<string, PipelineLink[]>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [sourcePipelineId, setSourcePipelineId] = useState("");
  const [targetPipelineId, setTargetPipelineId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      const pipelineRes = await getPipelines();
      const loadedPipelines = pipelineRes.data || [];
      setPipelines(loadedPipelines);

      const entries = await Promise.all(
        loadedPipelines.map(async (pipeline) => {
          try {
            const linkRes = await getPipelineLinks(pipeline.id);
            return [pipeline.id, linkRes.data || []] as const;
          } catch {
            return [pipeline.id, []] as const;
          }
        })
      );

      setLinksBySource(Object.fromEntries(entries));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load chaining data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateLink(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!sourcePipelineId || !targetPipelineId) {
      setMessage("Please choose both source and target pipelines");
      return;
    }

    if (sourcePipelineId === targetPipelineId) {
      setMessage("Source and target pipelines cannot be the same");
      return;
    }

    try {
      setSubmitting(true);
      await createPipelineLink(sourcePipelineId, targetPipelineId);
      setMessage("Pipeline link created successfully");
      setTargetPipelineId("");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create link");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteLink(sourceId: string, targetId: string) {
    const confirmed = window.confirm("Are you sure you want to remove this link?");
    if (!confirmed) return;

    try {
      await deletePipelineLink(sourceId, targetId);
      setMessage("Pipeline link removed successfully");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete link");
    }
  }

  function getPipelineName(id: string) {
    return pipelines.find((p) => p.id === id)?.name || id;
  }

  return (
    <Layout>
      <div className="page-header">
        <h1>Pipeline Chaining</h1>
        <p>Create and remove links between pipelines directly from the frontend.</p>
      </div>

      <div className="page-two-columns">
        <div className="cute-card">
          <h2>Create Link</h2>
          <p className="muted">
            Connect one pipeline to another so the result of the first triggers the second.
          </p>

          <form className="pipeline-form" onSubmit={handleCreateLink}>
            <label>Source Pipeline</label>
            <select
              className="cute-input"
              value={sourcePipelineId}
              onChange={(e) => setSourcePipelineId(e.target.value)}
            >
              <option value="">Select source pipeline</option>
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>

            <label>Target Pipeline</label>
            <select
              className="cute-input"
              value={targetPipelineId}
              onChange={(e) => setTargetPipelineId(e.target.value)}
            >
              <option value="">Select target pipeline</option>
              {pipelines
                .filter((pipeline) => pipeline.id !== sourcePipelineId)
                .map((pipeline) => (
                  <option key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </option>
                ))}
            </select>

            {message && <div className="info-box">{message}</div>}

            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting ? "Creating Link..." : "Create Link"}
            </button>
          </form>
        </div>

        <div>
          {loading ? (
            <div className="loading-box">Loading chaining view...</div>
          ) : pipelines.length === 0 ? (
            <div className="loading-box">No pipelines found.</div>
          ) : (
            <div className="chain-list">
              {pipelines.map((pipeline) => {
                const links = linksBySource[pipeline.id] || [];

                return (
                  <div key={pipeline.id} className="chain-card">
                    <div className="chain-source">
                      <h3>{pipeline.name}</h3>
                      <span className="badge badge-blue">{pipeline.action_type}</span>
                    </div>

                    {links.length === 0 ? (
                      <p className="muted">No next pipeline</p>
                    ) : (
                      <div className="chain-targets">
                        {links.map((link) => (
                          <div key={link.id} className="chain-arrow-row">
                            <span className="arrow">→</span>
                            <div className="chain-target-box chain-target-row">
                              <div>
                                <strong>
                                  {link.target_pipeline_name ||
                                    getPipelineName(link.target_pipeline_id)}
                                </strong>
                                <p className="muted small-text">
                                  Action: {link.target_pipeline_action_type || "Unknown"}
                                </p>
                              </div>

                              <button
                                className="mini-danger-btn"
                                onClick={() =>
                                  handleDeleteLink(pipeline.id, link.target_pipeline_id)
                                }
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
