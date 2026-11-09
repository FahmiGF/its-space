export type FaqItem = { question: string; answer: string };
export type FaqGroup = { title: string; intro: string; items: FaqItem[] };

export const FAQ_GROUPS: FaqGroup[] = [
  {
    title: "Booking & ketersediaan",
    intro: "Hal yang paling sering ditanyakan sebelum mengunci slot.",
    items: [
      {
        question: "Bagaimana cara memastikan ruangan benar-benar kosong?",
        answer:
          "Ketersediaan diambil langsung dari database, termasuk buffer persiapan 15 menit. Saat Anda submit, PostgreSQL memeriksa ulang slot dan menolak bentrok dengan kode 409. Jika slot baru saja diambil orang lain, pilih jam lain.",
      },
      {
        question: "Mengapa beberapa ruangan perlu persetujuan?",
        answer:
          "Auditorium, laboratorium, studio berbayar, dan area terbuka dapat memerlukan persetujuan pengelola karena kapasitas, keselamatan, atau kebutuhan teknis. Status dan catatan pengelola terlihat di tiket.",
      },
      {
        question: "Berapa lama slot saya dikunci?",
        answer:
          "Begitu booking berhasil, slot langsung dikunci untuk status pending, approved, atau checked_in. Booking yang dibatalkan atau ditolak akan melepaskan slot.",
      },
      {
        question: "Bisakah saya memesan lebih dari satu ruangan pada jam yang sama?",
        answer:
          "Bisa, selama ruangannya berbeda. Constraint anti-bentrok berlaku per fasilitas, bukan per akun. Pastikan Anda benar-benar dapat menghadiri semua agenda.",
      },
    ],
  },
  {
    title: "Pembayaran",
    intro: "Fasilitas gratis tidak memerlukan pembayaran. Fasilitas premium memakai Midtrans.",
    items: [
      {
        question: "Kapan pembayaran diperlukan?",
        answer:
          "Jika fasilitas memiliki tarif per jam, tiket akan menampilkan total biaya. Tekan “Bayar sekarang” untuk membuka halaman Midtrans. Booking berbayar tidak dapat check-in sebelum pembayaran berstatus lunas.",
      },
      {
        question: "Metode pembayaran apa yang didukung?",
        answer:
          "Metode mengikuti konfigurasi Midtrans merchant: QRIS, virtual account bank, kartu, dan kanal lain yang diaktifkan. Status akhir dikirim melalui webhook bertanda tangan.",
      },
      {
        question: "Apakah pembayaran saya otomatis tercatat?",
        answer:
          "Ya, setelah Midtrans mengirim notifikasi yang signature-nya valid. Jika status belum berubah, tunggu beberapa saat lalu muat ulang tiket. Jangan melakukan pembayaran ganda.",
      },
    ],
  },
  {
    title: "Check-in & penggunaan",
    intro: "Datang tepat waktu dan bawa tiket digital Anda.",
    items: [
      {
        question: "Kapan QR check-in aktif?",
        answer:
          "QR muncul setelah booking disetujui. Check-in dibuka 30 menit sebelum jadwal dan ditutup saat jadwal berakhir. Tunjukkan QR kepada petugas atau scan melalui halaman admin.",
      },
      {
        question: "Apa yang harus dilakukan jika terlambat?",
        answer:
          "Hubungi pengelola fasilitas atau operator kampus. Booking yang tidak digunakan dapat dicatat sebagai no-show, dan slot tetap tidak dapat dipakai orang lain selama status aktif.",
      },
      {
        question: "Apakah saya perlu membawa surat izin?",
        answer:
          "Untuk kegiatan rutin, tiket dan persetujuan digital cukup. Kegiatan besar atau melibatkan pihak luar sebaiknya membawa proposal dan izin keramaian sesuai aturan pengelola.",
      },
    ],
  },
  {
    title: "Akun & keamanan",
    intro: "Kelola identitas, kontak, dan sesi akun Anda.",
    items: [
      {
        question: "Di mana saya mengubah nomor WhatsApp?",
        answer:
          "Buka Pengaturan profil dari ikon roda gigi di header atau dari dashboard. Nomor ini dipakai sebagai kontak default saat booking.",
      },
      {
        question: "Apakah mengganti kata sandi mengakhiri sesi lain?",
        answer:
          "Ya. Setelah kata sandi berubah, semua sesi akun diakhiri dan sesi perangkat saat ini dibuat ulang. Ini membantu jika Anda pernah masuk di perangkat bersama.",
      },
    ],
  },
];

export const TUTORIAL_STEPS = [
  {
    number: "01",
    title: "Temukan ruang",
    body: "Buka Jelajahi, pilih kategori atau gedung, lalu isi tanggal dan jam. Filter ketersediaan membaca slot asli dari database.",
    tip: "Gunakan kata kunci seperti “auditorium”, “futsal”, atau “lab”.",
  },
  {
    number: "02",
    title: "Cek detail dan tarif",
    body: "Halaman fasilitas menampilkan kapasitas, fasilitas pendukung, aturan, pengelola, dan tarif per jam jika ada.",
    tip: "Fasilitas gratis tidak menampilkan tombol pembayaran.",
  },
  {
    number: "03",
    title: "Ajukan booking",
    body: "Isi tujuan, jumlah peserta, organisasi, dan kontak. Setujui aturan penggunaan lalu kirim. Slot langsung dikunci oleh database.",
    tip: "Tujuan yang jelas mempercepat persetujuan pengelola.",
  },
  {
    number: "04",
    title: "Selesaikan pembayaran",
    body: "Untuk fasilitas berbayar, buka tiket dan tekan Bayar sekarang. Ikuti halaman Midtrans sampai selesai, lalu kembali ke tiket.",
    tip: "Jangan menutup halaman sebelum status pembayaran kembali ke tiket.",
  },
  {
    number: "05",
    title: "Check-in dengan QR",
    body: "Tunjukkan QR di tiket kepada petugas. Check-in dibuka 30 menit sebelum jadwal. Setelah selesai, petugas dapat mencatat check-out.",
    tip: "Datang 10 menit lebih awal dan bawa kartu identitas.",
  },
];

export type EmergencyContact = {
  label: string;
  detail: string;
  phone: string;
  tone: "red" | "green" | "blue";
};

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    label: "Darurat nasional",
    detail: "Polisi, ambulans, dan kebakaran terintegrasi.",
    phone: "112",
    tone: "red",
  },
  {
    label: "Ambulans & kesehatan",
    detail: "Layanan gawat darurat kesehatan.",
    phone: "119",
    tone: "green",
  },
  {
    label: "Pemadam kebakaran",
    detail: "Kebakaran, evakuasi, dan penyelamatan.",
    phone: "113",
    tone: "red",
  },
  {
    label: "Operator kampus",
    detail: "Hubungkan ke security atau unit terkait.",
    phone: "+62 31 594 7272",
    tone: "blue",
  },
];
