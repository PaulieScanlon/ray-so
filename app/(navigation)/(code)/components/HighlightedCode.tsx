import classNames from "classnames";
import React, { useEffect, useState } from "react";
import { Language, LANGUAGES } from "../util/languages";

import styles from "./Editor.module.css";
import {
  addedLinesAtom,
  focusedLinesAtom,
  highlightedLinesAtom,
  highlightedWordsAtom,
  highlighterAtom,
  loadingLanguageAtom,
  removedLinesAtom,
} from "../store";
import { useAtomValue, useSetAtom } from "jotai";
import { themeDarkModeAtom, themeAtom } from "../store/themes";
import { highlightWords } from "../util/highlight-words";

type PropTypes = {
  selectedLanguage: Language | null;
  code: string;
};

const HighlightedCode: React.FC<PropTypes> = ({ selectedLanguage, code }) => {
  const [highlightedHtml, setHighlightedHtml] = useState("");
  const highlighter = useAtomValue(highlighterAtom);
  const setIsLoadingLanguage = useSetAtom(loadingLanguageAtom);
  const highlightedLines = useAtomValue(highlightedLinesAtom);
  const addedLines = useAtomValue(addedLinesAtom);
  const removedLines = useAtomValue(removedLinesAtom);
  const focusedLines = useAtomValue(focusedLinesAtom);
  const highlightedWords = useAtomValue(highlightedWordsAtom);
  const darkMode = useAtomValue(themeDarkModeAtom);
  const theme = useAtomValue(themeAtom);
  const themeName = theme.id === "tailwind" ? (darkMode ? "tailwind-dark" : "tailwind-light") : "css-variables";

  useEffect(() => {
    const generateHighlightedHtml = async () => {
      if (!highlighter || !selectedLanguage || selectedLanguage === LANGUAGES.plaintext) {
        return code.replace(/[\u00A0-\u9999<>\&]/g, (i) => `&#${i.charCodeAt(0)};`);
      }

      const loadedLanguages = highlighter.getLoadedLanguages() || [];
      const hasLoadedLanguage = loadedLanguages.includes(selectedLanguage.name.toLowerCase());

      if (!hasLoadedLanguage && selectedLanguage.src) {
        setIsLoadingLanguage(true);
        await highlighter.loadLanguage(selectedLanguage.src);
        setIsLoadingLanguage(false);
      }

      let lang = selectedLanguage.name.toLowerCase();
      if (lang === "typescript") {
        lang = "tsx";
      }

      return highlighter.codeToHtml(code, {
        lang: lang,
        theme: themeName,
        transformers: [
          {
            line(node, line) {
              node.properties["data-line"] = line;
              if (highlightedLines.includes(line)) this.addClassToHast(node, "highlighted-line");
              if (addedLines.includes(line)) this.addClassToHast(node, "diff-added-line");
              if (removedLines.includes(line)) this.addClassToHast(node, "diff-removed-line");
              if (focusedLines.length > 0) {
                this.addClassToHast(node, focusedLines.includes(line) ? "focused-line" : "unfocused-line");
              }
              highlightWords(node, highlightedWords);
            },
          },
        ],
      });
    };

    generateHighlightedHtml().then((newHtml) => {
      setHighlightedHtml(newHtml);
    });
  }, [
    code,
    selectedLanguage,
    highlighter,
    setIsLoadingLanguage,
    setHighlightedHtml,
    highlightedLines,
    addedLines,
    removedLines,
    focusedLines,
    highlightedWords,
    themeName,
  ]);

  return (
    <div
      className={classNames(styles.formatted, selectedLanguage === LANGUAGES.plaintext && styles.plainText)}
      dangerouslySetInnerHTML={{
        __html: highlightedHtml,
      }}
    />
  );
};

export default HighlightedCode;
