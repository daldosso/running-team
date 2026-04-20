import type { ReactNode } from "react";

type Props = {
  text: string;
  className?: string;
};

const INLINE_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const INLINE_BOLD_RE = /\*\*([^*]+)\*\*/g;
const INLINE_ITALIC_RE = /_([^_]+)_/g;
const INLINE_CODE_RE = /`([^`]+)`/g;

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  const pattern = new RegExp(
    `${INLINE_LINK_RE.source}|${INLINE_BOLD_RE.source}|${INLINE_ITALIC_RE.source}|${INLINE_CODE_RE.source}`,
    "g"
  );
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    if (match[1] && match[2]) {
      nodes.push(
        <a
          key={`${match.index}-link`}
          href={match[2]}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          {match[1]}
        </a>
      );
    } else if (match[3]) {
      nodes.push(
        <strong key={`${match.index}-strong`} className="font-semibold text-zinc-100">
          {match[3]}
        </strong>
      );
    } else if (match[4]) {
      nodes.push(
        <em key={`${match.index}-em`} className="italic">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      nodes.push(
        <code
          key={`${match.index}-code`}
          className="rounded bg-zinc-800 px-1 py-0.5 text-[0.92em] text-zinc-100"
        >
          {match[5]}
        </code>
      );
    }

    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

export function FormattedEventText({ text, className = "" }: Props) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line, index, array) => line.length > 0 || array[index - 1]?.length > 0);

  const blocks: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="ml-5 list-disc space-y-1">
        {listItems.map((item, index) => (
          <li key={`${index}-${item}`}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line) => {
    const bulletMatch = line.match(/^- (.+)$/);
    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
      return;
    }

    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className="leading-6">
        {renderInline(line)}
      </p>
    );
  });

  flushList();

  return <div className={`space-y-3 ${className}`.trim()}>{blocks}</div>;
}
