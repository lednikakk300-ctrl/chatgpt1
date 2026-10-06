import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parse markdown content into structured blocks
  const renderBlocks = () => {
    if (!content) return null;

    // Split by code blocks first
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let blockIndex = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textChunk = content.substring(lastIndex, match.index);
        elements.push(
          <div key={`text-${lastIndex}`} className="space-y-3">
            {renderTextChunk(textChunk)}
          </div>
        );
      }

      const lang = match[1] || 'kod';
      const code = match[2];
      const currentIdx = blockIndex++;

      elements.push(
        <div
          key={`code-${match.index}`}
          className="my-4 rounded-xl overflow-hidden border border-neutral-700/60 bg-[#0d0d0d] text-neutral-200 text-sm font-mono shadow-md"
        >
          <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/90 border-b border-neutral-800 text-xs text-neutral-400">
            <span className="font-medium tracking-wide uppercase">{lang}</span>
            <button
              onClick={() => handleCopyCode(code, currentIdx)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-neutral-800 text-neutral-300 transition-colors cursor-pointer text-xs"
              title="Kodni nusxalash"
            >
              {copiedIndex === currentIdx ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Nusxalandi!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Nusxa olish</span>
                </>
              )}
            </button>
          </div>
          <div className="p-4 overflow-x-auto text-[13px] leading-relaxed select-text font-mono">
            <pre>
              <code>{code}</code>
            </pre>
          </div>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Remaining text after last code block
    if (lastIndex < content.length) {
      const remainingChunk = content.substring(lastIndex);
      elements.push(
        <div key={`text-last`} className="space-y-3">
          {renderTextChunk(remainingChunk)}
        </div>
      );
    }

    return elements;
  };

  const renderTextChunk = (chunk: string) => {
    const lines = chunk.split('\n');
    const nodes: React.ReactNode[] = [];
    let listItems: string[] = [];
    let isOrderedList = false;
    let inTable = false;
    let tableRows: string[][] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        if (isOrderedList) {
          nodes.push(
            <ol key={`ol-${nodes.length}`} className="list-decimal pl-6 my-2 space-y-1.5 text-inherit">
              {listItems.map((item, i) => (
                <li key={i} className="leading-relaxed">
                  {renderInlineFormatting(item)}
                </li>
              ))}
            </ol>
          );
        } else {
          nodes.push(
            <ul key={`ul-${nodes.length}`} className="list-disc pl-6 my-2 space-y-1.5 text-inherit">
              {listItems.map((item, i) => (
                <li key={i} className="leading-relaxed">
                  {renderInlineFormatting(item)}
                </li>
              ))}
            </ul>
          );
        }
        listItems = [];
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        const header = tableRows[0];
        const bodyRows = tableRows.slice(1);
        nodes.push(
          <div key={`table-${nodes.length}`} className="overflow-x-auto my-3 rounded-lg border border-neutral-700/40">
            <table className="min-w-full divide-y divide-neutral-700/60 text-sm">
              <thead className="bg-neutral-800/40">
                <tr>
                  {header.map((col, idx) => (
                    <th key={idx} className="px-3.5 py-2.5 text-left font-semibold text-neutral-300">
                      {renderInlineFormatting(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/40">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-neutral-800/20">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 text-neutral-300">
                        {renderInlineFormatting(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Table line
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList();
        // Skip separator line like |---|---|
        if (/^\|[-:| ]+\|$/.test(trimmed)) {
          continue;
        }
        const cols = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        tableRows.push(cols);
        inTable = true;
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Check unordered list: - or *
      if (/^[-*]\s+/.test(trimmed)) {
        if (isOrderedList) flushList();
        isOrderedList = false;
        listItems.push(trimmed.replace(/^[-*]\s+/, ''));
        continue;
      }

      // Check ordered list: 1. 2.
      if (/^\d+\.\s+/.test(trimmed)) {
        if (!isOrderedList && listItems.length > 0) flushList();
        isOrderedList = true;
        listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
        continue;
      }

      // Not in list anymore
      flushList();

      if (!trimmed) {
        continue;
      }

      // Headers
      if (trimmed.startsWith('### ')) {
        nodes.push(
          <h3 key={`h3-${i}`} className="text-lg font-semibold text-neutral-100 mt-4 mb-2 tracking-tight">
            {renderInlineFormatting(trimmed.slice(4))}
          </h3>
        );
      } else if (trimmed.startsWith('## ')) {
        nodes.push(
          <h2 key={`h2-${i}`} className="text-xl font-bold text-neutral-100 mt-5 mb-2.5 tracking-tight">
            {renderInlineFormatting(trimmed.slice(3))}
          </h2>
        );
      } else if (trimmed.startsWith('# ')) {
        nodes.push(
          <h1 key={`h1-${i}`} className="text-2xl font-bold text-neutral-100 mt-6 mb-3 tracking-tight">
            {renderInlineFormatting(trimmed.slice(2))}
          </h1>
        );
      } else if (trimmed.startsWith('> ')) {
        nodes.push(
          <blockquote key={`quote-${i}`} className="border-l-4 border-emerald-500 pl-4 py-1 my-2 text-neutral-300 italic bg-emerald-500/5 rounded-r">
            {renderInlineFormatting(trimmed.slice(2))}
          </blockquote>
        );
      } else {
        nodes.push(
          <p key={`p-${i}`} className="leading-relaxed text-inherit">
            {renderInlineFormatting(line)}
          </p>
        );
      }
    }

    flushList();
    flushTable();

    return nodes;
  };

  // Render bold, italics, inline code, links
  const renderInlineFormatting = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let current = text;
    let keyIdx = 0;

    // Pattern for inline markdown tokens: `code`, **bold**, *italic*, [text](url)
    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/;

    while (current.length > 0) {
      const match = tokenRegex.exec(current);
      if (!match) {
        parts.push(current);
        break;
      }

      if (match.index > 0) {
        parts.push(current.substring(0, match.index));
      }

      const token = match[0];

      if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code
            key={`inline-code-${keyIdx++}`}
            className="px-1.5 py-0.5 rounded-md bg-neutral-800 text-emerald-400 font-mono text-[13px] border border-neutral-700/60"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={`bold-${keyIdx++}`} className="font-semibold text-neutral-100">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(
          <em key={`italic-${keyIdx++}`} className="italic">
            {token.slice(1, -1)}
          </em>
        );
      } else if (token.startsWith('[') && token.includes('](')) {
        const linkMatch = token.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          parts.push(
            <a
              key={`link-${keyIdx++}`}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            >
              {linkMatch[1]}
            </a>
          );
        } else {
          parts.push(token);
        }
      }

      current = current.substring(match.index + token.length);
    }

    return parts;
  };

  return <div className="chat-markdown space-y-2">{renderBlocks()}</div>;
};
