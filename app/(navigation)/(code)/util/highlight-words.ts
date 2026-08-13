import type { ShikiTransformer } from "shiki";

type LineElement = Parameters<NonNullable<ShikiTransformer["line"]>>[0];
type LineChild = LineElement["children"][number];
type Range = [number, number];

const textContent = (node: LineChild): string => {
  if (node.type === "text") {
    return node.value;
  }
  if (node.type === "element") {
    return node.children.map(textContent).join("");
  }
  return "";
};

const findRanges = (text: string, words: string[]): Range[] => {
  const ranges: Range[] = [];
  words.forEach((word) => {
    if (!word) {
      return;
    }
    let index = text.indexOf(word);
    while (index !== -1) {
      ranges.push([index, index + word.length]);
      index = text.indexOf(word, index + word.length);
    }
  });
  return ranges.sort((a, b) => {
    return a[0] - b[0];
  });
};

const mergeRanges = (ranges: Range[]): Range[] => {
  const merged: Range[] = [];
  ranges.forEach(([start, end]) => {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
      return;
    }
    merged.push([start, end]);
  });
  return merged;
};

const splitToken = (value: string, offset: number, ranges: Range[]): LineChild[] => {
  const nodes: LineChild[] = [];
  let cursor = 0;
  ranges.forEach(([start, end]) => {
    const from = Math.max(start - offset, 0);
    const to = Math.min(end - offset, value.length);
    if (from >= to) {
      return;
    }
    if (from > cursor) {
      nodes.push({ type: "text", value: value.slice(cursor, from) });
    }
    nodes.push({
      type: "element",
      tagName: "span",
      properties: { class: ["highlighted-word"] },
      children: [{ type: "text", value: value.slice(from, to) }],
    });
    cursor = to;
  });
  if (cursor < value.length) {
    nodes.push({ type: "text", value: value.slice(cursor) });
  }
  return nodes;
};

export const highlightWords = (line: LineElement, words: string[]) => {
  if (words.length === 0) {
    return;
  }
  const ranges = mergeRanges(findRanges(line.children.map(textContent).join(""), words));
  if (ranges.length === 0) {
    return;
  }
  let offset = 0;
  line.children = line.children.map((child) => {
    const value = textContent(child);
    const start = offset;
    offset += value.length;
    if (child.type !== "element") {
      return child;
    }
    const isFlat = child.children.every((grandChild) => {
      return grandChild.type === "text";
    });
    if (!isFlat) {
      return child;
    }
    const overlapping = ranges.filter(([rangeStart, rangeEnd]) => {
      return rangeEnd > start && rangeStart < start + value.length;
    });
    if (overlapping.length === 0) {
      return child;
    }
    child.children = splitToken(value, start, overlapping);
    return child;
  });
};
