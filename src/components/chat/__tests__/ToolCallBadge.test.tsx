import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, test, expect } from "vitest";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

function makeTool(
  toolName: string,
  args: Record<string, unknown>,
  state: "call" | "result" = "call",
  result?: unknown
) {
  return { toolName, args, state, result: result ?? (state === "result" ? {} : undefined) };
}

test("shows 'Creating' for str_replace_editor create command", () => {
  render(<ToolCallBadge tool={makeTool("str_replace_editor", { command: "create", path: "/src/components/Button.tsx" })} />);
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor str_replace command", () => {
  render(<ToolCallBadge tool={makeTool("str_replace_editor", { command: "str_replace", path: "/src/App.tsx" })} />);
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor insert command", () => {
  render(<ToolCallBadge tool={makeTool("str_replace_editor", { command: "insert", path: "/src/App.tsx" })} />);
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("shows 'Reading' for str_replace_editor view command", () => {
  render(<ToolCallBadge tool={makeTool("str_replace_editor", { command: "view", path: "/src/index.tsx" })} />);
  expect(screen.getByText("Reading index.tsx")).toBeDefined();
});

test("shows 'Reverting' for str_replace_editor undo_edit command", () => {
  render(<ToolCallBadge tool={makeTool("str_replace_editor", { command: "undo_edit", path: "/src/App.tsx" })} />);
  expect(screen.getByText("Reverting App.tsx")).toBeDefined();
});

test("shows 'Renaming' with both filenames for file_manager rename", () => {
  render(<ToolCallBadge tool={makeTool("file_manager", { command: "rename", path: "/src/Old.tsx", new_path: "/src/New.tsx" })} />);
  expect(screen.getByText("Renaming Old.tsx to New.tsx")).toBeDefined();
});

test("shows 'Deleting' for file_manager delete", () => {
  render(<ToolCallBadge tool={makeTool("file_manager", { command: "delete", path: "/src/Unused.tsx" })} />);
  expect(screen.getByText("Deleting Unused.tsx")).toBeDefined();
});

test("falls back to tool name for unknown tools", () => {
  render(<ToolCallBadge tool={makeTool("unknown_tool", { path: "/src/file.ts" })} />);
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("shows spinner when in-progress", () => {
  const { container } = render(
    <ToolCallBadge tool={makeTool("str_replace_editor", { command: "create", path: "/src/Button.tsx" }, "call")} />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows green dot when done", () => {
  const { container } = render(
    <ToolCallBadge tool={makeTool("str_replace_editor", { command: "create", path: "/src/Button.tsx" }, "result", {})} />
  );
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});
