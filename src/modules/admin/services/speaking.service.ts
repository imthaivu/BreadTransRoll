import { db, storage } from "@/lib/firebase/client";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";

const SPEAKING_SUBMISSIONS_COLLECTION = "speakingSubmissions";

/**
 * Get total count of speaking submissions that have audio files
 */
export const getTotalSpeakingSubmissions = async (): Promise<number> => {
  try {
    const speakingSubmissionsRef = collection(
      db,
      SPEAKING_SUBMISSIONS_COLLECTION
    );
    const snapshot = await getDocs(speakingSubmissionsRef);
    // Filter documents that have a non-null, non-empty fileURL and are not marked as deleted
    const count = snapshot.docs.filter(
      (doc) => {
        const data = doc.data();
        return (
          data.fileURL &&
          data.fileURL !== null &&
          data.fileURL !== "" &&
          !data.fileDeleted // Only count files that haven't been deleted
        );
      }
    ).length;
    return count;
  } catch (error) {
    console.error("Error getting total speaking submissions:", error);
    throw error;
  }
};

/**
 * Extract storage path from Firebase Storage download URL
 * Firebase Storage URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media&token={token}
 */
const extractStoragePathFromURL = (fileURL: string): string | null => {
  try {
    const urlObj = new URL(fileURL);
    
    // Extract path from /o/{path}? pattern
    // The path is URL encoded, so we need to decode it
    const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
    if (pathMatch && pathMatch[1]) {
      // Decode the path (it's URL encoded, spaces become %20, etc.)
      let decodedPath = decodeURIComponent(pathMatch[1]);
      
      // Handle double encoding (sometimes Firebase encodes twice)
      if (decodedPath.includes('%')) {
        decodedPath = decodeURIComponent(decodedPath);
      }
      
      return decodedPath;
    }
    
    console.warn(`Could not extract path from URL: ${fileURL}`);
    return null;
  } catch (error) {
    console.error("Error extracting storage path from URL:", error, fileURL);
    return null;
  }
};

/**
 * Delete audio file from storage but keep the document in Firestore
 * This maintains the submission status but removes the audio file
 * Note: We keep fileURL in document but mark it as deleted, or we can reconstruct the path
 */
export const deleteSpeakingAudioFile = async (
  submissionId: string,
  fileURL: string
): Promise<void> => {
  try {
    // 1. Extract and delete file from Firebase Storage
    const storagePath = extractStoragePathFromURL(fileURL);
    
    if (!storagePath) {
      throw new Error(`Không thể trích xuất đường dẫn từ URL: ${fileURL}`);
    }

    const storageRef = ref(storage, storagePath);
    
    try {
      await deleteObject(storageRef);
      console.log(`Đã xóa file: ${storagePath}`);
    } catch (deleteError: unknown) {
      // If file doesn't exist, that's okay - it might have been deleted already
      const error = deleteError as { code?: string };
      if (error?.code !== "storage/object-not-found") {
        throw deleteError;
      }
      console.log(`File không tồn tại (có thể đã bị xóa): ${storagePath}`);
    }

    // 2. Update Firestore document: keep fileURL but mark as deleted
    // This way the document still exists and teachers can see it was submitted
    // but the file is deleted from storage
    const submissionRef = doc(db, SPEAKING_SUBMISSIONS_COLLECTION, submissionId);
    await updateDoc(submissionRef, {
      fileDeleted: true, // Mark as deleted for tracking, but keep fileURL
    });
  } catch (error) {
    console.error("Error deleting speaking audio file:", error);
    throw error;
  }
};

/**
 * Get all speaking submissions with fileURL for bulk deletion
 */
export const getAllSpeakingSubmissionsWithFiles = async (): Promise<
  Array<{ id: string; fileURL: string }>
> => {
  try {
    const speakingSubmissionsRef = collection(
      db,
      SPEAKING_SUBMISSIONS_COLLECTION
    );
    const snapshot = await getDocs(speakingSubmissionsRef);
    // Filter documents that have a non-null, non-empty fileURL and are not marked as deleted
    return snapshot.docs
      .filter((doc) => {
        const data = doc.data();
        return (
          data.fileURL &&
          data.fileURL !== null &&
          data.fileURL !== "" &&
          !data.fileDeleted
        );
      })
      .map((doc) => ({
        id: doc.id,
        fileURL: doc.data().fileURL as string,
      }));
  } catch (error) {
    console.error("Error getting speaking submissions with files:", error);
    throw error;
  }
};

/**
 * Delete all audio files from storage but keep documents in Firestore
 */
export const deleteAllSpeakingAudioFiles = async (): Promise<number> => {
  try {
    const submissions = await getAllSpeakingSubmissionsWithFiles();
    let deletedCount = 0;
    const errors: string[] = [];

    for (const submission of submissions) {
      try {
        // Use the same delete function for consistency
        await deleteSpeakingAudioFile(submission.id, submission.fileURL);
        deletedCount++;
      } catch (error) {
        const errorMsg = `Error deleting submission ${submission.id}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    if (errors.length > 0) {
      console.warn(`Some deletions failed: ${errors.join(", ")}`);
      // Still return count of successful deletions
    }

    return deletedCount;
  } catch (error) {
    console.error("Error deleting all speaking audio files:", error);
    throw error;
  }
};

