import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  addPipelineSubscriber,
  deletePipelineSubscriber,
  getPipelineSubscribers,
  getPipelines,
} from "../api/client";
import type { Pipeline, Subscriber } from "../types";

export default function SubscribersPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState("");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [targetUrl, setTargetUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadPipelines() {
    try {
      const pipelineRes = await getPipelines();
      const loadedPipelines = pipelineRes.data || [];
      setPipelines(loadedPipelines);

      if (loadedPipelines.length > 0 && !selectedPipelineId) {
        setSelectedPipelineId(loadedPipelines[0].id);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load pipelines");
    } finally {
      setLoading(false);
    }
  }

  async function loadSubscribers(pipelineId: string) {
    if (!pipelineId) {
      setSubscribers([]);
      return;
    }

    try {
      const res = await getPipelineSubscribers(pipelineId);
      setSubscribers(res.data || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load subscribers");
    }
  }

  useEffect(() => {
    loadPipelines();
  }, []);

  useEffect(() => {
    if (selectedPipelineId) {
      loadSubscribers(selectedPipelineId);
    }
  }, [selectedPipelineId]);

  async function handleAddSubscriber(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!selectedPipelineId) {
      setMessage("Please select a pipeline first");
      return;
    }

    if (!targetUrl.trim()) {
      setMessage("Subscriber URL is required");
      return;
    }

    try {
      setSubmitting(true);
      await addPipelineSubscriber(selectedPipelineId, targetUrl.trim());
      setTargetUrl("");
      setMessage("Subscriber added successfully");
      await loadSubscribers(selectedPipelineId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add subscriber");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteSubscriber(subscriberId: string) {
    if (!selectedPipelineId) return;

    const confirmed = window.confirm("Are you sure you want to delete this subscriber?");
    if (!confirmed) return;

    try {
      await deletePipelineSubscriber(selectedPipelineId, subscriberId);
      setMessage("Subscriber deleted successfully");
      await loadSubscribers(selectedPipelineId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete subscriber");
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <h1>Subscribers</h1>
        <p>Manage subscriber endpoints for each pipeline.</p>
      </div>

      <div className="page-two-columns">
        <div className="cute-card">
          <h2>Add Subscriber</h2>
          <form className="pipeline-form" onSubmit={handleAddSubscriber}>
            <label>Select Pipeline</label>
            <select
              className="cute-input"
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
            >
              <option value="">Select pipeline</option>
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>

            <label>Target URL</label>
            <input
              className="cute-input"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="http://localhost:3000/subscriber-notification-service"
            />

            {message && <div className="info-box">{message}</div>}

            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Subscriber"}
            </button>
          </form>
        </div>

        <div>
          {loading ? (
            <div className="loading-box">Loading subscribers...</div>
          ) : (
            <div className="cards-grid single-column">
              {subscribers.length === 0 ? (
                <div className="loading-box">No subscribers for this pipeline.</div>
              ) : (
                subscribers.map((subscriber) => (
                  <div key={subscriber.id} className="cute-card">
                    <h3>Subscriber Endpoint</h3>
                    <p className="muted">{subscriber.target_url}</p>
                    <div className="card-actions">
                      <button
                        className="danger-btn"
                        onClick={() => handleDeleteSubscriber(subscriber.id)}
                      >
                        Delete Subscriber
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}