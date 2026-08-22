function isCutiWindowOpen(dateObj = new Date()) {
  const d = dateObj.getDate();
  const m = dateObj.getMonth();
  const y = dateObj.getFullYear();
  const lastDay = new Date(y, m + 1, 0).getDate();
  return (d === lastDay || d === 1 || d === 2);
}

function canEditCutiMatrix(userSession) {
  if (!userSession) return false;
  return !!(userSession.username || userSession.role);
}

console.log("==========================================");
console.log("🧪 TESTING CUTI SUBMISSION WINDOW & RBAC");
console.log("==========================================");

// 1. Test Window Open on 31 August 2026
const aug31 = new Date(2026, 7, 31); // Month is 0-indexed: 7 = August
console.log("31 Agustus 2026 (Akhir bulan):", isCutiWindowOpen(aug31) ? "DIBUKA ✅" : "DITUTUP ❌");

// 2. Test Window Open on 1 September 2026
const sep1 = new Date(2026, 8, 1);
console.log("1 September 2026 (Hari ke-1):", isCutiWindowOpen(sep1) ? "DIBUKA ✅" : "DITUTUP ❌");

// 3. Test Window Open on 2 September 2026
const sep2 = new Date(2026, 8, 2);
console.log("2 September 2026 (Hari ke-2):", isCutiWindowOpen(sep2) ? "DIBUKA ✅" : "DITUTUP ❌");

// 4. Test Window Closed on 3 September 2026
const sep3 = new Date(2026, 8, 3);
console.log("3 September 2026 (Hari ke-3):", !isCutiWindowOpen(sep3) ? "DITUTUP PRESISI ✅" : "DIBUKA ❌");

// 5. Test Window Closed on 22 August 2026
const aug22 = new Date(2026, 7, 22);
console.log("22 Agustus 2026 (Pertengahan bulan):", !isCutiWindowOpen(aug22) ? "DITUTUP PRESISI ✅" : "DIBUKA ❌");

// 6. Test RBAC Rules
console.log("\n--- TESTING RBAC LEAVE MATRIX EDIT ---");
console.log("Karyawan Mandiri (Tanpa Login Staf):", !canEditCutiMatrix(null) ? "EDIT DITOLAK (READ ONLY) ✅" : "DIIZINKAN ❌");
console.log("Staf Terautentikasi (Andika - HR Admin):", canEditCutiMatrix({ username: 'andika', role: 'hr_admin' }) ? "EDIT DIIZINKAN ✅" : "DITOLAK ❌");

if (
  isCutiWindowOpen(aug31) &&
  isCutiWindowOpen(sep1) &&
  isCutiWindowOpen(sep2) &&
  !isCutiWindowOpen(sep3) &&
  !isCutiWindowOpen(aug22) &&
  !canEditCutiMatrix(null) &&
  canEditCutiMatrix({ username: 'andika', role: 'hr_admin' })
) {
  console.log("\n🎉 ALL CUTI WINDOW & RBAC EDITING TESTS PASSED 100%!");
} else {
  console.error("\n❌ TEST FAILED!");
  process.exit(1);
}
