import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Activity } from "lucide-react";
import StatCard from "./StatCard";

describe("StatCard", () => {
  it("renders title and value", () => {
    render(<StatCard title="Total Jobs" value={12} icon={Activity} tone="blue" />);

    expect(screen.getByText("Total Jobs")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});
