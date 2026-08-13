import { atom } from "jotai";
import { atomWithHash } from "jotai-location";
import type { Highlighter } from "shiki";

export const windowWidthAtom = atomWithHash<number | null>("width", null);

export const showBackgroundAtom = atomWithHash<boolean>("background", true);

export const showLineNumbersAtom = atomWithHash<boolean | undefined>("lineNumbers", undefined);

export const fileNameAtom = atomWithHash<string>("title", "", {
  serialize(val) {
    return val;
  },
  deserialize(str) {
    return str || "";
  },
});

export const highlighterAtom = atom<Highlighter | null>(null);

export const loadingLanguageAtom = atom<boolean>(false);

const lineListAtom = (key: string) => {
  return atomWithHash<number[]>(key, [], {
    serialize(val) {
      return val.join(",");
    },
    deserialize(str) {
      return str ? str.split(",").map(Number) : [];
    },
  });
};

export const highlightedLinesAtom = lineListAtom("highlightedLines");

export const addedLinesAtom = lineListAtom("addedLines");

export const removedLinesAtom = lineListAtom("removedLines");

export const focusedLinesAtom = lineListAtom("focusedLines");

export const highlightedWordsAtom = atomWithHash<string[]>("highlightedWords", [], {
  serialize(val) {
    return val.map(encodeURIComponent).join(",");
  },
  deserialize(str) {
    return str ? str.split(",").map(decodeURIComponent) : [];
  },
});
