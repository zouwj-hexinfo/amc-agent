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

type MarkdownBlock =
  | { type: "space"; raw: string }
  | { type: "heading"; level: 1 | 2 | 3 | 4; text: string; raw: string }
  | { type: "blockquote"; text: string; raw: string }
  | { type: "list"; ordered: boolean; items: string[]; raw: string }
  | { type: "code"; language: string; text: string; raw: string }
  | { type: "table"; headers: string[]; alignments: Array<"left" | "center" | "right">; rows: string[][]; raw: string }
  | { type: "image"; alt: string; url: string; raw: string }
  | { type: "hr"; raw: string }
  | { type: "paragraph"; text: string; raw: string };

function buildClientMinioAssetPath(uri: string, kind: "image" | "report") {
  const match = uri.trim().match(/^s3:\/\/([^/]+)\/(.+)$/);
  if (!match) return null;
  const key = match[2];
  const keyMatch = kind === "image"
    ? key.match(/^(?:(?:xfas\/)?images|amc-images)\/([^/]+)\/([^/]+)$/)
    : key.match(/^(?:(?:xfas\/)?reports|amc-reports)\/([^/]+)\/([^/]+\.md)$/);
  if (!keyMatch) return null;
  const [, rptId, assetId] = keyMatch;
  const base = kind === "image" ? "images" : "reports";
  return `/api/assets/minio/${base}/${encodeURIComponent(rptId)}/${encodeURIComponent(assetId)}`;
}

function resolveMarkdownUrl(uri: string) {
  const trimmed = uri.trim().replace(/^["']|["']$/g, "");
  const minioProxy = buildClientMinioAssetPath(trimmed, "image") || buildClientMinioAssetPath(trimmed, "report");
  if (minioProxy) return minioProxy;
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  return "#";
}

function shouldOpenInNewTab(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith("/api/assets/");
}

function renderInlineMarkdown(text: string, keyPrefix: string | number) {
  const nodes: React.ReactNode[] = [];
  const pattern = /(!?\[[^\]]*\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const token = match[0];
    const imageOrLink = token.match(/^(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)$/);
    if (imageOrLink) {
      const [, bang, label, rawUrl] = imageOrLink;
      const href = resolveMarkdownUrl(rawUrl);
      const openInNewTab = shouldOpenInNewTab(href);
      nodes.push(bang
        ? (
          <img
            key={`${keyPrefix}-img-${match.index}`}
            src={href}
            alt={label}
            className="my-3 max-h-[420px] w-auto max-w-full rounded-lg border border-slate-200 bg-white object-contain shadow-sm"
            loading="lazy"
          />
        )
        : (
          <a
            key={`${keyPrefix}-link-${match.index}`}
            href={href}
            target={openInNewTab ? "_blank" : undefined}
            rel={openInNewTab ? "noreferrer" : undefined}
            className="text-indigo-700 underline underline-offset-2 hover:text-indigo-900"
          >
            {label}
          </a>
        ));
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-strong-${match.index}`} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={`${keyPrefix}-code-${match.index}`} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
          {token.slice(1, -1)}
        </code>
      );
    }
    cursor = match.index + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes.length ? nodes : text;
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      blocks.push({ type: "space", raw: line });
      index += 1;
      continue;
    }

    const fenceMatch = trimmed.match(/^```([A-Za-z0-9_-]*)\s*$/);
    if (fenceMatch) {
      const rawLines = [line];
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        rawLines.push(lines[index]);
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        rawLines.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: "code", language: fenceMatch[1] || "", text: codeLines.join("\n"), raw: rawLines.join("\n") });
      continue;
    }

    if (isTableStart(lines, index)) {
      const tableLines = [lines[index], lines[index + 1]];
      index += 2;
      while (index < lines.length && isTableRow(lines[index])) {
        tableLines.push(lines[index]);
        index += 1;
      }
      blocks.push(parseTableBlock(tableLines));
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3 | 4,
        text: headingMatch[2].trim(),
        raw: line,
      });
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "hr", raw: line });
      index += 1;
      continue;
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)$/);
    if (imageMatch) {
      blocks.push({ type: "image", alt: imageMatch[1], url: imageMatch[2], raw: line });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("> ")) {
      const rawLines: string[] = [];
      const textLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("> ")) {
        rawLines.push(lines[index]);
        textLines.push(lines[index].trim().slice(2));
        index += 1;
      }
      blocks.push({ type: "blockquote", text: textLines.join("\n"), raw: rawLines.join("\n") });
      continue;
    }

    const listMatch = trimmed.match(/^((?:[-*])|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const ordered = /^\d+\./.test(listMatch[1]);
      const rawLines: string[] = [];
      const items: string[] = [];
      while (index < lines.length) {
        const itemMatch = lines[index].trim().match(ordered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/);
        if (!itemMatch) break;
        rawLines.push(lines[index]);
        items.push(itemMatch[1]);
        index += 1;
      }
      blocks.push({ type: "list", ordered, items, raw: rawLines.join("\n") });
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push({
      type: "paragraph",
      text: paragraphLines.map(item => item.trim()).join(" "),
      raw: paragraphLines.join("\n"),
    });
  }

  return compactSpaceBlocks(blocks);
}

