import React from 'react';

const KebijakanPrivasi: React.FC = () => {
  return (
    <main className="flex-grow bg-gray-50 pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-xl border border-gray-100">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-4">Kebijakan Privasi</h1>
            <div className="w-24 h-1.5 bg-yellow-500 mx-auto rounded-full mb-6"></div>
            <p className="text-gray-600 font-medium">Sesuai dengan Undang-Undang Perlindungan Data Pribadi (UU PDP) No. 27 Tahun 2022</p>
          </div>

          <div className="prose prose-blue max-w-none prose-headings:text-blue-900 prose-a:text-yellow-600">
            <p>
              Pemerintah Provinsi Papua Barat Daya melalui Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) 
              ("Kami") berkomitmen untuk melindungi privasi dan keamanan data pribadi Anda. Kebijakan Privasi 
              ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi 
              Anda saat Anda mengakses dan menggunakan website resmi kami di <code>pupr.papuabaratdayaprov.go.id</code>.
            </p>

            <h3>1. Pengumpulan Data Pribadi</h3>
            <p>
              Kami dapat mengumpulkan data pribadi Anda ketika Anda:
            </p>
            <ul>
              <li>Menggunakan layanan pelaporan atau pengaduan tata ruang.</li>
              <li>Mengisi formulir pendaftaran untuk layanan seperti Izin Bangunan (PBG) atau RTLH.</li>
              <li>Menghubungi kami melalui email atau formulir kontak.</li>
            </ul>
            <p>
              Data yang dikumpulkan dapat mencakup, namun tidak terbatas pada: Nama lengkap, Nomor Induk Kependudukan (NIK), alamat surel (email), nomor telepon, alamat domisili, dan data lokasi.
            </p>

            <h3>2. Tujuan Penggunaan Data</h3>
            <p>
              Data pribadi Anda digunakan semata-mata untuk:
            </p>
            <ul>
              <li>Memproses permohonan layanan publik (seperti KKPR, PBG, Pertek Air).</li>
              <li>Menindaklanjuti laporan atau aduan yang Anda sampaikan.</li>
              <li>Menghubungi Anda terkait status permohonan atau laporan Anda.</li>
              <li>Meningkatkan kualitas layanan publik di lingkungan Dinas PUPR Papua Barat Daya.</li>
            </ul>

            <h3>3. Penyimpanan dan Keamanan Data</h3>
            <p>
              Kami menyimpan data pribadi Anda dalam server yang aman yang berlokasi di wilayah Republik Indonesia. 
              Kami menerapkan standar keamanan teknis dan operasional untuk melindungi data Anda dari akses 
              yang tidak sah, perubahan, pengungkapan, atau pemusnahan yang melanggar hukum.
            </p>

            <h3>4. Pengungkapan Data</h3>
            <p>
              Kami tidak akan menjual, menyewakan, atau membagikan data pribadi Anda kepada pihak ketiga tanpa 
              persetujuan Anda, kecuali:
            </p>
            <ul>
              <li>Diwajibkan oleh peraturan perundang-undangan.</li>
              <li>Atas perintah pengadilan atau instansi penegak hukum.</li>
              <li>Untuk keperluan pemrosesan layanan oleh instansi pemerintah terkait (misalnya Diskominfo atau DPMPTSP).</li>
            </ul>

            <h3>5. Hak Pengguna</h3>
            <p>
              Sesuai dengan UU PDP, Anda memiliki hak untuk:
            </p>
            <ul>
              <li>Meminta akses ke data pribadi Anda yang kami simpan.</li>
              <li>Meminta pembaruan atau perbaikan data pribadi Anda jika terdapat kesalahan.</li>
              <li>Meminta penghapusan data pribadi Anda, kecuali data tersebut wajib disimpan berdasarkan peraturan perundangan.</li>
            </ul>

            <h3>6. Hubungi Kami</h3>
            <p>
              Jika Anda memiliki pertanyaan, kekhawatiran, atau ingin menggunakan hak Anda terkait data pribadi, 
              silakan hubungi Pejabat Pengelola Informasi dan Dokumentasi (PPID) atau Data Protection Officer (DPO) kami:
            </p>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mt-4">
              <ul className="list-none pl-0 space-y-2 m-0">
                <li><i className="fas fa-envelope text-blue-900 w-6"></i> info@pupr.papuabaratdayaprov.go.id</li>
                <li><i className="fas fa-phone text-blue-900 w-6"></i> (0951) 123456</li>
                <li><i className="fas fa-building text-blue-900 w-6"></i> Kantor Dinas PUPR Prov. Papua Barat Daya, Jl. Pendidikan No. 02, Sorong</li>
              </ul>
            </div>
            
            <p className="text-sm text-gray-500 mt-12 border-t pt-6">
              Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default KebijakanPrivasi;
