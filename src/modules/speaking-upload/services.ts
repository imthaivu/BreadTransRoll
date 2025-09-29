import { db, storage } from "@/lib/firebase/client";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { SpeakingSubmission } from "./types";

// Uploads a speaking submission file to Firebase Storage and saves metadata to Firestore.
export async function uploadSpeakingSubmission(
  file: File,
  studentId: string,
  studentName: string,
  bookId: string,
  lessonId: number,
  onProgress: (progress: number) => void
): Promise<string> {
  if (!file || !studentId || !bookId || !lessonId) {
    throw new Error("Invalid arguments for submission.");
  }

  const type = file.type || "audio/webm";
  let ext = "webm";
  if (type.includes("mpeg") || type.includes("mp3")) ext = "mp3";
  else if (type.includes("ogg")) ext = "ogg";
  else if (type.includes("wav")) ext = "wav";

  // 1. Create a unique path in Firebase Storage
  const date = new Date();
  const timestamp = date.toISOString();
  // get date type dd-MM-yyyy
  const dateStr = `${date.getDate()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${date.getFullYear()}`;

  const storagePath = `speaking_submissions/${dateStr}/book-${bookId}/lesson-${lessonId}/student-${studentId}.${ext}`;
  const storageRef = ref(storage, storagePath);

  // 2. Upload the file with progress tracking
  const uploadTask = uploadBytesResumable(storageRef, file);

  const uploadPromise = new Promise<string>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        reject(error);
      },
      async () => {
        // 3. Get the download URL after successful upload
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        // 4. Prepare metadata for Firestore
        const docId = `${studentId}_${bookId}_${lessonId}`;
        const submissionDocRef = doc(db, "speakingSubmissions", docId);
        const submissionData: Omit<SpeakingSubmission, "submittedAt"> = {
          studentId,
          studentName,
          bookId,
          lessonId,
          fileURL: downloadURL,
          originalFileName: file.name,
        };

        // 5. Save metadata to Firestore (create or overwrite)
        await setDoc(submissionDocRef, {
          ...submissionData,
          submittedAt: serverTimestamp(),
        });

        resolve(downloadURL);
      }
    );
  });

  return uploadPromise;
}

// Checks if a speaking submission already exists for the given student, book, and lesson.
export async function checkSpeakingSubmission(
  studentId: string,
  bookId: string,
  lessonId: number
): Promise<boolean> {
  if (!studentId || !bookId || !lessonId) {
    return false;
  }

  try {
    const docId = `${studentId}_${bookId}_${lessonId}`;
    const submissionDocRef = doc(db, "speakingSubmissions", docId);
    const docSnap = await getDoc(submissionDocRef);

    return docSnap.exists();
  } catch (error) {
    console.error("Error checking speaking submission:", error);
    return false;
  }
}
