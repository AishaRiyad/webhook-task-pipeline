import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import JobCard from "../components/JobCard";

describe("JobCard", () => {
  const mockJob = {
    id: "job-1",
    pipeline_id: "pipeline-1",
    webhook_event_id: "event-1",
    status: "completed",
    attempts: 1,
    max_attempts: 3,
    created_at: new Date().toISOString(),
    completed_at: null,
    failed_at: null,
  };

  const mockPipelines = [
    {
      id: "pipeline-1",
      name: "Orders Pipeline",
      source_key: "orders-123",
      action_type: "enrich",
      action_config: {},
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it("renders pipeline name", () => {
    render(
      <MemoryRouter>
        <JobCard job={mockJob} pipelines={mockPipelines} />
      </MemoryRouter>
    );

    expect(screen.getByText("Orders Pipeline")).toBeInTheDocument();
  });

  it("renders job status", () => {
    render(
      <MemoryRouter>
        <JobCard job={mockJob} pipelines={mockPipelines} />
      </MemoryRouter>
    );

    expect(screen.getByText("completed")).toBeInTheDocument();
  });

  it("renders attempts information", () => {
    render(
      <MemoryRouter>
        <JobCard job={mockJob} pipelines={mockPipelines} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Attempts:/i)).toBeInTheDocument();
  });

  it("renders created date label", () => {
    render(
      <MemoryRouter>
        <JobCard job={mockJob} pipelines={mockPipelines} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Created:/i)).toBeInTheDocument();
  });
});
