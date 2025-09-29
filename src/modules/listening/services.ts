import { db } from "@/lib/firebase/client";
import {
  doc,
  runTransaction,
  serverTimestamp,
  increment,
} from "firebase/firestore";

export interface SaveListeningProgressInput {
  studentId: string;
  module: string; // e.g., "streamline" | "lessons1000"
  itemKey: string; // e.g., bookId or composite key
  audioId: string; // e.g., lesson index + 1
  durationSeconds: number;
  maxProgressPercent: number; // 0..100
}

function buildDocId(input: SaveListeningProgressInput) {
  const { studentId, module, itemKey, audioId } = input;
  return `${studentId}_${module}_${itemKey}_${audioId}`;
}

export async function saveListeningProgress(
  input: SaveListeningProgressInput
): Promise<void> {
  const docId = buildDocId(input);
  const ref = doc(db, "listeningProgress", docId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const payload = {
      studentId: input.studentId,
      module: input.module,
      itemKey: input.itemKey,
      audioId: input.audioId,
      durationSeconds: Math.round(input.durationSeconds || 0),
      maxProgressPercent: Math.min(
        100,
        Math.max(0, Math.round(input.maxProgressPercent || 0))
      ),
      lastListenedAt: serverTimestamp(),
    } as const;

    if (snap.exists()) {
      const prev = snap.data() as { maxProgressPercent?: number };
      const newMax = Math.max(
        prev?.maxProgressPercent ?? 0,
        payload.maxProgressPercent
      );
      tx.update(ref, {
        ...payload,
        maxProgressPercent: newMax,
        listenCount: increment(1),
      });
    } else {
      tx.set(ref, {
        ...payload,
        listenCount: 1,
      });
    }
  });
}
