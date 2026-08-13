"use client";

import * as Popover from "@radix-ui/react-popover";
import { HighlightIcon } from "@raycast/icons";
import { useAtomValue } from "jotai";
import { Button } from "@/components/button";
import { Kbd } from "@/components/kbd";
import { themeCSSAtom } from "../store/themes";

const NOTATIONS = [
  { notation: "[!code highlight]", label: "Highlight" },
  { notation: "[!code ++]", label: "Added" },
  { notation: "[!code --]", label: "Removed" },
  { notation: "[!code focus]", label: "Focus" },
  { notation: "[!code word:name]", label: "Word" },
];

const STYLES = [
  {
    label: "Highlight a line",
    keys: ["⌥", "click"],
    swatch: "var(--ray-highlight)",
    border: "var(--ray-highlight-border)",
  },
  {
    label: "Mark added, then removed",
    keys: ["⌥", "⇧", "click"],
    swatch: "color-mix(in srgb, var(--ray-token-diff-inserted, #3ecf8e) 14%, transparent)",
    border: "var(--ray-token-diff-inserted, #3ecf8e)",
  },
  {
    label: "Focus a line, dim the rest",
    keys: ["⌥", "⌘", "click"],
    swatch: "transparent",
    border: "transparent",
    dimmed: true,
  },
  {
    label: "Highlight the selected word",
    keys: ["⌥", "⇧", "W"],
    swatch: "var(--ray-highlight)",
    border: "var(--ray-highlight-border)",
  },
];

export function HighlightsPopover() {
  const themeCSS = useAtomValue(themeCSSAtom);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="transparent" className="hidden md:flex gap-2">
          <HighlightIcon width={16} height={16} />
          Highlights
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align="end"
          className="will-change-[opacity,transform] z-50 w-[420px] rounded-md bg-panel border border-gray-4 p-4 shadow-md
            data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0
            data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
            data-[side=bottom]:animate-slideDownAndFade"
        >
          <p className="text-gray-11 text-[13px] leading-relaxed mb-3">
            Hold <Kbd>⌥</Kbd> to turn the editor into annotation mode, then click the lines you want to mark.
          </p>

          <div className="flex flex-col gap-2" style={themeCSS}>
            {STYLES.map((style) => (
              <div key={style.label} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-5 w-8 shrink-0 rounded-[3px] border-l-2"
                  style={{
                    backgroundColor: style.swatch,
                    borderLeftColor: style.border,
                    filter: style.dimmed ? "blur(0.6px)" : undefined,
                    opacity: style.dimmed ? 0.35 : 1,
                    boxShadow: style.dimmed ? "inset 0 0 0 1px var(--ray-foreground)" : undefined,
                  }}
                />
                <span className="text-gray-11 text-[13px] flex-1">{style.label}</span>
                <span className="flex items-end gap-1">
                  {style.keys.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-4">
            <p className="text-gray-11 text-[13px] leading-relaxed mb-2">
              Paste code containing comments and they&rsquo;re stripped and applied automatically.
            </p>
            <div className="flex flex-col gap-1">
              {NOTATIONS.map((entry) => (
                <div key={entry.notation} className="flex items-center gap-2">
                  <code className="text-gray-12 text-[11px] bg-gray-a3 rounded-[3px] px-1 py-0.5">
                    {`// ${entry.notation}`}
                  </code>
                  <span className="text-gray-11 text-[13px]">{entry.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
