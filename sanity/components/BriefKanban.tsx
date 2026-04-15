import { useCallback, useEffect, useMemo, useState } from "react";
import { useClient } from "sanity";
import { IntentLink } from "sanity/router";

type BriefStatus =
  | "new"
  | "reviewing"
  | "contacted"
  | "won"
  | "lost"
  | "archived";

type BriefCard = {
  _id: string;
  _rev: string;
  title?: string;
  status?: BriefStatus;
  company?: string;
  contactName?: string;
  requestType?: string;
  requestSubtype?: string;
  companySize?: string;
  estimatedRange?: string;
  submittedAt?: string;
};

const COLUMNS: { id: BriefStatus; label: string; tone: string }[] = [
  { id: "new", label: "New", tone: "#1a1a1a" },
  { id: "reviewing", label: "Reviewing", tone: "#2d5bb9" },
  { id: "contacted", label: "Contacted", tone: "#8a5cf6" },
  { id: "won", label: "Won", tone: "#0f8a4c" },
  { id: "lost", label: "Lost", tone: "#b63333" },
  { id: "archived", label: "Archived", tone: "#777" },
];

const QUERY = `*[_type == "briefRequest"] | order(submittedAt desc) {
  _id,
  _rev,
  title,
  status,
  company,
  contactName,
  requestType,
  requestSubtype,
  companySize,
  estimatedRange,
  submittedAt
}`;

const REQUEST_TYPE_LABELS: Record<string, string> = {
  webdesign: "Web design",
  branding: "Branding",
  embalagem: "Embalagem",
  apresentacoes: "Apresentações",
  ilustracoes: "Ilustrações",
  mockups3d: "3D",
  impressao: "Print",
  estampas: "Estampas",
  ebooks: "E-book",
  email: "Email",
  ads: "Ads",
  outro: "Outro",
};

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "";
  }
}

