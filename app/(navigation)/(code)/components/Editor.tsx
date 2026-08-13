import React, {
  useCallback,
  KeyboardEventHandler,
  useRef,
  ChangeEventHandler,
  ClipboardEventHandler,
  FocusEventHandler,
  useState,
  useEffect,
} from "react";
import styles from "./Editor.module.css";
import { useAtom, useSetAtom } from "jotai";
import { codeAtom, isCodeExampleAtom, selectedLanguageAtom } from "../store/code";
import {
  THEMES,
  themeAtom,
  themeCSSAtom,
  themeFontAtom,
  themeLineNumbersAtom,
  unlockedThemesAtom,
} from "../store/themes";
import useHotkeys from "../../../../utils/useHotkeys";
import HighlightedCode from "./HighlightedCode";
import classNames from "classnames";
import { derivedFlashMessageAtom } from "../store/flash";
import {
  addedLinesAtom,
  focusedLinesAtom,
  highlightedLinesAtom,
  highlightedWordsAtom,
  removedLinesAtom,
  showLineNumbersAtom,
} from "../store";
import { LANGUAGES } from "../util/languages";
import { hasAnnotations, parseAnnotations } from "../util/parse-annotations";

const without = <T,>(values: T[], value: T) => {
  return values.filter((entry) => {
    return entry !== value;
  });
};

const toggle = <T,>(values: T[], value: T) => {
  if (values.includes(value)) {
    return without(values, value);
  }
  return [...values, value];
};

function indentText(text: string) {
  return text
    .split("\n")
    .map((str) => `  ${str}`)
    .join("\n");
}

function dedentText(text: string) {
  return text
    .split("\n")
    .map((str) => str.replace(/^\s\s/, ""))
    .join("\n");
}

function getCurrentlySelectedLine(textarea: HTMLTextAreaElement) {
  const original = textarea.value;

  const selectionStart = textarea.selectionStart;
  const beforeStart = original.slice(0, selectionStart);

  return original.slice(beforeStart.lastIndexOf("\n") != -1 ? beforeStart.lastIndexOf("\n") + 1 : 0).split("\n")[0];
}

function handleTab(textarea: HTMLTextAreaElement, shiftKey: boolean) {
  const original = textarea.value;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const beforeStart = original.slice(0, start);

  const currentLine = getCurrentlySelectedLine(textarea);

  if (start === end) {
    // No text selected
    if (shiftKey) {
      // dedent
      const newStart = beforeStart.lastIndexOf("\n") + 1;
      textarea.setSelectionRange(newStart, end);
      document.execCommand("insertText", false, dedentText(original.slice(newStart, end)));
    } else {
      // indent
      document.execCommand("insertText", false, "  ");
    }
  } else {
    // Text selected
    const newStart = beforeStart.lastIndexOf("\n") + 1 || 0;
    textarea.setSelectionRange(newStart, end);

    if (shiftKey) {
      // dedent
      const newText = dedentText(original.slice(newStart, end));
      document.execCommand("insertText", false, newText);

      if (currentLine.startsWith("  ")) {
        textarea.setSelectionRange(start - 2, start - 2 + newText.length);
      } else {
        textarea.setSelectionRange(start, start + newText.length);
      }
    } else {
      // indent
      const newText = indentText(original.slice(newStart, end));
      document.execCommand("insertText", false, newText);
      textarea.setSelectionRange(start + 2, start + 2 + newText.length);
    }
  }
}

