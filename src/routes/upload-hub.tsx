import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell, Panel } from "@/components/AppShell";
import { MOCK_FEED, type FeedItem } from "@/lib/data";
import { Upload, FileText, X } from "lucide-react";

export const Route = createFileRoute("/upload-hub")({
  head: () => ({
    meta: [
      { title: "Upload Hub & Ingestion Feed — IndustryIntel" },
      { name: "description", content: "Drag-and-drop monthly scrape uploads and a live mock industry feed." },
    ],
  }),
  component: UploadHubPage,
});

const VERTICALS: FeedItem["vertical"][] = ["Horizontal", "Quick Commerce", "Fashion", "Meesho"];

const verticalAccent: Record<FeedItem["vertical"], string> = {
  "Horizontal":     "text-[color:var(--color-primary)] ring-[color:var(--color-primary)]/40 bg-[color:var(--color-primary)]/8",
  "Quick Commerce": "text-[color:var(--color-teal)] ring-[color:var(--color-teal)]/40 bg-[color:var(--color-teal)]/8",
  "Fashion":        "text-[color:var(--color-gold)] ring-[color:var(--color-gold)]/40 bg-[color:var(--color-gold)]/8",
  "Meesho":         "text-[color:var(--color-risk)] ring-[color:var(--color-risk)]/40 bg-[color:var(--color-risk)]/8",
};

function UploadHubPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FeedItem["vertical"] | "All">("All");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  };

  const filteredFeed = activeFilter === "All" ? MOCK_FEED : MOCK_FEED.filter(f => f.vertical === activeFilter);

  return (
    <AppShell>
      <div className="mb-4">
        <div className="label-caps">Ingestion</div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Upload Hub &amp; Ingestion Feed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Drop monthly scrape exports, marketplace pulls, or news rollups. When empty, a curated mock feed surfaces the moves
          analysts should not miss this fortnight.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
        <Panel title="Upload Monthly Scraped Data & News Feeds" accent="primary">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className={`group cursor-pointer rounded-md border-2 border-dashed px-4 py-10 text-center transition ${
              dragOver
                ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/8"
                : "border-border hover:border-[color:var(--color-primary)]/60 hover:bg-[color:var(--color-surface-2)]"
            }`}
          >
            <Upload className="mx-auto h-7 w-7 text-[color:var(--color-primary)]" />
            <div className="mt-2 text-sm font-semibold">Drag &amp; drop CSV, XLSX, JSON or PDF here</div>
            <div className="mt-0.5 text-xs text-muted-foreground">or click to browse · multiple files supported</div>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          <div className="mt-3">
            <div className="label-caps">Queued Files ({files.length})</div>
            {files.length === 0 ? (
              <div className="mt-1 text-xs text-muted-foreground">No files uploaded yet — fallback mock feed is active on the right.</div>
            ) : (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="panel-2 flex items-center gap-2 px-3 py-1.5 text-xs">
                    <FileText className="h-3.5 w-3.5 text-[color:var(--color-primary)]" />
                    <span className="flex-1 truncate font-medium">{f.name}</span>
                    <span className="num text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, idx) => idx !== i)); }}
                      className="text-muted-foreground hover:text-[color:var(--color-risk)]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>

        <Panel
          title="Live Industry Update Feed (Fallback Mock)"
          accent="teal"
          action={
            <div className="flex flex-wrap gap-1">
              {(["All", ...VERTICALS] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setActiveFilter(v)}
                  className={`rounded-sm px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ring-1 transition ${
                    activeFilter === v
                      ? "bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)] ring-[color:var(--color-primary)]/60"
                      : "text-muted-foreground ring-border hover:bg-[color:var(--color-surface-2)]"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          }
        >
          <ul className="divide-y divide-border">
            {filteredFeed.map((f, i) => (
              <li key={i} className="row-hover grid grid-cols-[70px_120px_1fr_110px] items-center gap-3 py-2 text-xs">
                <span className="num text-muted-foreground">{f.date}</span>
                <span className={`inline-flex justify-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ring-1 ${verticalAccent[f.vertical]}`}>
                  {f.vertical}
                </span>
                <span className="font-medium leading-snug">{f.headline}</span>
                <span className="num text-right text-[11px] text-muted-foreground">{f.source}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
