"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Users, LogOut, CheckCircle, XCircle, LogIn } from 'lucide-react';

export default function KioskPage() {
const router = useRouter();

  const [time, setTime] = useState(new Date());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Update jam setiap detik
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAbsen = (type: any) => {
    if (!username.trim() || !password.trim()) {
      setMessage({ text: 'Username dan Password wajib diisi!', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return;
    }
    
    // Simulasi: 1. Verifikasi 2. Ambil Foto Webcam 3. Simpan DB
    setMessage({ 
      text: `📸 Wajah terfoto! Berhasil ${type === 'in' ? 'Check-In' : 'Check-Out'} & tersimpan di database.`, 
      type: 'success' 
    });
    
    // Reset form setelah sukses
    setUsername('');
    setPassword('');
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* Kiri: Brand & Kamera */}
      <div className="w-1/2 bg-white flex flex-col p-8 border-r-4 border-accent">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            CV. BISNIS PRO KOMPUTAMA
          </h1>
          <p className="text-lg italic font-semibold mt-1 text-accent">
            Support All of Your Needs
          </p>
        </div>

        <div className="grow flex flex-col items-center justify-center">
          <div className="w-full max-w-md aspect-video bg-slate-200 rounded-2xl border-4 border-secondary flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            <Camera size={64} className="text-slate-400 mb-4" />
            <p className="text-slate-500 font-medium">Kamera Aktif saat Check-In</p>
            
            {/* Sudut kamera (UI embellishment) */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-slate-400"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-slate-400"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-slate-400"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-slate-400"></div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={() => router.push('/login')}
            className="text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center w-full gap-2"
          >
            <LogIn size={16} /> Masuk sebagai Admin
          </button>
        </div>
      </div>

      {/* Kanan: Interaksi Kiosk */}
      <div className="w-1/2 flex flex-col items-center justify-center p-12 bg-primary">
        
        {/* Jam Digital */}
        <div className="text-white text-center mb-12">
          <div className="text-7xl font-bold tracking-wider mb-2 drop-shadow-lg">
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second:'2-digit' })}
          </div>
          <div className="text-2xl font-light opacity-80">
            {time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Notifikasi */}
        <div className="w-full max-w-sm mb-6 h-16 flex items-center justify-center">
          {message.text && (
            <div className={`px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-bounce shadow-lg text-center
              ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.type === 'success' ? <CheckCircle className="shrink-0" /> : <XCircle className="shrink-0" />}
              {message.text}
            </div>
          )}
        </div>

        {/* Form Login / Absen */}
        <div className="w-full max-w-sm flex flex-col gap-4 mb-8">
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-5 py-4 rounded-xl bg-white text-slate-800 text-lg shadow-md border-2 border-transparent focus:border-secondary outline-none transition-all placeholder:text-slate-400"
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 rounded-xl bg-white text-slate-800 text-lg shadow-md border-2 border-transparent focus:border-secondary outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Tombol Aksi */}
        <div className="flex gap-4 w-full max-w-sm">
          <button onClick={() => handleAbsen('in')} className="flex-1 py-4 rounded-xl text-white font-bold text-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex flex-col items-center gap-1 bg-secondary">
            <Users size={24} />
            CHECK-IN
          </button>
          <button onClick={() => handleAbsen('out')} className="flex-1 py-4 rounded-xl text-white font-bold text-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex flex-col items-center gap-1 bg-accent">
            <LogOut size={24} />
            CHECK-OUT
          </button>
        </div>

      </div>
    </div>
  );
};