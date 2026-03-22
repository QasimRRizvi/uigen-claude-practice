import { Loader2 } from "lucide-react";

interface StrReplaceArgs {
  command: "view" | "create" | "str_replace" | "insert" | "undo_edit";
  path: string;
}

interface FileManagerArgs {
  command: "rename" | "delete";
  path: string;
  new_path?: string;
}

interface ToolInvocation {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

interface ToolCallBadgeProps {
  tool: ToolInvocation;
}

function getLabel(toolName: string, args: Record<string, unknown>): string {
  const filename = (args.path as string)?.split("/").pop() ?? args.path;

  if (toolName === "str_replace_editor") {
    const { command } = args as unknown as StrReplaceArgs;
    switch (command) {
      case "create":
        return `Creating ${filename}`;
      case "str_replace":
      case "insert":
        return `Editing ${filename}`;
      case "view":
        return `Reading ${filename}`;
      case "undo_edit":
        return `Reverting ${filename}`;
    }
  }

  if (toolName === "file_manager") {
    const { command, new_path } = args as unknown as FileManagerArgs;
    if (command === "rename") {
      const newFilename = new_path?.split("/").pop() ?? new_path;
      return `Renaming ${filename} to ${newFilename}`;
    }
    if (command === "delete") {
      return `Deleting ${filename}`;
    }
  }

  return toolName;
}

export function ToolCallBadge({ tool }: ToolCallBadgeProps) {
  const done = tool.state === "result" && tool.result != null;
  const label = getLabel(tool.toolName, tool.args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
