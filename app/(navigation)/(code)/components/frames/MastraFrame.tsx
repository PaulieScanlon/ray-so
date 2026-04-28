import classNames from "classnames";
import { useAtom, useAtomValue } from "jotai";

import { fileNameAtom, showBackgroundAtom } from "../../store";
import { flashShownAtom } from "../../store/flash";
import { paddingAtom } from "../../store/padding";
import { themeDarkModeAtom } from "../../store/themes";
import FileIcon from "../../assets/mastra-file.svg";

import Editor from "../Editor";
import sharedStyles from "./DefaultFrame.module.css";
import styles from "./MastraFrame.module.css";

const MastraFrame = () => {
  const darkMode = useAtomValue(themeDarkModeAtom);
  const [padding] = useAtom(paddingAtom);
  const [showBackground] = useAtom(showBackgroundAtom);
  const [fileName, setFileName] = useAtom(fileNameAtom);
  const flashShown = useAtomValue(flashShownAtom);

  const showTab = fileName.length > 0 || !flashShown;

  return (
    <div
      className={classNames(
        sharedStyles.frame,
        showBackground && styles.frame,
        !darkMode && styles.frameLightMode,
        !showBackground && sharedStyles.noBackground,
      )}
      style={{ padding }}
    >
      {!showBackground && <div data-ignore-in-export className={sharedStyles.transparentPattern}></div>}
      <div className={styles.composition}>
        {showBackground && (
          <>
            <span className={styles.gridlineHTop} aria-hidden />
            <span className={styles.gridlineHBottom} aria-hidden />
            <span className={styles.gridlineVLeft} aria-hidden />
            <span className={styles.gridlineVRight} aria-hidden />
            <svg className={styles.cornerCircleTL} aria-hidden viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="24" strokeWidth="1" strokeDasharray="6 6" />
            </svg>
            <svg className={styles.cornerCircleTR} aria-hidden viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="24" strokeWidth="1" strokeDasharray="6 6" />
            </svg>
            <svg className={styles.cornerCircleBL} aria-hidden viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="24" strokeWidth="1" strokeDasharray="6 6" />
            </svg>
            <svg className={styles.cornerCircleBR} aria-hidden viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="24" strokeWidth="1" strokeDasharray="6 6" />
            </svg>
          </>
        )}
        {showTab && (
          <div className={styles.tile} data-ignore-in-export={fileName.length === 0 ? "" : undefined}>
            <FileIcon className={styles.fileIcon} aria-hidden />
            <div className={classNames(sharedStyles.fileName, styles.fileName)} data-value={fileName}>
              <input
                type="text"
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
                spellCheck={false}
                tabIndex={-1}
                size={1}
              />
              {fileName.length === 0 ? <span>Untitled-1</span> : null}
            </div>
          </div>
        )}
        <div className={styles.window}>
          <Editor />
        </div>
      </div>
    </div>
  );
};

export default MastraFrame;
