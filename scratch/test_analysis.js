const fs = require('fs');
const path = require('path');
const XLSX = require(path.join(__dirname, 'xlsx.js'));

const buf = fs.readFileSync(path.join(__dirname, 'sample.xls'));
const wb = XLSX.read(buf, { type: 'buffer' });
const ws = wb.Sheets['Lap. Log Absen'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

function parseTime(tStr) {
  if (!tStr || !tStr.includes(':')) return 0;
  const [h, m] = tStr.split(':').map(Number);
  return h * 60 + m;
}

const employeesAnalysis = [];

for (let r = 0; r < data.length; r++) {
  const row = data[r];
  if (row && row[0] && row[0].toString().startsWith('ID:')) {
    const pin = row[2] ? row[2].toString().trim() : '';
    // Find name in row
    let name = 'ID-' + pin;
    for (let c = 0; c < row.length; c++) {
      if (row[c] === 'Nama:' && row[c + 2]) {
        name = row[c + 2].toString().trim();
        break;
      }
    }
    
    const scanRow = data[r + 1] || [];
    
    let totalHadir = 0;
    let totalTelatHari = 0;
    let totalGaMasuk = 0;
    let totalKelebihanIstirahatHari = 0;
    let totalMenitKelebihanIstirahat = 0;
    let totalPulangAwal = 0;
    let totalIncomplete = 0;
    const sampleViolations = [];

    // Days 1 to 31
    for (let day = 1; day <= 31; day++) {
      const cell = scanRow[day - 1];
      const dateStr = '2026-05-' + String(day).padStart(2, '0');
      
      if (!cell || cell.toString().trim() === '') {
        totalGaMasuk++;
        continue;
      }

      const rawPunches = cell.toString().trim();
      const punches = [];
      for (let i = 0; i < rawPunches.length; i += 5) {
        const p = rawPunches.substring(i, i + 5);
        if (p.includes(':')) punches.push(p);
      }

      if (punches.length === 0) {
        totalGaMasuk++;
        continue;
      }

      totalHadir++;
      const inTime = punches[0];
      const outTime = punches.length > 1 ? punches[punches.length - 1] : null;

      // 1. Cek Keterlambatan Pagi (Jadwal 07:00, Toleransi 07:05)
      if (inTime) {
        const inMinutes = parseTime(inTime);
        const limitMinutes = parseTime('07:05');
        if (inMinutes > limitMinutes) {
          const lateMinutes = inMinutes - parseTime('07:00');
          totalTelatHari++;
          sampleViolations.push(`Tgl ${day}: Terlambat Masuk (${inTime}, telat ${lateMinutes} mnt)`);
        }
      }

      // 2. Cek Istirahat (Kelebihan Istirahat > 60 Menit)
      if (punches.length >= 4) {
        // e.g. ["06:30", "12:28", "13:29", "15:58"]
        const breakOut = parseTime(punches[1]);
        const breakIn = parseTime(punches[2]);
        if (breakIn > breakOut) {
          const breakDuration = breakIn - breakOut;
          if (breakDuration > 60) {
            const excess = breakDuration - 60;
            totalKelebihanIstirahatHari++;
            totalMenitKelebihanIstirahat += excess;
            sampleViolations.push(`Tgl ${day}: Istirahat Lebih ${excess} mnt (${punches[1]}-${punches[2]} = ${breakDuration} mnt)`);
          }
        }
      }

      // 3. Cek Pulang Awal (< 15:55)
      if (outTime && punches.length > 1) {
        const outMinutes = parseTime(outTime);
        if (outMinutes < parseTime('15:55')) {
          totalPulangAwal++;
          sampleViolations.push(`Tgl ${day}: Pulang Awal (${outTime})`);
        }
      } else if (!outTime) {
        totalIncomplete++;
        sampleViolations.push(`Tgl ${day}: Hanya 1 scan (${inTime})`);
      }
    }

    employeesAnalysis.push({
      PIN: pin,
      Nama: name,
      Hadir: totalHadir,
      'Telat (Hari)': totalTelatHari,
      'Alpa/Libur': totalGaMasuk,
      'Over Break (Hari)': totalKelebihanIstirahatHari,
      'Total Menit Over Break': totalMenitKelebihanIstirahat + ' mnt',
      'Pulang Awal': totalPulangAwal,
      'Contoh Temuan': sampleViolations.slice(0, 2).join('; ')
    });
  }
}

console.log('\n=== HASIL EKSTRAKSI & ANALISIS DISIPLIN FINGERPRINT (MEI 2026) ===');
console.table(employeesAnalysis);
