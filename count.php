<?php
// File untuk menghitung jumlah pengunjung

// Nama file untuk menyimpan jumlah pengunjung
$file = 'count.txt';

// Memeriksa apakah file sudah ada
if (file_exists($file)) {
    // Baca jumlah pengunjung saat ini
    $count = (int)file_get_contents($file);
} else {
    // Jika belum ada file, mulai dengan 0
    $count = 0;
}

// Tambahkan satu setiap kali halaman diakses
$count++;

// Simpan jumlah pengunjung yang diperbarui ke file
file_put_contents($file, $count);

// Menampilkan jumlah pengunjung
echo $count;
?>