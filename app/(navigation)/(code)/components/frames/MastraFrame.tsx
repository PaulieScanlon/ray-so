import classNames from "classnames";
import { useAtom, useAtomValue } from "jotai";

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
            <svg className={styles.cornerCircleBR} aria-hidden viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="24" strokeWidth="1" strokeDasharray="6 6" />
            </svg>
          </>
        )}
        <div className={styles.window}>
          <Editor />
        </div>
      </div>
    </div>
  );
};

export default MastraFrame;
