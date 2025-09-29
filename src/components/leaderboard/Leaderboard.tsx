"use client";

import { getDb } from "@/lib/firebase/client";
import {
  collection,
  doc,
  limit as fsLimit,
  query as fsQuery,
  getDoc,
  getDocs,
  orderBy,
  Timestamp,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/lib/auth/context";
import { cn } from "@/utils";
import Image from "next/image";

type TimeRange = "7d" | "30d" | "all";

type LeaderboardRow = {
  uid: string;
  avg: number;
  count: number;
  name?: string;
  avatarUrl?: string;
};

export default function Leaderboard({
  classIdHint,
  limit = 10,
}: {
  classIdHint?: string;
  limit?: number;
}) {
  const { session } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const constraints = [where("status", "==", "reviewed")];
        let startTs: Timestamp | null = null;
        if (timeRange !== "all") {
          const days = timeRange === "7d" ? 7 : 30;
          const start = new Date();
          start.setDate(start.getDate() - days);
          startTs = Timestamp.fromDate(start);
          constraints.push(where("createdAt", ">=", startTs));
        }

        // Prefer indexed query: reviewed + recent by createdAt desc to bound reads
        let q = fsQuery(
          collection(getDb(), "submissions"),
          ...constraints,
          orderBy("createdAt", "desc"),
          fsLimit(500)
        );

        let snap;
        try {
          snap = await getDocs(q);
        } catch {
          // Fallbacks if composite index is missing: only bound by createdAt
          if (startTs) {
            q = fsQuery(
              collection(getDb(), "submissions"),
              where("createdAt", ">=", startTs),
              orderBy("createdAt", "desc"),
              fsLimit(500)
            );
          } else {
            q = fsQuery(
              collection(getDb(), "submissions"),
              orderBy("createdAt", "desc"),
              fsLimit(500)
            );
          }
          snap = await getDocs(q);
        }

        const scores: Record<string, { total: number; count: number }> = {};
        snap.docs.forEach((d) => {
          const data = d.data() as {
            score?: unknown;
            uid?: unknown;
            status?: unknown;
          };
          if (typeof data.score === "number" && typeof data.uid === "string") {
            // Ensure reviewed-only when fallback path didn't include status filter
            if (timeRange === "all" || data.status === "reviewed") {
              const uid = data.uid;
              scores[uid] = scores[uid] || { total: 0, count: 0 };
              scores[uid].total += data.score;
              scores[uid].count += 1;
            }
          }
        });

        const base = Object.entries(scores)
          .map(([uid, s]) => ({
            uid,
            avg: s.total / Math.max(1, s.count),
            count: s.count,
          }))
          .filter((r) => r.count > 0)
          .sort((a, b) => b.avg - a.avg)
          .slice(0, expanded ? Math.max(limit, 50) : limit);

        // Fetch display names and avatars for listed UIDs
        const withProfiles = await Promise.all(
          base.map(async (r) => {
            try {
              const ref = doc(getDb(), "users", r.uid);
              const userSnap = await getDoc(ref);
              const data = userSnap.data() as
                | { displayName?: unknown; avatarUrl?: unknown }
                | undefined;
              const name =
                typeof data?.displayName === "string" && data.displayName.trim()
                  ? (data.displayName as string)
                  : undefined;
              const avatarUrl =
                typeof data?.avatarUrl === "string" && data.avatarUrl.trim()
                  ? (data.avatarUrl as string)
                  : undefined;
              return { ...r, name, avatarUrl } as LeaderboardRow;
            } catch {
              return r as LeaderboardRow;
            }
          })
        );

        setRows(withProfiles);
      } finally {
        setLoading(false);
      }
    })();
  }, [classIdHint, limit, timeRange, expanded]);

  const top3 = useMemo(() => rows.slice(0, 3), [rows]);
  const rest = useMemo(() => rows.slice(3), [rows]);
  const maxScore = useMemo(
    () => Math.max(10, ...rows.map((r) => r.avg)),
    [rows]
  );
  const myRank = useMemo(
    () => rows.findIndex((r) => r.uid === session?.user?.id),
    [rows, session?.user?.id]
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm md:text-base font-medium text-slate-700">
          Bảng xếp hạng
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-white p-1 text-xs">
          {(
            [
              { k: "7d", label: "7 ngày" },
              { k: "30d", label: "30 ngày" },
              { k: "all", label: "Tất cả" },
            ] as Array<{ k: TimeRange; label: string }>
          ).map((opt) => (
            <button
              key={opt.k}
              onClick={() => setTimeRange(opt.k)}
              className={cn(
                "px-2 py-1 rounded",
                timeRange === opt.k
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-slate-50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-lg bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-sm md:text-base text-slate-500">
          Chưa có dữ liệu.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 items-end">
            {top3.map((r, idx) => (
              <div
                key={r.uid}
                className={cn(
                  "text-center p-4 rounded-lg border border-border bg-white",
                  idx === 0 && "shadow-md"
                )}
              >
                <div className="relative mx-auto mb-3 w-12 h-12">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                    {r.avatarUrl ? (
                      <Image
                        src={r.avatarUrl}
                        alt={r.name ?? r.uid}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-cover"
                      />
                    ) : (
                      <span className="text-lg">👤</span>
                    )}
                  </div>
                  <div
                    className={cn(
                      "absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shadow",
                      idx === 0
                        ? "bg-yellow-500"
                        : idx === 1
                        ? "bg-slate-400"
                        : "bg-amber-700"
                    )}
                    title={idx === 0 ? "Top 1" : idx === 1 ? "Top 2" : "Top 3"}
                  >
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                  </div>
                </div>
                <div className="text-sm md:text-base text-slate-700 truncate">
                  {r.name ?? `HS ${r.uid.slice(0, 6)}`}
                </div>
                <div className="text-xl font-semibold">{r.avg.toFixed(1)}</div>
                <div className="text-xs text-slate-500">{r.count} bài</div>
              </div>
            ))}
          </div>

          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((r, i) => (
                <div
                  key={r.uid}
                  className="p-3 rounded-lg border border-border bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-sm md:text-base text-slate-500">
                      #{i + 4}
                    </div>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                      {r.avatarUrl ? (
                        <Image
                          src={r.avatarUrl}
                          alt={r.name ?? r.uid}
                          width={32}
                          height={32}
                          className="w-8 h-8 object-cover"
                        />
                      ) : (
                        <span className="text-sm md:text-base">👤</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium truncate">
                          {r.name ?? `HS ${r.uid.slice(0, 8)}`}
                        </div>
                        <div className="text-slate-600 text-sm md:text-base">
                          {r.avg.toFixed(1)}
                        </div>
                      </div>
                      <div className="mt-2 h-2 rounded bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{
                            width: `${Math.min(
                              100,
                              (r.avg / maxScore) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {r.count} bài
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {typeof myRank === "number" && myRank >= 0 && (
            <div className="rounded-lg border border-border bg-indigo-50 p-3 text-sm md:text-base">
              Vị trí của bạn:{" "}
              <span className="font-semibold">#{myRank + 1}</span> • Điểm TB{" "}
              {rows[myRank].avg.toFixed(1)} ({rows[myRank].count} bài)
            </div>
          )}

          {rows.length >= limit && (
            <button
              type="button"
              className="w-full mt-2 text-sm md:text-base text-indigo-600 hover:underline"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Thu gọn" : "Xem thêm"}
            </button>
          )}
        </>
      )}
    </section>
  );
}
