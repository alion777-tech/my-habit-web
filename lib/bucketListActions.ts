import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BucketListData } from "@/types/appTypes";

export const getBucketList = async (uid: string): Promise<BucketListData | null> => {
    if (!uid) return null;

    try {
        const docRef = doc(db, "users", uid, "bucketList", "main");
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            return snap.data() as BucketListData;
        }
        return null;
    } catch (e) {
        console.error("Error fetching bucket list:", e);
        return null;
    }
};

export const saveBucketList = async (uid: string, data: BucketListData): Promise<void> => {
    if (!uid) return;

    try {
        const docRef = doc(db, "users", uid, "bucketList", "main");
        await setDoc(docRef, data);
    } catch (e) {
        console.error("Error saving bucket list:", e);
        throw e;
    }
};
