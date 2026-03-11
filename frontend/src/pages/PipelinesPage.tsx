import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import PipelineCard from "../components/PipelineCard";
import {
  createPipeline,
  deletePipeline,
  deletePipelineLink,
  getPipelineLinks,
  getPipelines,
} from "../api/client";
import type { Pipeline, PipelineLink } from "../types";

type ActionType =
  | "transform"
  | "filter"
  | "enrich"
  | "deduplicate"
  | "aggregate"
  | "running_sum";

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [linksBySource, setLinksBySource] = useState<Record<string, PipelineLink[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [actionType, setActionType] = useState<ActionType>("enrich");
  const [subscriberUrl, setSubscriberUrl] = useState("");
  const [transformFields, setTransformFields] = useState("");
  const [filterField, setFilterField] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [dedupeField, setDedupeField] = useState("");
  const [aggregateField, setAggregateField] = useState("");
  const [runningSumField, setRunningSumField] = useState("");
  const [message, setMessage] = useState("");

  async function loadPipelines() {
    try {
      const pipelineRes = await getPipelines();
      const loadedPipelines = pipelineRes.data || [];
      setPipelines(loadedPipelines);

      const allLinks = await Promise.all(
        loadedPipelines.map(async (pipeline) => {
          try {
            const linkRes = await getPipelineLinks(pipeline.id);
            return [pipeline.id, linkRes.data || []] as const;
          } catch {
            return [pipeline.id, []] as const;
          }
        })
      );

      setLinksBySource(Object.fromEntries(allLinks));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load pipelines");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPipelines();
  }, []);

  function buildActionConfig() {
    if (actionType === "transform") {
      return {
        fields: transformFields
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
    }

    if (actionType === "filter") {
      return {
        field: filterField.trim(),
        value: filterValue.trim(),
      };
    }

    if (actionType === "deduplicate") {
      return {
        id_field: dedupeField.trim(),
      };
    }

    if (actionType === "aggregate") {
      return {
        field: aggregateField.trim(),
      };
    }

    if (actionType === "running_sum") {
      return {
        field: runningSumField.trim(),
      };
    }

    return {};
  }

  async function handleCreatePipeline(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!name.trim()) {
      setMessage("Pipeline name is required");
      return;
    }

    if (actionType === "transform" && !transformFields.trim()) {
      setMessage("Please enter fields for transform action");
      return;
    }

    if (actionType === "filter" && (!filterField.trim() || !filterValue.trim())) {
      setMessage("Please enter filter field and value");
      return;
    }

    if (actionType === "deduplicate" && !dedupeField.trim()) {
      setMessage("Please enter event ID field for deduplicate action");
      return;
    }

    if (actionType === "aggregate" && !aggregateField.trim()) {
      setMessage("Please enter field for aggregate action");
      return;
    }

    if (actionType === "running_sum" && !runningSumField.trim()) {
      setMessage("Please enter field for running sum action");
      return;
    }

    try {
      setSubmitting(true);

      const subscribers = subscriberUrl.trim()
        ? [{ target_url: subscriberUrl.trim() }]
        : [];

      await createPipeline({
        name: name.trim(),
        action_type: actionType,
        action_config: buildActionConfig(),
        subscribers,
      });

      setName("");
      setActionType("enrich");
      setSubscriberUrl("");
      setTransformFields("");
      setFilterField("");
      setFilterValue("");
      setDedupeField("");
      setAggregateField("");
      setRunningSumField("");
      setMessage("Pipeline created successfully");

      await loadPipelines();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create pipeline");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePipeline(pipelineId: string) {
    const confirmed = window.confirm("Are you sure you want to delete this pipeline?");
    if (!confirmed) return;

    try {
      await deletePipeline(pipelineId);
      setMessage("Pipeline deleted successfully");
      await loadPipelines();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete pipeline");
    }
  }

  async function handleDeleteLink(sourcePipelineId: string, targetPipelineId: string) {
    const confirmed = window.confirm("Are you sure you want to remove this link?");
    if (!confirmed) return;

    try {
      await deletePipelineLink(sourcePipelineId, targetPipelineId);
      setMessage("Pipeline link removed successfully");
      await loadPipelines();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to remove link");
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <h1>Pipelines</h1>
        <p>Create, view, delete, and inspect pipelines from the frontend.</p>
      </div>

      <div className="page-two-columns">
        <div className="cute-card">
          <h2>Create Pipeline</h2>
          <p className="muted">Build a new pipeline connected to your backend API.</p>

          <form className="pipeline-form" onSubmit={handleCreatePipeline}>
            <label>Pipeline Name</label>
            <input
              className="cute-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter pipeline name"
            />

            <label>Action Type</label>
            <select
              className="cute-input"
              value={actionType}
              onChange={(e) => setActionType(e.target.value as ActionType)}
            >
              <option value="enrich">enrich</option>
              <option value="transform">transform</option>
              <option value="filter">filter</option>
              <option value="deduplicate">deduplicate</option>
              <option value="aggregate">aggregate</option>
              <option value="running_sum">running_sum</option>
            </select>

            {actionType === "transform" && (
              <>
                <label>Transform Fields</label>
                <input
                  className="cute-input"
                  value={transformFields}
                  onChange={(e) => setTransformFields(e.target.value)}
                  placeholder="orderId,status,processed_at"
                />
              </>
            )}

            {actionType === "filter" && (
              <>
                <label>Filter Field</label>
                <input
                  className="cute-input"
                  value={filterField}
                  onChange={(e) => setFilterField(e.target.value)}
                  placeholder="status"
                />

                <label>Filter Value</label>
                <input
                  className="cute-input"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder="created"
                />
              </>
            )}

            {actionType === "deduplicate" && (
              <>
                <label>Event ID Field</label>
                <input
                  className="cute-input"
                  value={dedupeField}
                  onChange={(e) => setDedupeField(e.target.value)}
                  placeholder="eventId"
                />
              </>
            )}

            {actionType === "aggregate" && (
              <>
                <label>Aggregate Field</label>
                <input
                  className="cute-input"
                  value={aggregateField}
                  onChange={(e) => setAggregateField(e.target.value)}
                  placeholder="amount"
                />
              </>
            )}

            {actionType === "running_sum" && (
              <>
                <label>Running Sum Field</label>
                <input
                  className="cute-input"
                  value={runningSumField}
                  onChange={(e) => setRunningSumField(e.target.value)}
                  placeholder="amount"
                />
              </>
            )}

            <label>Subscriber URL</label>
            <input
              className="cute-input"
              value={subscriberUrl}
              onChange={(e) => setSubscriberUrl(e.target.value)}
              placeholder="http://localhost:3000/subscriber-order-service"
            />

            {message && <div className="info-box">{message}</div>}

            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Pipeline"}
            </button>
          </form>
        </div>

        <div>
          {loading ? (
            <div className="loading-box">Loading pipelines...</div>
          ) : pipelines.length === 0 ? (
            <div className="loading-box">No pipelines yet.</div>
          ) : (
            <div className="cards-grid single-column">
              {pipelines.map((pipeline) => (
                <PipelineCard
                  key={pipeline.id}
                  pipeline={pipeline}
                  links={linksBySource[pipeline.id] || []}
                  onDelete={handleDeletePipeline}
                  onDeleteLink={handleDeleteLink}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}