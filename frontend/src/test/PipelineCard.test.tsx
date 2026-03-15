import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PipelineCard from "../components/PipelineCard";

describe("PipelineCard", () => {
  const mockPipeline = {
    id: "pipeline-1",
    name: "Orders Pipeline",
    source_key: "orders-123",
    action_type: "enrich",
    action_config: {},
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("renders pipeline name", () => {
    render(
      <PipelineCard pipeline={mockPipeline} links={[]} onDelete={vi.fn()} onDeleteLink={vi.fn()} />
    );

    expect(screen.getByText("Orders Pipeline")).toBeInTheDocument();
  });

  it("shows pipeline action type", () => {
    render(
      <PipelineCard pipeline={mockPipeline} links={[]} onDelete={vi.fn()} onDeleteLink={vi.fn()} />
    );

    expect(screen.getByText(/Action:/i)).toBeInTheDocument();
    expect(screen.getByText(/enrich/i)).toBeInTheDocument();
  });

  it("renders delete button", () => {
    render(
      <PipelineCard pipeline={mockPipeline} links={[]} onDelete={vi.fn()} onDeleteLink={vi.fn()} />
    );

    expect(screen.getByRole("button", { name: /delete pipeline/i })).toBeInTheDocument();
  });

  it("handles inactive pipeline state", () => {
    const inactivePipeline = {
      ...mockPipeline,
      is_active: false,
    };

    render(
      <PipelineCard
        pipeline={inactivePipeline}
        links={[]}
        onDelete={vi.fn()}
        onDeleteLink={vi.fn()}
      />
    );

    expect(screen.getByText(/inactive/i)).toBeInTheDocument();
  });
});
