"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";
import type { Extension } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";

const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((mod) => mod.default),
  { ssr: false, loading: () => <div className="min-h-[240px] animate-pulse rounded-xl bg-white/5" /> }
);

const LANG_EXT: Record<string, Extension> = {
  javascript: javascript(),
  js: javascript(),
  typescript: javascript({ typescript: true }),
  ts: javascript({ typescript: true }),
  python: python(),
  py: python(),
  cpp: cpp(),
  c: cpp(),
  cxx: cpp(),
};

const LANG_OPTIONS = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
];

type PSCodeEditorProps = {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  onLanguageChange?: (lang: string) => void;
  readOnly?: boolean;
  minHeight?: string;
  placeholder?: string;
  className?: string;
};

export function PSCodeEditor({
  value,
  onChange,
  language = "javascript",
  onLanguageChange,
  readOnly = false,
  minHeight = "240px",
  placeholder = "// 코드를 입력하세요",
  className = "",
}: PSCodeEditorProps) {
  const ext = LANG_EXT[language] ?? javascript();

  const handleChange = useCallback(
    (v: string) => {
      onChange?.(v);
    },
    [onChange]
  );

  return (
    <div
      className={`overflow-hidden rounded-xl border border-white/10 bg-[#0b0e14] shadow-2xl shadow-black/50 ${className}`}
      data-readonly={readOnly ? "true" : undefined}
    >
      {onLanguageChange && (
        <div className="flex items-center justify-between border-b border-white/10 bg-[#0d1117]/90 px-4 py-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Code
          </span>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
          >
            {LANG_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div
        className="[&_.cm-editor]:rounded-b-xl [&_.cm-editor]:border-0 [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-sm [&_.cm-gutters]:border-r [&_.cm-gutters]:border-white/10 [&_.cm-gutters]:bg-[#0d1117] [&_.cm-activeLineGutter]:bg-white/5 [&_.cm-content]:bg-transparent"
        style={{ minHeight }}
      >
        <CodeMirror
          value={value}
          height={minHeight}
          theme="dark"
          readOnly={readOnly}
          editable={!readOnly}
          placeholder={placeholder}
          extensions={[ext]}
          onChange={readOnly ? undefined : handleChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: false,
            highlightSelectionMatches: true,
            searchKeymap: true,
          }}
        />
      </div>
    </div>
  );
}
