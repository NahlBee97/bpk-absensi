"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Loader2,
  TrendingUp,
  AlarmClock,
  Trophy,
} from "lucide-react";
import { formatTitleCase } from "@/helper";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Jam kerja standar untuk acuan tepat waktu / terlambat
const JAM_MASUK_STANDAR = { hour: 8, minute: 0 };

const CHART_COLORS = {
  primary: "#1e3a5f",
  accent: "#3b82f6",
  secondary: "#10b981",
  danger: "#ef4444",
  muted: "#cbd5e1",
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isTerlambat = (waktuMasuk: string) => {
  const d = new Date(waktuMasuk);
  return (
    d.getHours() > JAM_MASUK_STANDAR.hour ||
    (d.getHours() === JAM_MASUK_STANDAR.hour &&
      d.getMinutes() > JAM_MASUK_STANDAR.minute)
  );
};

export default function AdminDashboardHome() {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [historyRes, employeesRes] = await Promise.all([
          axios.get("/api/history"),
          axios.get("/api/karyawan"),
        ]);
        if (historyRes.data.success) setHistoryData(historyRes.data.data);
        if (employeesRes.data.success) setEmployees(employeesRes.data.data);
      } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (isLoading) {
    return (
      <main className="grow p-8 bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={32} className="animate-spin text-accent" />
          Memuat dashboard...
        </div>
      </main>
    );
  }

  const today = new Date();

  // ================= KALKULASI RINGKASAN =================
  const todayRecords = historyData.filter((row) =>
    row.waktuMasuk ? isSameDay(new Date(row.waktuMasuk), today) : false,
  );

  const hadirUserIdsHariIni = new Set(todayRecords.map((r) => r.userId));
  const totalKaryawan = employees.length;
  const hadirHariIni = hadirUserIdsHariIni.size;
  const belumAbsenHariIni = Math.max(totalKaryawan - hadirHariIni, 0);
  const sedangBekerja = todayRecords.filter(
    (r) => r.waktuKeluar === null || r.waktuKeluar === "-",
  ).length;

  const terlambatHariIni = todayRecords.filter((r) =>
    isTerlambat(r.waktuMasuk),
  ).length;
  const tepatWaktuHariIni = todayRecords.length - terlambatHariIni;

  // ================= TREN 7 HARI TERAKHIR =================
  const trendData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const count = historyData.filter(
      (row) =>
        row.waktuMasuk && isSameDay(new Date(row.waktuMasuk), date),
    ).length;
    return {
      tanggal: date.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      jumlah: count,
    };
  });

  // ================= STATUS HARI INI (DONUT) =================
  const statusHariIniData = [
    { name: "Hadir", value: hadirHariIni },
    { name: "Belum Hadir", value: belumAbsenHariIni },
  ];

  // ================= DISTRIBUSI JAM MASUK (30 HARI) =================
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentRecords = historyData.filter(
    (row) => row.waktuMasuk && new Date(row.waktuMasuk) >= thirtyDaysAgo,
  );

  const jamBuckets = [
    { label: "< 07:00", min: 0, max: 7 },
    { label: "07:00-08:00", min: 7, max: 8 },
    { label: "08:00-09:00", min: 8, max: 9 },
    { label: "09:00-10:00", min: 9, max: 10 },
    { label: "> 10:00", min: 10, max: 24 },
  ];

  const jamMasukData = jamBuckets.map((bucket) => {
    const count = recentRecords.filter((row) => {
      const hour = new Date(row.waktuMasuk).getHours();
      return hour >= bucket.min && hour < bucket.max;
    }).length;
    return { label: bucket.label, jumlah: count };
  });

  // ================= TOP 5 KARYAWAN PALING RAJIN (30 HARI) =================
  const attendanceCountByUser: Record<string, { nama: string; count: number }> = {};
  recentRecords.forEach((row) => {
    const key = String(row.userId);
    const nama = formatTitleCase(row.nama || row.name || "-");
    if (!attendanceCountByUser[key]) {
      attendanceCountByUser[key] = { nama, count: 0 };
    }
    attendanceCountByUser[key].count += 1;
  });

  const topKaryawan = Object.values(attendanceCountByUser)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ================= AKTIVITAS TERBARU =================
  const recentActivity = [...historyData]
    .sort(
      (a, b) => new Date(b.waktuMasuk).getTime() - new Date(a.waktuMasuk).getTime(),
    )
    .slice(0, 5);

  return (
    <main className="grow p-8 overflow-x-auto bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ================= HEADER ================= */}
        <div className="relative overflow-hidden rounded-2xl bg-primary shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-slate-900 opacity-95" />
          <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-secondary/20 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />
          <div className="relative z-10 p-6">
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-1">
              Dashboard
            </p>
            <h3 className="text-2xl font-bold text-white">
              Selamat Datang, Admin!
            </h3>
            <p className="text-white/60 text-sm mt-1">
              Ringkasan kehadiran karyawan CV. Bisnis Pro Komputama hari ini,{" "}
              {today.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              .
            </p>
          </div>
        </div>

        {/* ================= KARTU RINGKASAN ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Karyawan"
            value={totalKaryawan}
            color="text-primary"
            bg="bg-primary/10"
          />
          <StatCard
            icon={UserCheck}
            label="Hadir Hari Ini"
            value={hadirHariIni}
            color="text-green-600"
            bg="bg-green-100"
            sub={`${totalKaryawan > 0 ? Math.round((hadirHariIni / totalKaryawan) * 100) : 0}% dari total`}
          />
          <StatCard
            icon={Clock}
            label="Sedang Bekerja"
            value={sedangBekerja}
            color="text-blue-600"
            bg="bg-blue-100"
          />
          <StatCard
            icon={UserX}
            label="Belum Absen"
            value={belumAbsenHariIni}
            color="text-amber-600"
            bg="bg-amber-100"
          />
        </div>

        {/* ================= GRAFIK: TREN + STATUS HARI INI ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tren 7 Hari */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-accent" />
              <h4 className="font-bold text-slate-800">
                Tren Kehadiran 7 Hari Terakhir
              </h4>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="tanggal"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 13,
                  }}
                />
                <Bar
                  dataKey="jumlah"
                  name="Karyawan Hadir"
                  fill={CHART_COLORS.accent}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Hari Ini */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck size={18} className="text-accent" />
              <h4 className="font-bold text-slate-800">Status Hari Ini</h4>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusHariIniData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  <Cell fill={CHART_COLORS.secondary} />
                  <Cell fill={CHART_COLORS.muted} />
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 13,
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ================= GRAFIK: JAM MASUK + KETEPATAN WAKTU ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlarmClock size={18} className="text-accent" />
              <h4 className="font-bold text-slate-800">
                Distribusi Jam Masuk (30 Hari Terakhir)
              </h4>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={jamMasukData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={90}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 13,
                  }}
                />
                <Bar
                  dataKey="jumlah"
                  name="Jumlah Absen"
                  fill={CHART_COLORS.primary}
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-400 mt-2">
              Acuan jam masuk standar: 08:00
            </p>
          </div>

          {/* Ketepatan Waktu Hari Ini */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-accent" />
              <h4 className="font-bold text-slate-800">
                Ketepatan Waktu Hari Ini
              </h4>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-medium">
                    Tepat Waktu
                  </span>
                  <span className="font-bold text-green-600">
                    {tepatWaktuHariIni}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${
                        todayRecords.length > 0
                          ? (tepatWaktuHariIni / todayRecords.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-medium">
                    Terlambat
                  </span>
                  <span className="font-bold text-red-500">
                    {terlambatHariIni}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{
                      width: `${
                        todayRecords.length > 0
                          ? (terlambatHariIni / todayRecords.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TOP KARYAWAN + AKTIVITAS TERBARU ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top 5 Karyawan Paling Rajin */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-accent" />
              <h4 className="font-bold text-slate-800">
                Top 5 Karyawan Paling Rajin
              </h4>
              <span className="text-xs text-slate-400 ml-auto">30 hari</span>
            </div>
            {topKaryawan.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                Belum ada data.
              </p>
            ) : (
              <div className="space-y-3">
                {topKaryawan.map((emp, index) => (
                  <div key={emp.nama} className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        index === 0
                          ? "bg-amber-100 text-amber-700"
                          : index === 1
                            ? "bg-slate-200 text-slate-600"
                            : index === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-slate-700 flex-1">
                      {emp.nama}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {emp.count}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aktivitas Terbaru */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-accent" />
              <h4 className="font-bold text-slate-800">Aktivitas Terbaru</h4>
            </div>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                Belum ada aktivitas.
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-700">
                        {formatTitleCase(row.nama || row.name)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(row.waktuMasuk).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        row.waktuKeluar === null || row.waktuKeluar === "-"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {row.waktuKeluar === null || row.waktuKeluar === "-"
                        ? "Masuk"
                        : "Selesai"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  sub,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  bg: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}