import classNames from "classnames";
import { useAtom, useAtomValue } from "jotai";
import React from "react";

import { showBackgroundAtom } from "../../store";
import { paddingAtom } from "../../store/padding";
import { themeDarkModeAtom } from "../../store/themes";

import Editor from "../Editor";
import sharedStyles from "./DefaultFrame.module.css";
import styles from "./MastraFrame.module.css";

const MastraFrame = () => {
  const darkMode = useAtomValue(themeDarkModeAtom);
  const [padding] = useAtom(paddingAtom);
  const [showBackground] = useAtom(showBackgroundAtom);

  return (
    <div
      className={classNames(
        sharedStyles.frame,
        showBackground && styles.frame,
        !darkMode && styles.frameLightMode,
        !showBackground && sharedStyles.noBackground,
        padding === 16 && styles.minimal,
      )}
      style={{ padding, "--padding": typeof padding === "number" ? `${padding}px` : padding } as React.CSSProperties}
    >
      {!showBackground && <div data-ignore-in-export className={sharedStyles.transparentPattern}></div>}
      {showBackground && (
        <>
          <div className={styles.cornerTL} aria-hidden />
          <div className={styles.topMiddle} aria-hidden>
            <div className={styles.topLeft} />
            <div className={styles.topRight} />
          </div>
          <div className={styles.cornerTR} aria-hidden />
          <div className={styles.leftMiddle} aria-hidden>
            <div className={styles.leftTop} />
            <div className={styles.leftBottom} />
          </div>
          <div className={styles.rightMiddle} aria-hidden>
            <div className={styles.rightTop} />
            <div className={styles.rightBottom} />
          </div>
          <div className={styles.cornerBL} aria-hidden />
          <div className={styles.bottomMiddle} aria-hidden>
            <div className={styles.bottomLeft} />
            <div className={styles.bottomRight} />
          </div>
          <div className={styles.cornerBR} aria-hidden />
          <div className={styles.cornerFilletTL} aria-hidden />
          <div className={styles.cornerFilletTR} aria-hidden />
          <div className={styles.cornerFilletBL} aria-hidden />
          <div className={styles.cornerFilletBR} aria-hidden />
        </>
      )}
      <div className={styles.window}>
        <Editor />
      </div>
    </div>
  );
};

export default MastraFrame;