function handleEnter(textarea: HTMLTextAreaElement) {
  const currentLine = getCurrentlySelectedLine(textarea);

  const currentIndentationMatch = currentLine.match(/^(\s+)/);
  let wantedIndentation = currentIndentationMatch ? currentIndentationMatch[0] : "";

  if (currentLine.match(/([{\[:>])$/)) {
    wantedIndentation += "  ";
  }

  document.execCommand("insertText", false, `\n${wantedIndentation}`);
}

function handleBracketClose(textarea: HTMLTextAreaElement) {
  const currentLine = getCurrentlySelectedLine(textarea);
  const { selectionStart, selectionEnd } = textarea;

  if (selectionStart === selectionEnd && currentLine.match(/^\s{2,}$/)) {
    textarea.setSelectionRange(selectionStart - 2, selectionEnd);
  }

  document.execCommand("insertText", false, "}");
}

const fontMap = {
  "jetbrains-mono": styles.jetBrainsMono,
  "geist-mono": styles.geistMono,
  "ibm-plex-mono": styles.ibmPlexMono,
  "fira-code": styles.firaCode,
  "soehne-mono": styles.soehneMono,
  "roboto-mono": styles.robotoMono,
  "commit-mono": styles.commitMono,
  "space-mono": styles.spaceMono,
  "source-code-pro": styles.sourceCodePro,
  "google-sans-code": styles.googleSansCode,
} as const;

function Editor() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [code, setCode] = useAtom(codeAtom);
  const [selectedLanguage, setSelectedLanguage] = useAtom(selectedLanguageAtom);
  const [themeCSS] = useAtom(themeCSSAtom);
  const [isCodeExample] = useAtom(isCodeExampleAtom);
  const [themeFont] = useAtom(themeFontAtom);
  const [theme, setTheme] = useAtom(themeAtom);
  const [unlockedThemes, setUnlockedThemes] = useAtom(unlockedThemesAtom);
  const setFlashMessage = useSetAtom(derivedFlashMessageAtom);
  const [highlightedLines, setHighlightedLines] = useAtom(highlightedLinesAtom);
  const [addedLines, setAddedLines] = useAtom(addedLinesAtom);
  const [removedLines, setRemovedLines] = useAtom(removedLinesAtom);
  const [focusedLines, setFocusedLines] = useAtom(focusedLinesAtom);
  const [highlightedWords, setHighlightedWords] = useAtom(highlightedWordsAtom);
  const [isHighlightingLines, setIsHighlightingLines] = useState(false);
  const [showLineNumbers] = useAtom(themeLineNumbersAtom);
  const numberOfLines = (code.match(/\n/g) || []).length;

  useHotkeys("f", (event) => {
    event.preventDefault();
    textareaRef.current?.focus();
  });

  useHotkeys("alt+shift+w", (event) => {
    event.preventDefault();
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const selection = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd).trim();
    if (!selection) {
      setHighlightedWords([]);
      return;
    }
    setHighlightedWords(toggle(highlightedWords, selection));
  });

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLTextAreaElement>>((event) => {
    const textarea = textareaRef.current!;
    switch (event.key) {
      case "Tab":
        event.preventDefault();
        handleTab(textarea, event.shiftKey);
        break;
      case "}":
        event?.preventDefault();
        handleBracketClose(textarea);
        break;
      case "Escape":
        event.preventDefault();
        textarea.blur();
        break;
      case "Enter":
        event.preventDefault();
        handleEnter(textarea);
        break;
    }
  }, []);

  const handleChange = useCallback<ChangeEventHandler<HTMLTextAreaElement>>(
    (event) => {
      if (event.target.value.includes("🐰") && theme.id !== THEMES.rabbit.id) {
        if (!unlockedThemes.includes(THEMES.rabbit.id)) {
          setUnlockedThemes([...unlockedThemes, THEMES.rabbit.id]);
        }
        setTheme(THEMES.rabbit);
        try {
          localStorage.setItem("codeTheme", THEMES.rabbit.id);
        } catch (error) {
          console.log("Could not set theme in localStorage", error);
        }
        setFlashMessage({
          message: "Evil Rabbit Theme Unlocked",
          variant: "unlock",
          timeout: 2000,
          icon: React.createElement(THEMES.rabbit.icon || "", { style: { color: "black" } }),
        });
      }
      setCode(event.target.value);
    },
    [setCode, setTheme, setFlashMessage, setUnlockedThemes, unlockedThemes, theme.id],
  );

  const handlePaste = useCallback<ClipboardEventHandler<HTMLTextAreaElement>>(
    (event) => {
      const pasted = event.clipboardData.getData("text");
      if (!hasAnnotations(pasted)) {
        return;
      }
      event.preventDefault();
      const textarea = event.currentTarget;
      const merged =
        textarea.value.slice(0, textarea.selectionStart) + pasted + textarea.value.slice(textarea.selectionEnd);
      const parsed = parseAnnotations(merged);
      setCode(parsed.code);
      setHighlightedLines(parsed.highlightedLines);
      setAddedLines(parsed.addedLines);
      setRemovedLines(parsed.removedLines);
      setFocusedLines(parsed.focusedLines);
      setHighlightedWords(parsed.highlightedWords);
    },
    [setCode, setHighlightedLines, setAddedLines, setRemovedLines, setFocusedLines, setHighlightedWords],
  );

  const handleFocus = useCallback<FocusEventHandler>(() => {
    if (isCodeExample && textareaRef.current) {
      // Safari needs a timeout otherwise the selection flickers
      const textarea = textareaRef.current;
      setTimeout(() => {
        textarea.select();
      }, 1);
    }
  }, [isCodeExample]);

  useEffect(() => {
    const cycleDiff = (line: number) => {
      if (addedLines.includes(line)) {
        setAddedLines(without(addedLines, line));
        setRemovedLines([...removedLines, line]);
        return;
      }
      if (removedLines.includes(line)) {
        setRemovedLines(without(removedLines, line));
        return;
      }
      setAddedLines([...addedLines, line]);
    };

    const listener = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const lineElement = target.closest("[data-line]") as HTMLElement | null;
      if (!lineElement) {
        return;
      }
      const line = Number(lineElement.dataset.line);

      if (!isHighlightingLines) {
        return;
      }

      if (event.shiftKey) {
        cycleDiff(line);
        return;
      }
      if (event.metaKey || event.ctrlKey) {
        setFocusedLines(toggle(focusedLines, line));
        return;
      }
      setHighlightedLines(toggle(highlightedLines, line));
    };

    document.addEventListener("click", listener);

    return () => {
      document.removeEventListener("click", listener);
    };
  }, [
    isHighlightingLines,
    highlightedLines,
    setHighlightedLines,
    addedLines,
    setAddedLines,
    removedLines,
    setRemovedLines,
    focusedLines,
    setFocusedLines,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        setIsHighlightingLines(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        setIsHighlightingLines(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div
      className={classNames(
        styles.editor,
        themeFont ? fontMap[themeFont] : styles.jetBrainsMono,
        isHighlightingLines && styles.isHighlightingLines,
        showLineNumbers &&
          selectedLanguage !== LANGUAGES.plaintext && [
            styles.showLineNumbers,
            numberOfLines > 8 && styles.showLineNumbersLarge,
          ],
      )}
      style={{ "--editor-padding": "16px", ...themeCSS } as React.CSSProperties}
      data-value={code}
    >
      <textarea
        rows={1}
        tabIndex={-1}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        autoCapitalize="off"
        ref={textareaRef}
        className={styles.textarea}
        value={code}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={handleFocus}
        data-enable-grammarly="false"
      />
      <HighlightedCode code={code} selectedLanguage={selectedLanguage} />
    </div>
  );
}

export default Editor;