export default function BriefKanban() {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [cards, setCards] = useState<BriefCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<BriefStatus | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.fetch<BriefCard[]>(QUERY);
      setCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
    const sub = client
      .listen(QUERY, {}, { includeResult: false, visibility: "query" })
      .subscribe({
        next: () => void load(),
        error: () => {},
      });
    return () => sub.unsubscribe();
  }, [client, load]);

  const grouped = useMemo(() => {
    const map = new Map<BriefStatus, BriefCard[]>();
    for (const col of COLUMNS) map.set(col.id, []);
    for (const card of cards) {
      const key = (card.status as BriefStatus) ?? "new";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(card);
    }
    return map;
  }, [cards]);

  const moveCard = async (id: string, target: BriefStatus) => {
    const card = cards.find((c) => c._id === id);
    if (!card || card.status === target) return;
    // Optimistic update — flip the column immediately so the user
    // doesn't wait for the round-trip.
    setCards((prev) =>
      prev.map((c) => (c._id === id ? { ...c, status: target } : c)),
    );
    try {
      await client.patch(id).set({ status: target }).commit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao mover");
      // Revert on failure.
      await load();
    }
  };

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>CRM</p>
          <h2 style={styles.title}>Brief Requests</h2>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.count}>{cards.length} total</span>
          <button
            type="button"
            onClick={() => void load()}
            style={styles.reloadButton}
            disabled={loading}
          >
            {loading ? "Carregando…" : "Recarregar"}
          </button>
        </div>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.board}>
        {COLUMNS.map((col) => {
          const columnCards = grouped.get(col.id) ?? [];
          const isOver = overColumn === col.id;
          return (
            <div
              key={col.id}
              style={{
                ...styles.column,
                ...(isOver ? styles.columnOver : undefined),
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOverColumn(col.id);
              }}
              onDragLeave={() => {
                if (overColumn === col.id) setOverColumn(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setOverColumn(null);
                const id = draggingId ?? e.dataTransfer.getData("text/plain");
                if (id) void moveCard(id, col.id);
                setDraggingId(null);
              }}
            >
              <div style={styles.columnHeader}>
                <span
                  style={{
                    ...styles.columnDot,
                    backgroundColor: col.tone,
                  }}
                />
                <span style={styles.columnLabel}>{col.label}</span>
                <span style={styles.columnCount}>{columnCards.length}</span>
              </div>

              <div style={styles.columnBody}>
                {columnCards.length === 0 && !loading && (
                  <div style={styles.emptyHint}>Sem briefs</div>
                )}
                {columnCards.map((card) => {
                  const typeLabel = card.requestType
                    ? REQUEST_TYPE_LABELS[card.requestType] ?? card.requestType
                    : "—";
                  return (
                    <IntentLink
                      key={card._id}
                      intent="edit"
                      params={{ id: card._id, type: "briefRequest" }}
                      style={{ textDecoration: "none" }}
                    >
                      <article
                        draggable
                        onDragStart={(e) => {
                          setDraggingId(card._id);
                          e.dataTransfer.setData("text/plain", card._id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setOverColumn(null);
                        }}
                        style={{
                          ...styles.card,
                          opacity: draggingId === card._id ? 0.4 : 1,
                        }}
                      >
                        <div style={styles.cardTitleRow}>
                          <span style={styles.cardTitle}>
                            {card.title || "Sem título"}
                          </span>
                          <span style={styles.cardDate}>
                            {formatDate(card.submittedAt)}
                          </span>
                        </div>
                        <div style={styles.cardMeta}>
                          <span style={styles.cardType}>{typeLabel}</span>
                          {card.requestSubtype && (
                            <>
                              <span style={styles.cardSep}>·</span>
                              <span style={styles.cardSubtype}>
                                {card.requestSubtype}
                              </span>
                            </>
                          )}
                        </div>
                        <div style={styles.cardContact}>
                          {card.contactName || card.company || "—"}
                          {card.company && card.contactName
                            ? ` · ${card.company}`
                            : ""}
                        </div>
                        {card.estimatedRange && (
                          <div style={styles.cardRange}>
                            {card.estimatedRange}
                          </div>
                        )}
                        {card.companySize && (
                          <div style={styles.cardSize}>
                            {card.companySize === "1"
                              ? "Só 1 pessoa"
                              : `${card.companySize} pessoas`}
                          </div>
                        )}
                      </article>
                    </IntentLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    backgroundColor: "#fafafa",
    color: "#111",
  },
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    backgroundColor: "#fff",
  },
  eyebrow: {
    margin: 0,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(0,0,0,0.45)",
  },
  title: {
    margin: "6px 0 0 0",
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: "-0.02em",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  count: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "rgba(0,0,0,0.45)",
  },
  reloadButton: {
    padding: "8px 14px",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    border: "1px solid rgba(0,0,0,0.15)",
    backgroundColor: "#fff",
    color: "#111",
    cursor: "pointer",
  },
  error: {
    padding: "10px 24px",
    fontSize: 12,
    color: "#b63333",
    backgroundColor: "#fff5f5",
    borderBottom: "1px solid rgba(182,51,51,0.2)",
  },
  board: {
    flex: 1,
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(240px, 1fr))",
    gap: 12,
    padding: 16,
    overflowX: "auto",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#fff",
    border: "1px solid rgba(0,0,0,0.08)",
    minHeight: 0,
  },
  columnOver: {
    backgroundColor: "#f4f6ff",
    borderColor: "rgba(30,60,180,0.3)",
  },
  columnHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 14px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  columnDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  columnLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "#111",
  },
  columnCount: {
    marginLeft: "auto",
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(0,0,0,0.4)",
  },
  columnBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 10,
    overflowY: "auto",
  },
  emptyHint: {
    padding: "20px 10px",
    fontSize: 11,
    textAlign: "center",
    color: "rgba(0,0,0,0.3)",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "12px 12px 10px",
    backgroundColor: "#fff",
    border: "1px solid rgba(0,0,0,0.1)",
    cursor: "grab",
    transition: "border-color 120ms ease, transform 120ms ease",
  },
  cardTitleRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    color: "#111",
    lineHeight: 1.3,
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardDate: {
    fontSize: 10,
    fontWeight: 500,
    color: "rgba(0,0,0,0.4)",
    flexShrink: 0,
  },
  cardMeta: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
  },
  cardType: {
    fontWeight: 600,
    color: "#111",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  cardSep: {
    color: "rgba(0,0,0,0.25)",
  },
  cardSubtype: {
    color: "rgba(0,0,0,0.5)",
    textTransform: "capitalize",
  },
  cardContact: {
    fontSize: 11,
    color: "rgba(0,0,0,0.55)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardRange: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: 600,
    color: "#0f8a4c",
    letterSpacing: "-0.01em",
  },
  cardSize: {
    fontSize: 10,
    color: "rgba(0,0,0,0.4)",
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    fontWeight: 500,
  },
};
