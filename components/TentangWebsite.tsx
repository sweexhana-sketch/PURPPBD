import React from 'react';

const TentangWebsite: React.FC = () => {
  return (
    <main className="flex-grow bg-gray-50 pt-32 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-xl border border-gray-100">
          <div className="text-center mb-12">
            <div className="flex justify-center items-center space-x-4 mb-6">
              <img src="/Logo_Papua_Barat_Daya.png" alt="Logo PBD" className="h-16 w-auto" />
              <img src="/PUPR.webp" alt="Logo PUPR" className="h-16 w-auto" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-4">Tentang Website Resmi</h1>
            <div className="w-24 h-1.5 bg-yellow-500 mx-auto rounded-full mb-6"></div>
            <p className="text-gray-600 font-medium">Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Papua Barat Daya</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Profil Singkat</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Website ini adalah portal informasi dan layanan publik resmi milik <strong>Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Provinsi Papua Barat Daya</strong>. 
                Situs ini dikelola untuk mendukung transparansi, akuntabilitas, dan percepatan pelayanan publik di bidang infrastruktur dan penataan ruang.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Domain <code>pupr.papuabaratdayaprov.go.id</code> merupakan domain resmi pemerintah yang terdaftar di Kementerian Komunikasi dan Digital Republik Indonesia (PANDI).
              </p>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Pengelolaan Website</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-bold mr-4">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Penanggung Jawab</h4>
                    <p className="text-sm text-gray-600">Kepala Dinas PUPR Provinsi Papua Barat Daya</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-bold mr-4">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Pengelola Konten (Redaksi)</h4>
                    <p className="text-sm text-gray-600">Sub Bagian Perencanaan & Pelaporan / PPID Dinas PUPR</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-bold mr-4">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Pengelola Teknis</h4>
                    <p className="text-sm text-gray-600">Tim IT Dinas PUPR berkoordinasi dengan Diskominfo Provinsi Papua Barat Daya</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-3xl p-8 text-white mb-12 shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <i className="fas fa-universal-access mr-3 text-yellow-400 text-2xl"></i> 
              Pernyataan Aksesibilitas
            </h2>
            <p className="text-blue-100 leading-relaxed">
              Kami berkomitmen untuk memastikan bahwa website ini dapat diakses oleh semua lapisan masyarakat, termasuk penyandang disabilitas. 
              Situs ini dirancang dengan memperhatikan pedoman Web Content Accessibility Guidelines (WCAG) dan standar pemerintah dalam penyelenggaraan sistem elektronik. 
              Jika Anda mengalami kesulitan akses, silakan hubungi tim dukungan kami.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">Kontak Pengaduan & Layanan IT</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2">Tim Helpdesk Website</h3>
                <p className="text-gray-600 text-sm mb-4">Untuk masalah teknis, error pada website, atau pelaporan kerentanan keamanan (Bug Bounty).</p>
                <p className="text-blue-900 font-medium"><i className="fas fa-envelope mr-2"></i> it.support@pupr.papuabaratdayaprov.go.id</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2">Layanan Informasi (PPID)</h3>
                <p className="text-gray-600 text-sm mb-4">Untuk pertanyaan seputar konten, permohonan informasi publik, dan berita.</p>
                <p className="text-blue-900 font-medium"><i className="fas fa-info-circle mr-2"></i> ppid@pupr.papuabaratdayaprov.go.id</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default TentangWebsite;
