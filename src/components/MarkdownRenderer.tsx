import React from "react";

interface MarkdownRendererProps {
  content: string;
  selectable?: boolean;
  selectedTexts?: string[];
  onToggleSelectText?: (text: string) => void;
  revisions?: Array<{
    id: string;
    originalText: string;
    tunedText: string;
    projectId: string;
    category: string;
  }>;
  hoveredRevisionId?: string | null;
  onHoverRevision?: (id: string | null) => void;
  renderInlinedTuningForm?: (text: string) => React.ReactNode;
}

export default function MarkdownRenderer({ 
  content, 
  selectable = false, 
  selectedTexts = [], 
  onToggleSelectText,
  revisions = [],
  hoveredRevisionId = null,
  onHoverRevision,
  renderInlinedTuningForm
}: MarkdownRendererProps) {
  if (!content) {
    return <span className="text-gray-400 italic">暂无报告内容</span>;
  }

  // Find if a text line matches any revision's tuned text
  const findMatchingRevision = (trimmedLineText: string) => {
    if (!revisions || revisions.length === 0) return null;
    return revisions.find(rev => {
      const revTuned = rev.tunedText.trim();
      const lineTrimmed = trimmedLineText.trim();
      if (!revTuned || !lineTrimmed) return false;
      return lineTrimmed === revTuned || lineTrimmed.includes(revTuned) || revTuned.includes(lineTrimmed);
    });
  };

  // A light, safe, custom parser to render standard structural markdown perfectly with Tailwind typography styles
  const lines = content.split("\n");
  let inList = false;

  const wrapSelectable = (element: React.ReactNode, lineContent: string, index: number) => {
    const trimmed = lineContent.trim();
    if (!trimmed || trimmed === "") return element;

    const matchingRev = findMatchingRevision(trimmed);
    const isHovered = matchingRev && hoveredRevisionId === matchingRev.id;

    if (!selectable) {
      if (matchingRev) {
        return (
          <div
            key={index}
            data-paragraph-rev-id={matchingRev.id}
            onMouseEnter={() => onHoverRevision?.(matchingRev.id)}
            onMouseLeave={() => onHoverRevision?.(null)}
            className={`transition-all duration-200 rounded-lg py-2.5 px-3 px-3.5 relative my-2 ${
              isHovered 
                ? "bg-rose-50/60 border-2 border-rose-500 shadow-md ring-2 ring-rose-100" 
                : "bg-emerald-50/10 border border-emerald-100 border-l-4 border-l-emerald-500"
            }`}
          >
            {element}
          </div>
        );
      }
      return element;
    }

    const isSelected = selectedTexts.includes(trimmed);
    const isLastSelected = selectedTexts[selectedTexts.length - 1] === trimmed;

    return (
      <div
        key={index}
        data-paragraph-rev-id={matchingRev ? matchingRev.id : undefined}
        onMouseEnter={matchingRev ? () => onHoverRevision?.(matchingRev.id) : undefined}
        onMouseLeave={matchingRev ? () => onHoverRevision?.(null) : undefined}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelectText?.(trimmed);
        }}
        className={`cursor-pointer transition-all duration-200 rounded-xl py-3 px-3.5 relative my-2 group ${
          isHovered
            ? "bg-rose-50 border-2 border-rose-500 shadow-md ring-2 ring-rose-100"
            : isSelected 
              ? "bg-indigo-50/45 border-2 border-indigo-400 ring-2 ring-indigo-100 shadow-sm" 
              : matchingRev
                ? "bg-emerald-50/15 border border-emerald-150 border-l-4 border-l-emerald-500 hover:bg-emerald-50/35"
                : "border border-transparent hover:bg-slate-50 hover:border-slate-200"
        }`}
      >
        {isSelected && (
          <span className="absolute -top-2 right-4 px-1.5 py-0.5 bg-indigo-600 text-white text-[8px] font-bold rounded shadow-xs select-none">
            已选中
          </span>
        )}
        {matchingRev && !isHovered && (
          <span className="absolute -top-2 right-4 px-1.5 py-0.5 bg-emerald-600 text-white text-[8px] font-bold rounded shadow-xs select-none">
            已修订
          </span>
        )}
        {element}

        {/* Inline Tuing Form goes here directly underneath if this is the active selected paragraph! */}
        {isSelected && isLastSelected && renderInlinedTuningForm && (
          <div className="mt-4" onClick={(e) => e.stopPropagation()}>
            {renderInlinedTuningForm(trimmed)}
          </div>
        )}
      </div>
    );
  };

  const renderedElements = lines.map((line, index) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith("# ")) {
      inList = false;
      return wrapSelectable(
        <h1 key={index} className="text-2xl font-bold tracking-tight text-gray-900 mt-6 mb-3 border-b pb-2">
          {trimmed.slice(2)}
        </h1>,
        line,
        index
      );
    }
    if (trimmed.startsWith("## ")) {
      inList = false;
      return wrapSelectable(
        <h2 key={index} className="text-xl font-semibold tracking-tight text-gray-900 mt-5 mb-2.5 flex items-center gap-1.5">
          {trimmed.slice(3)}
        </h2>,
        line,
        index
      );
    }
    if (trimmed.startsWith("### ")) {
      inList = false;
      return wrapSelectable(
        <h3 key={index} className="text-lg font-medium text-gray-800 mt-4 mb-2">
          {trimmed.slice(4)}
        </h3>,
        line,
        index
      );
    }

    // Blockquotes
    if (trimmed.startsWith("> ")) {
      inList = false;
      return wrapSelectable(
        <blockquote key={index} className="border-l-4 border-slate-300 bg-slate-50 text-gray-600 px-4 py-2 my-3 rounded-r italic text-sm">
          {trimmed.slice(2)}
        </blockquote>,
        line,
        index
      );
    }

    // Bullet Lists
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      return wrapSelectable(
        <li key={index} className="ml-5 list-disc text-gray-700 text-sm mb-1 leading-relaxed">
          {trimmed.slice(2)}
        </li>,
        line,
        index
      );
    }

    // Numbered Lists
    if (/^\d+\.\s/.test(trimmed)) {
      inList = true;
      const contentStr = trimmed.replace(/^\d+\.\s/, "");
      return wrapSelectable(
        <li key={index} className="ml-5 list-decimal text-gray-700 text-sm mb-1 leading-relaxed">
          {contentStr}
        </li>,
        line,
        index
      );
    }

    // Code highlights
    if (trimmed.startsWith("`") && trimmed.endsWith("`")) {
      inList = false;
      return wrapSelectable(
        <code key={index} className="font-mono text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded mx-1 block my-2 w-max">
          {trimmed.replace(/`/g, "")}
        </code>,
        line,
        index
      );
    }

    // Plain paragraphs or empty lines
    if (trimmed === "") {
      inList = false;
      return <div key={index} className="h-2" />;
    }

    // Default text line
    inList = false;
    return wrapSelectable(
      <p key={index} className="text-gray-700 text-sm leading-relaxed mb-2">
        {trimmed}
      </p>,
      line,
      index
    );
  });

  return <div className="space-y-1">{renderedElements}</div>;
}
