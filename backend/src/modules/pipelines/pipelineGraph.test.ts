import { describe, expect, it } from "vitest";
import { willCreateCycle, type PipelineLinkEdge } from "./pipelineGraph";

describe("pipelineGraph - willCreateCycle", () => {
  it("returns false when adding a normal link without creating a cycle", () => {
    const links: PipelineLinkEdge[] = [
      { source_pipeline_id: "A", target_pipeline_id: "B" },
      { source_pipeline_id: "B", target_pipeline_id: "C" },
    ];

    const result = willCreateCycle(links, "C", "D");

    expect(result).toBe(false);
  });

  it("returns true when adding a link that creates a direct cycle", () => {
    const links: PipelineLinkEdge[] = [{ source_pipeline_id: "A", target_pipeline_id: "B" }];

    const result = willCreateCycle(links, "B", "A");

    expect(result).toBe(true);
  });

  it("returns true when adding a link that creates an indirect cycle", () => {
    const links: PipelineLinkEdge[] = [
      { source_pipeline_id: "A", target_pipeline_id: "B" },
      { source_pipeline_id: "B", target_pipeline_id: "C" },
    ];

    const result = willCreateCycle(links, "C", "A");

    expect(result).toBe(true);
  });

  it("returns false when graph is disconnected and no cycle is introduced", () => {
    const links: PipelineLinkEdge[] = [
      { source_pipeline_id: "A", target_pipeline_id: "B" },
      { source_pipeline_id: "X", target_pipeline_id: "Y" },
    ];

    const result = willCreateCycle(links, "B", "D");

    expect(result).toBe(false);
  });

  it("returns true for self loop", () => {
    const links: PipelineLinkEdge[] = [];

    const result = willCreateCycle(links, "A", "A");

    expect(result).toBe(true);
  });
});
