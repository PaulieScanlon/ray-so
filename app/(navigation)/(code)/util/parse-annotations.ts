export type ParsedAnnotations = {
  code: string;
  highlightedLines: number[];
  addedLines: number[];
  removedLines: number[];
  focusedLines: number[];
  highlightedWords: string[];
};

type Directive = {
  kind: string;
  value: string;
  count: number;
};

const NOTATION = /\s*(?:\/\/|\/\*|#|--|;|%|<!--)\s*((?:\[!code\s+[^\]]+\]\s*)+)(?:\*\/|-->)?\s*$/;
const DIRECTIVE = /\[!code\s+([^\]]+)\]/g;

export const hasAnnotations = (text: string) => {
  return text.includes("[!code ");
};

const parseDirective = (raw: string): Directive => {
  const trimmed = raw.trim();
  if (trimmed.startsWith("word:")) {
    const parts = trimmed.slice(5).split(":");
    const last = parts[parts.length - 1];
    if (parts.length > 1 && /^\d+$/.test(last)) {
      return { kind: "word", value: parts.slice(0, -1).join(":"), count: Number(last) };
    }
    return { kind: "word", value: parts.join(":"), count: 1 };
  }
  const separator = trimmed.lastIndexOf(":");
  const count = separator === -1 ? NaN : Number(trimmed.slice(separator + 1));
  if (separator !== -1 && count > 0) {
    return { kind: trimmed.slice(0, separator), value: "", count };
  }
  return { kind: trimmed, value: "", count: 1 };
};

export const parseAnnotations = (source: string): ParsedAnnotations => {
  const lines: string[] = [];
  const highlightedLines: number[] = [];
  const addedLines: number[] = [];
  const removedLines: number[] = [];
  const focusedLines: number[] = [];
  const highlightedWords: string[] = [];

  let pending: Directive[] = [];

  const apply = (directive: Directive, lineNumber: number) => {
    if (directive.kind === "++") {
      addedLines.push(lineNumber);
      return;
    }
    if (directive.kind === "--") {
      removedLines.push(lineNumber);
      return;
    }
    if (directive.kind === "focus") {
      focusedLines.push(lineNumber);
      return;
    }
    if (directive.kind === "highlight" || directive.kind === "error" || directive.kind === "warning") {
      highlightedLines.push(lineNumber);
    }
  };

  source.split("\n").forEach((raw) => {
    const match = NOTATION.exec(raw);
    let text = raw;
    let inline: Directive[] = [];

    if (match) {
      const directives = Array.from(match[1].matchAll(DIRECTIVE)).map((entry) => {
        return parseDirective(entry[1]);
      });
      directives.forEach((directive) => {
        if (directive.kind === "word" && directive.value) {
          highlightedWords.push(directive.value);
        }
      });
      const stripped = raw.slice(0, match.index);
      if (stripped.trim() === "") {
        pending = [...pending, ...directives];
        return;
      }
      text = stripped;
      inline = directives;
    }

    lines.push(text);
    const lineNumber = lines.length;
    const active = [...pending, ...inline];
    pending = [];

    active.forEach((directive) => {
      apply(directive, lineNumber);
      if (directive.count > 1) {
        pending.push({ ...directive, count: directive.count - 1 });
      }
    });
  });

  return {
    code: lines.join("\n"),
    highlightedLines,
    addedLines,
    removedLines,
    focusedLines,
    highlightedWords: Array.from(new Set(highlightedWords)),
  };
};