function compactSpaceBlocks(blocks: MarkdownBlock[]) {
  const compacted: MarkdownBlock[] = [];
  blocks.forEach(block => {
    if (block.type === "space" && compacted[compacted.length - 1]?.type === "space") return;
    compacted.push(block);
  });
  return compacted;
}

function isBlockStart(lines: string[], index: number) {
  const trimmed = lines[index].trim();
  return Boolean(
    !trimmed
      || /^```/.test(trimmed)
      || isTableStart(lines, index)
      || /^(#{1,4})\s+/.test(trimmed)
      || /^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)
      || /^!\[[^\]]*\]\([^)]+\)$/.test(trimmed)
      || trimmed.startsWith("> ")
      || /^((?:[-*])|\d+\.)\s+/.test(trimmed)
  );
}

function isTableStart(lines: string[], index: number) {
  return Boolean(lines[index + 1] && isTableRow(lines[index]) && isTableSeparator(lines[index + 1]));
}

function isTableRow(line: string) {
  return line.includes("|") && line.trim().replace(/\|/g, "").trim().length > 0;
}

function isTableSeparator(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function parseTableBlock(lines: string[]): MarkdownBlock {
  const headers = splitTableCells(lines[0]);
  const alignments = splitTableCells(lines[1]).map(cell => {
    const trimmed = cell.trim();
    if (trimmed.startsWith(":") && trimmed.endsWith(":")) return "center" as const;
    if (trimmed.endsWith(":")) return "right" as const;
    return "left" as const;
  });
  return {
    type: "table",
    headers,
    alignments,
    rows: lines.slice(2).map(splitTableCells),
    raw: lines.join("\n"),
  };
}

function splitTableCells(line: string) {
  const trimmed = line.trim();
  const withoutOuterPipes = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  return withoutOuterPipes.split("|").map(cell => cell.trim());
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

  const findMatchingRevision = (trimmedLineText: string) => {
    if (!revisions || revisions.length === 0) return null;
    return revisions.find(rev => {
      const revTuned = rev.tunedText.trim();
      const lineTrimmed = trimmedLineText.trim();
      if (!revTuned || !lineTrimmed) return false;
      return lineTrimmed === revTuned || lineTrimmed.includes(revTuned) || revTuned.includes(lineTrimmed);
    });
  };

  const wrapSelectable = (element: React.ReactNode, rawContent: string, index: number) => {
    const trimmed = rawContent.trim();
    if (!trimmed) return element;

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
            className={`transition-all duration-200 rounded-lg py-2.5 px-3.5 relative my-2 ${
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

        {isSelected && isLastSelected && renderInlinedTuningForm && (
          <div className="mt-4" onClick={(e) => e.stopPropagation()}>
            {renderInlinedTuningForm(trimmed)}
          </div>
        )}
      </div>
    );
  };

  const renderBlock = (block: MarkdownBlock, index: number) => {
    switch (block.type) {
      case "space":
        return <div key={index} className="h-2" />;
      case "heading": {
        const className = block.level === 1
          ? "text-2xl font-bold tracking-tight text-gray-900 mt-6 mb-3 border-b pb-2"
          : block.level === 2
            ? "text-xl font-semibold tracking-tight text-gray-900 mt-5 mb-2.5 flex items-center gap-1.5"
            : block.level === 3
              ? "text-lg font-medium text-gray-800 mt-4 mb-2"
              : "text-base font-semibold text-gray-800 mt-3 mb-1.5";
        const children = renderInlineMarkdown(block.text, `heading-${index}`);
        const heading = block.level === 1
          ? <h1 key={index} className={className}>{children}</h1>
          : block.level === 2
            ? <h2 key={index} className={className}>{children}</h2>
            : block.level === 3
              ? <h3 key={index} className={className}>{children}</h3>
              : <h4 key={index} className={className}>{children}</h4>;
        return wrapSelectable(
          heading,
          block.raw,
          index
        );
      }
      case "blockquote":
        return wrapSelectable(
          <blockquote key={index} className="border-l-4 border-slate-300 bg-slate-50 text-gray-600 px-4 py-2 my-3 rounded-r italic text-sm whitespace-pre-line">
            {renderInlineMarkdown(block.text, `quote-${index}`)}
          </blockquote>,
          block.raw,
          index
        );
      case "list": {
        const ListTag = block.ordered ? "ol" : "ul";
        return wrapSelectable(
          <ListTag key={index} className={`${block.ordered ? "list-decimal" : "list-disc"} ml-6 text-gray-700 text-sm leading-relaxed space-y-1`}>
            {block.items.map((item, itemIndex) => (
              <li key={`${index}-${itemIndex}`}>
                {renderInlineMarkdown(item, `list-${index}-${itemIndex}`)}
              </li>
            ))}
          </ListTag>,
          block.raw,
          index
        );
      }
      case "code":
        return wrapSelectable(
          <pre key={index} className="my-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
            {block.language && <div className="mb-2 text-[10px] uppercase tracking-wider text-slate-400">{block.language}</div>}
            <code>{block.text}</code>
          </pre>,
          block.raw,
          index
        );
      case "table":
        return wrapSelectable(
          <div key={index} className="my-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {block.headers.map((header, headerIndex) => (
                    <th
                      key={`${index}-head-${headerIndex}`}
                      className={`px-3 py-2 font-semibold text-slate-700 ${alignmentClass(block.alignments[headerIndex])}`}
                    >
                      {renderInlineMarkdown(header, `table-head-${index}-${headerIndex}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {block.rows.map((row, rowIndex) => (
                  <tr key={`${index}-row-${rowIndex}`}>
                    {block.headers.map((_, cellIndex) => (
                      <td
                        key={`${index}-cell-${rowIndex}-${cellIndex}`}
                        className={`px-3 py-2 text-slate-700 ${alignmentClass(block.alignments[cellIndex])}`}
                      >
                        {renderInlineMarkdown(row[cellIndex] || "", `table-cell-${index}-${rowIndex}-${cellIndex}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
          block.raw,
          index
        );
      case "image":
        return wrapSelectable(
          <figure key={index} className="my-4">
            <img
              src={resolveMarkdownUrl(block.url)}
              alt={block.alt}
              className="max-h-[420px] w-auto max-w-full rounded-lg border border-slate-200 bg-white object-contain shadow-sm"
              loading="lazy"
            />
            {block.alt && (
              <figcaption className="mt-2 text-xs text-slate-500">{block.alt}</figcaption>
            )}
          </figure>,
          block.raw,
          index
        );
      case "hr":
        return <hr key={index} className="my-5 border-slate-200" />;
      case "paragraph":
      default:
        return wrapSelectable(
          <p key={index} className="text-gray-700 text-sm leading-relaxed mb-2">
            {renderInlineMarkdown(block.text, `paragraph-${index}`)}
          </p>,
          block.raw,
          index
        );
    }
  };

  const renderedElements = parseMarkdownBlocks(content).map(renderBlock);

  return <div className="space-y-1">{renderedElements}</div>;
}

function alignmentClass(alignment?: "left" | "center" | "right") {
  if (alignment === "center") return "text-center";
  if (alignment === "right") return "text-right";
  return "text-left";
}
