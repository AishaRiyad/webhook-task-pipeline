export type PipelineLinkEdge = {
  source_pipeline_id: string;
  target_pipeline_id: string;
};

export function willCreateCycle(
  links: PipelineLinkEdge[],
  sourcePipelineId: string,
  targetPipelineId: string
): boolean {
  const graph = new Map<string, string[]>();

  for (const link of links) {
    if (!graph.has(link.source_pipeline_id)) {
      graph.set(link.source_pipeline_id, []);
    }

    graph.get(link.source_pipeline_id)!.push(link.target_pipeline_id);
  }

  if (!graph.has(sourcePipelineId)) {
    graph.set(sourcePipelineId, []);
  }

  graph.get(sourcePipelineId)!.push(targetPipelineId);

  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(node: string): boolean {
    if (stack.has(node)) {
      return true;
    }

    if (visited.has(node)) {
      return false;
    }

    visited.add(node);
    stack.add(node);

    const neighbors = graph.get(node) ?? [];

    for (const neighbor of neighbors) {
      if (dfs(neighbor)) {
        return true;
      }
    }

    stack.delete(node);
    return false;
  }

  return dfs(sourcePipelineId);
}
