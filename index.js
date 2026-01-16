<!DOCTYPE html>
<html lang="ms">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPTP PRO - Persistence Master v15</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        
        body { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            overflow-x: hidden; 
            transition: background-color 0.3s ease;
        }

        /* Skrol Bar Khas */
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; border: 2px solid #f1f1f1; }
        
        @media print {
            .print-hidden { display: none !important; }
            body { background: white !important; color: black !important; }
            .print-card { border: 2px solid #000 !important; box-shadow: none !important; }
        }

        .bg-soft-cream { background-color: #FDFCF0; }
        .bg-pastel-mint { background-color: #F0FDF4; }
        .bg-pastel-lavender { background-color: #FAF5FF; }
        
        /* Animasi Pusingan Sinkronisasi */
        .sync-animation {
            display: inline-block;
            animation: rotate 1s linear infinite;
        }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .task-card {
            transition: all 0.2s ease;
            min-height: 50px;
        }
        .task-card:hover {
            transform: scale(1.02);
            filter: brightness(0.95);
        }

        .u-icon { font-style: normal; font-weight: bold; }
        
        .sticky-col {
            position: sticky;
            left: 0;
            z-index: 40;
        }
    </style>
</head>
<body class="bg-soft-cream text-slate-900">
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useMemo, useEffect, Fragment } = React;

        // Custom Component for Icons (Pure HTML/Unicode)
        const UIcon = ({ type, size = "text-base", className = "" }) => {
            const icons = {
                lock: "🔒", user: "👤", sun: "☀️", moon: "🌙", refresh: "🔄", check: "✅",
                logout: "🚪", calendar: "📅", clock: "🕒", edit: "📝", trash: "🗑️",
                add: "➕", save: "💾", warn: "⚠️", arrow: "⬅️", print: "🖨️", shield: "🛡️",
                info: "ℹ️", checkCircle: "🔘", database: "🗄️"
            };
            return <span className={`u-icon ${size} ${className}`}>{icons[type] || "•"}</span>;
        };

        const App = () => {
            // <!-- Application Structure Plan: Mengatasi kekangan pelayar web dengan menggabungkan LocalStorage (untuk autosave Netlify) dan Eksport CSV (untuk backup fail komputer). Database pemandu kini dinamik untuk membolehkan pertukaran nama disimpan secara kekal. Skrin log masuk menetapkan tema terang sebagai default. -->

            const [view, setView] = useState('login');
            const [isLoggedIn, setIsLoggedIn] = useState(false);
            const [isDarkMode, setIsDarkMode] = useState(false); 
            const [fontSize, setFontSize] = useState('sederhana');
            const [syncStatus, setSyncStatus] = useState('saved'); 
            
            // --- DATABASE: PEMANDU (Loaded from LocalStorage) ---
            const [drivers, setDrivers] = useState(() => {
                const savedDrivers = localStorage.getItem('sptp_v15_drivers');
                return savedDrivers ? JSON.parse(savedDrivers) : [
                    { id: 1, name: 'KP / En Shahrizal' }, { id: 2, name: 'Kereta Ganti PT MTIB' },
                    { id: 3, name: 'Norazuan / TKP P&K' }, { id: 4, name: 'Halim / TKP PO' },
                    { id: 5, name: 'KKJ / Pengerusi - Sadri' }, { id: 6, name: 'M. Aziz' },
                    { id: 7, name: 'Azhar' }, { id: 8, name: 'Muammar' },
                    { id: 9, name: 'Saiful Nizam' }, { id: 10, name: 'Afendi' },
                    { id: 11, name: 'Arizal' }, { id: 12, name: 'Hafiz' },
                    { id: 13, name: 'Firdaus' }, { id: 14, name: 'Pool / UKK/ PKA' },
                    { id: 15, name: 'Pool/ Baiki' }, { id: 16, name: 'Pool (WXB 4736)' },
                    { id: 17, name: 'Pool (HIACE)' }, { id: 18, name: 'MPV/Pool' }
                ];
            });

            // --- DATABASE: TUGASAN (Loaded from LocalStorage) ---
            const [tasks, setTasks] = useState(() => {
                const savedTasks = localStorage.getItem('sptp_v15_tasks');
                return savedTasks ? JSON.parse(savedTasks) : [];
            });

            // Autosave Logic (To Browser Storage)
            useEffect(() => {
                setSyncStatus('syncing');
                const timeout = setTimeout(() => {
                    localStorage.setItem('sptp_v15_drivers', JSON.stringify(drivers));
                    localStorage.setItem('sptp_v15_tasks', JSON.stringify(tasks));
                    setSyncStatus('saved');
                }, 700);
                return () => clearTimeout(timeout);
            }, [tasks, drivers]);

            // Modal States
            const [showActionModal, setShowActionModal] = useState(false);
            const [selectedTask, setSelectedTask] = useState(null);
            const [showTaskFormModal, setShowTaskFormModal] = useState(false);
            const [isEditing, setIsEditing] = useState(false);
            const [showConflictModal, setShowConflictModal] = useState(false);
            const [conflictTask, setConflictTask] = useState(null);

            const [taskForm, setTaskForm] = useState({
                id: null, driverId: null, destination: '', matter: '',
                startDate: '', endDate: '', startTime: '08:00', returnTime: '17:00'
            });

            // Helpers
            const getDayName = (date) => date.toLocaleDateString('ms-MY', { weekday: 'long' });
            const getDatePart = (date) => date.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' });
            const getISODate = (date) => date.toISOString().split('T')[0];
            
            const weekDays = useMemo(() => {
                const now = new Date();
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(now.setDate(diff));
                return Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(monday);
                    d.setDate(monday.getDate() + i);
                    return d;
                });
            }, []);

            const formatTime12h = (t) => {
                if(!t) return '-';
                let [h, m] = t.split(':');
                h = parseInt(h);
                const ampm = h >= 12 ? 'PM' : 'AM';
                h = h % 12 || 12;
                return `${h}:${m}${ampm}`;
            };

            const isTaskOnDate = (task, date) => {
                const dStr = getISODate(date);
                return dStr >= task.startDate && dStr <= task.endDate;
            };

            // Actions
            const openAddForm = (driverId, date) => {
                const dStr = getISODate(date);
                setTaskForm({
                    id: null, driverId, destination: '', matter: '',
                    startDate: dStr, endDate: dStr, startTime: '08:00', returnTime: '17:00'
                });
                setIsEditing(false);
                setShowTaskFormModal(true);
            };

            const handleSave = () => {
                const startNew = `${taskForm.startDate}T${taskForm.startTime}`;
                const endNew = `${taskForm.endDate}T${taskForm.returnTime}`;

                const conflict = tasks.find(ex => {
                    if (ex.id === taskForm.id) return false;
                    if (ex.driverId !== taskForm.driverId) return false;
                    const startEx = `${ex.startDate}T${ex.startTime}`;
                    const endEx = `${ex.endDate}T${ex.returnTime}`;
                    return (startNew < endEx) && (endNew > startEx);
                });

                if (conflict) {
                    setConflictTask(conflict);
                    setShowConflictModal(true);
                    return;
                }

                if (isEditing) {
                    setTasks(tasks.map(t => t.id === taskForm.id ? taskForm : t));
                } else {
                    setTasks([...tasks, { ...taskForm, id: Date.now() }]);
                }
                setShowTaskFormModal(false);
            };

            const exportCSV = () => {
                const header = ["ID", "DriverID", "Destination", "Matter", "StartDate", "EndDate", "StartTime", "ReturnTime"];
                const rows = tasks.map(t => [t.id, t.driverId, `"${t.destination}"`, `"${t.matter}"`, t.startDate, t.endDate, t.startTime, t.returnTime]);
                const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                link.setAttribute("href", URL.createObjectURL(blob));
                link.setAttribute("download", `database_sptp_backup.csv`);
                link.click();
            };

            const handleImport = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const text = event.target.result;
                    const lines = text.split("\n").slice(1);
                    const imported = lines.filter(l => l.trim() !== "").map(line => {
                        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                        return {
                            id: parseInt(cols[0]), driverId: parseInt(cols[1]),
                            destination: cols[2]?.replace(/"/g, ''), matter: cols[3]?.replace(/"/g, ''),
                            startDate: cols[4], endDate: cols[5], startTime: cols[6], returnTime: cols[7]?.trim()
                        };
                    });
                    setTasks(imported);
                };
                reader.readAsText(file);
            };

            // Theme Config
            const fs = { kecil: 'text-[10px]', sederhana: 'text-xs', besar: 'text-sm' }[fontSize];
            const themeContainer = isDarkMode ? 'bg-[#0A0A0A] text-amber-50' : 'bg-soft-cream text-slate-900';

            const Nav = () => (
                <nav className="h-16 bg-slate-950 border-b border-slate-800 flex items-center px-6 justify-between text-white print-hidden sticky top-0 z-50 shadow-2xl">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <span className="font-black text-lg tracking-tighter uppercase leading-none">SPTP <span className="text-[#D4AF37]">PRO</span></span>
                            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-[0.2em]">Sistem Arkib Tugas</span>
                        </div>
                        <div className="flex gap-6">
                            <button onClick={() => setView('dashboard')} className={`text-[10px] font-black uppercase tracking-widest ${view === 'dashboard' ? 'text-[#D4AF37]' : 'text-slate-400'}`}>Utama</button>
                            {isLoggedIn && <button onClick={() => setView('db')} className={`text-[10px] font-black uppercase tracking-widest ${view === 'db' ? 'text-[#D4AF37]' : 'text-slate-400'}`}>Database</button>}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800">
                            <span className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-500 sync-animation' : 'bg-green-500'}`}></span>
                            <span className="text-[9px] font-black uppercase tracking-tighter text-slate-300">
                                {syncStatus === 'syncing' ? 'Syncing...' : 'Autosave Aktif'}
                            </span>
                        </div>
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-2xl hover:bg-slate-700 active:scale-90 transition-all">
                            <UIcon type={isDarkMode ? "sun" : "moon"} size="text-lg" />
                        </button>
                        <button onClick={() => {setIsLoggedIn(false); setView('login')}} className="w-10 h-10 flex items-center justify-center bg-red-900/20 text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                            <UIcon type="logout" size="text-lg" />
                        </button>
                    </div>
                </nav>
            );

            if (view === 'login') {
                return (
                    <div className={`min-h-screen flex items-center justify-center p-6 ${themeContainer}`}>
                        <div className="absolute top-8 right-8">
                             <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 bg-white shadow-xl border-2 border-slate-100 rounded-3xl active:scale-90 transition-all">
                                <UIcon type={isDarkMode ? "sun" : "moon"} size="text-2xl" className="text-slate-900" />
                            </button>
                        </div>
                        <div className={`p-12 rounded-[4rem] shadow-2xl w-full max-w-sm border-4 transition-all ${isDarkMode ? 'bg-slate-900 border-[#D4AF37]' : 'bg-white border-slate-950'}`}>
                            <div className="text-center mb-12">
                                <div className="w-24 h-24 bg-slate-950 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl border-4 border-[#D4AF37]">
                                    <UIcon type="lock" size="text-4xl" className="text-[#D4AF37]" />
                                </div>
                                <h1 className="text-3xl font-black uppercase italic tracking-tighter">Login Portal</h1>
                                <p className="text-[11px] font-bold opacity-30 uppercase tracking-[0.3em] mt-2">Autosave & Persistence Mode</p>
                            </div>
                            <div className="space-y-8">
                                <button onClick={() => setView('dashboard')} className="w-full py-6 bg-slate-950 text-white rounded-3xl font-black uppercase text-sm shadow-xl flex items-center justify-center gap-4 hover:bg-slate-800 transition-all">
                                    <UIcon type="user" size="text-xl" /> Login Pemandu
                                </button>
                                <div className="relative flex items-center gap-4 py-2">
                                    <div className="flex-grow h-px bg-slate-200"></div>
                                    <span className="text-[10px] font-black opacity-20 uppercase tracking-widest">Admin Sahaja</span>
                                    <div className="flex-grow h-px bg-slate-200"></div>
                                </div>
                                <div className="space-y-4">
                                    <input type="text" placeholder="ID Penyelia" className={`w-full p-5 rounded-2xl text-sm border-2 focus:border-[#D4AF37] outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`} />
                                    <input type="password" placeholder="Password" className={`w-full p-5 rounded-2xl text-sm border-2 focus:border-[#D4AF37] outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`} />
                                    <button onClick={() => {setIsLoggedIn(true); setView('dashboard')}} className="w-full py-5 bg-[#D4AF37] text-slate-950 rounded-2xl font-black uppercase text-sm shadow-lg hover:brightness-105 active:scale-95 transition-all">
                                        Masuk Admin
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }

            if (view === 'db') {
                return (
                    <div className={`min-h-screen ${themeContainer}`}>
                        <Nav />
                        <main className="max-w-4xl mx-auto p-12 text-center">
                            <h1 className="text-4xl font-black uppercase italic mb-6">Master Database</h1>
                            <p className="text-sm opacity-60 mb-12 max-w-lg mx-auto">Sistem melakukan autosave pada pelayar. Gunakan butang di bawah untuk penyinkronan fail CSV di komputer anda.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className={`p-12 rounded-[3.5rem] border-2 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-[#D4AF37]/20' : 'bg-white border-slate-200'}`}>
                                    <UIcon type="save" size="text-6xl" className="text-indigo-500 mb-8 block" />
                                    <h2 className="text-2xl font-black mb-4 uppercase">Simpan CSV</h2>
                                    <button onClick={exportCSV} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all">Muat Turun Fail</button>
                                </div>
                                <div className={`p-12 rounded-[3.5rem] border-2 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-[#D4AF37]/20' : 'bg-white border-slate-200'}`}>
                                    <UIcon type="upload" size="text-6xl" className="text-emerald-500 mb-8 block" />
                                    <h2 className="text-2xl font-black mb-4 uppercase">Muat Naik CSV</h2>
                                    <input type="file" accept=".csv" onChange={handleImport} id="csv-load" className="hidden" />
                                    <label htmlFor="csv-load" className="block w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-sm cursor-pointer shadow-xl active:scale-95 transition-all text-center">Pilih Fail</label>
                                </div>
                            </div>
                        </main>
                    </div>
                );
            }

            return (
                <div className={`min-h-screen ${themeContainer}`}>
                    <Nav />
                    <main className="p-4 md:p-8">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-8 print-hidden">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">Jadual Penyelarasan</h1>
                                <p className="text-[11px] font-bold opacity-40 uppercase tracking-[0.4em] mt-4">Transposed Grid View v15</p>
                            </div>
                            <div className="flex items-center gap-6 bg-slate-950/5 p-3 rounded-[2rem] border-2 border-slate-200">
                                <span className="text-[10px] font-black uppercase opacity-40 ml-4">Paparan:</span>
                                <div className="flex gap-2">
                                    {['kecil', 'sederhana', 'besar'].map(s => (
                                        <button key={s} onClick={() => setFontSize(s)} className={`px-6 py-2 text-[10px] font-black uppercase rounded-2xl transition-all ${fontSize === s ? 'bg-slate-950 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-900'}`}>{s}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={`overflow-hidden rounded-[3rem] border-4 transition-all shadow-2xl ${isDarkMode ? 'border-[#D4AF37] bg-slate-900' : 'border-slate-950 bg-white'}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse table-fixed min-w-[3200px]">
                                    <thead>
                                        <tr className={`${isDarkMode ? 'bg-black text-[#D4AF37]' : 'bg-slate-900 text-white'} text-xs font-black uppercase`}>
                                            <th className="p-6 text-left sticky-col bg-inherit border-r-2 border-white/10 w-48 shadow-xl">Hari / Tarikh</th>
                                            {drivers.map(d => (
                                                <th key={d.id} className="p-4 border-l border-white/5 text-center w-[180px]">
                                                    <div className="px-2 truncate">{d.name}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y-2 ${isDarkMode ? 'divide-[#D4AF37]/10' : 'divide-slate-100'}`}>
                                        {weekDays.map(date => (
                                            <tr key={date.toString()} className="group transition-colors">
                                                <td className={`p-6 sticky-col z-30 border-r-2 transition-colors ${isDarkMode ? 'bg-slate-900 border-[#D4AF37]/20 text-amber-200' : 'bg-pastel-lavender border-slate-200 text-slate-950 shadow-lg'}`}>
                                                    <div className="font-black text-sm uppercase leading-none">{getDayName(date).substring(0,3)}</div>
                                                    <div className="text-[10px] font-bold opacity-60 mt-2 uppercase tracking-widest">{getDatePart(date)}</div>
                                                </td>
                                                {drivers.map(d => {
                                                    const dayTasks = tasks.filter(t => t.driverId === d.id && isTaskOnDate(t, date));
                                                    return (
                                                        <td key={d.id} className={`p-2 border-l border-slate-50 align-top h-36 ${isDarkMode ? '' : 'bg-white'}`}>
                                                            <div className="flex flex-col gap-2 h-full">
                                                                {dayTasks.map(t => (
                                                                    <div key={t.id} onClick={() => { setSelectedTask(t); setShowActionModal(true); }} className={`task-card p-3 rounded-2xl border-2 cursor-pointer shadow-sm ${isDarkMode ? 'bg-slate-800 border-[#D4AF37]/40 text-amber-50' : 'bg-white border-slate-400 text-slate-950'}`}>
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <span className={`font-black ${fs} leading-none ${isDarkMode ? 'text-[#D4AF37]' : 'text-indigo-800'}`}>{formatTime12h(t.startTime)}</span>
                                                                            <UIcon type="edit" size="text-[8px]" className="opacity-10" />
                                                                        </div>
                                                                        <div className={`${fs} font-bold uppercase leading-tight line-clamp-2`}>{t.destination}</div>
                                                                    </div>
                                                                ))}
                                                                {isLoggedIn && (
                                                                    <button onClick={() => openAddForm(d.id, date)} className="mt-auto w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex justify-center text-slate-400 hover:text-slate-900 hover:border-slate-500 hover:bg-slate-50 transition-all active:scale-95">
                                                                        <UIcon type="add" size="text-sm" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </main>

                    {/* ACTION MODAL (Pinda/Padam) */}
                    {showActionModal && (
                        <div className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
                            <div className={`w-full max-w-sm p-12 rounded-[4rem] border-4 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-[#D4AF37]' : 'bg-white border-slate-950'}`}>
                                <h2 className="text-2xl font-black uppercase italic text-center mb-8">Urus Tugasan</h2>
                                <div className={`p-8 rounded-[2.5rem] mb-10 text-center border-2 ${isDarkMode ? 'bg-black/20 border-[#D4AF37]/10' : 'bg-slate-50 border-slate-200'}`}>
                                    <p className="text-[10px] uppercase font-black opacity-40 mb-2">Lokasi</p>
                                    <p className="font-black uppercase text-base leading-tight mb-2">{selectedTask?.destination}</p>
                                    <p className="text-xs font-bold text-indigo-600">{formatTime12h(selectedTask?.startTime)} - {formatTime12h(selectedTask?.returnTime)}</p>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <button onClick={() => { setTaskForm({...selectedTask}); setIsEditing(true); setShowActionModal(false); setShowTaskFormModal(true); }} className="w-full py-5 bg-slate-950 text-white rounded-3xl font-black uppercase text-xs flex items-center justify-center gap-4 hover:bg-slate-800 shadow-xl transition-all">
                                        <UIcon type="edit" /> Pinda
                                    </button>
                                    <button onClick={() => { if(window.confirm("Padam?")) { setTasks(tasks.filter(t => t.id !== selectedTask.id)); setShowActionModal(false); } }} className="w-full py-5 bg-red-600 text-white rounded-3xl font-black uppercase text-xs flex items-center justify-center gap-4 hover:bg-red-700 shadow-xl transition-all">
                                        <UIcon type="trash" /> Padam
                                    </button>
                                    <button onClick={() => setShowActionModal(false)} className="w-full py-2 text-[11px] font-black uppercase opacity-30 hover:opacity-100 transition-all mt-4 text-slate-900">Tutup</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TASK FORM MODAL */}
                    {showTaskFormModal && (
                        <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 text-slate-900">
                             <div className={`w-full max-w-md p-12 rounded-[4rem] border-4 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-[#D4AF37]' : 'bg-white border-slate-950'}`}>
                                <div className="flex justify-between items-center mb-10">
                                    <h2 className={`text-3xl font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                                        {isEditing ? 'Pinda Tugas' : 'Daftar Tugas'}
                                    </h2>
                                    <button onClick={() => setShowTaskFormModal(false)} className="w-12 h-12 flex items-center justify-center rounded-3xl hover:bg-slate-100 transition-all">
                                        <UIcon type="x" size="text-2xl" />
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-6 rounded-[2rem] bg-slate-950 text-white border-b-4 border-[#D4AF37]">
                                        <p className="text-[10px] uppercase font-black tracking-widest text-[#D4AF37] mb-2 opacity-60">Pemandu</p>
                                        <p className="font-black uppercase text-base">{drivers.find(d => d.id === taskForm.driverId)?.name}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-slate-900">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase opacity-40 ml-2">Mula</label>
                                            <input type="time" className="w-full p-5 rounded-2xl text-sm border-2 border-slate-200 outline-none font-bold" value={taskForm.startTime} onChange={e => setTaskForm({...taskForm, startTime: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase opacity-40 ml-2">Tamat</label>
                                            <input type="time" className="w-full p-5 rounded-2xl text-sm border-2 border-slate-200 outline-none font-bold" value={taskForm.returnTime} onChange={e => setTaskForm({...taskForm, returnTime: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-slate-900">
                                        <label className="text-[10px] font-black uppercase opacity-40 ml-2">Destinasi</label>
                                        <input type="text" className="w-full p-5 rounded-2xl text-sm border-2 border-slate-200 outline-none uppercase font-black tracking-tight" value={taskForm.destination} placeholder="CTH: PUTRAJAYA" onChange={e => setTaskForm({...taskForm, destination: e.target.value.toUpperCase()})} />
                                    </div>
                                    <div className="space-y-2 text-slate-900">
                                        <label className="text-[10px] font-black uppercase opacity-40 ml-2">Urusan</label>
                                        <input type="text" className="w-full p-5 rounded-2xl text-sm border-2 border-slate-200 outline-none font-bold" value={taskForm.matter} placeholder="Butiran..." onChange={e => setTaskForm({...taskForm, matter: e.target.value})} />
                                    </div>
                                    <button onClick={handleSave} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black uppercase text-sm shadow-2xl flex items-center justify-center gap-4 hover:bg-slate-800 transition-all mt-8 active:scale-95">
                                        <UIcon type="checkCircle" className="text-green-400" /> {isEditing ? 'Sahkan Pindaan' : 'Sahkan & Simpan'}
                                    </button>
                                </div>
                             </div>
                        </div>
                    )}

                    {/* CONFLICT ALERT */}
                    {showConflictModal && (
                        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6 text-white text-center">
                            <div className="bg-slate-900 border-4 border-red-600 p-12 rounded-[4rem] max-w-sm shadow-2xl">
                                <div className="text-red-500 mb-8 animate-pulse text-6xl"><UIcon type="warn" /></div>
                                <h3 className="text-3xl font-black uppercase text-white mb-4 tracking-tighter leading-none">Pertindihan Masa!</h3>
                                <div className="p-8 bg-black/40 rounded-[2.5rem] text-left mb-10 border-2 border-red-900/40">
                                    <p className="text-white font-black text-lg uppercase leading-tight mb-2">📍 {conflictTask?.destination}</p>
                                    <p className="text-[#D4AF37] font-black text-sm tracking-widest">{formatTime12h(conflictTask?.startTime)} - {formatTime12h(conflictTask?.returnTime)}</p>
                                </div>
                                <button onClick={() => setShowConflictModal(false)} className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase text-sm hover:bg-red-700 active:scale-95 transition-all">Tutup & Baiki</button>
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>