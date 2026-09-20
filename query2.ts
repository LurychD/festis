import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./src/firebase";

async function run() {
  const q = query(
    collection(db, "auditlogs"),
    where("timestamp", ">=", "2026-05-01T00:00:00.000Z"),
    where("timestamp", "<=", "2026-06-01T23:59:59.999Z")
  );
  
  const snap = await getDocs(q);
  console.log("Total docs:", snap.size);
  snap.forEach(doc => {
    console.log(doc.data().details);
  });
}
run().catch(console.error);
