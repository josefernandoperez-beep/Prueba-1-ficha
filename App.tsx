
import React, { useState, useEffect, useMemo } from 'react';
import { Student, SubjectData } from './types';
import { getInitialTrajectory } from './constants';
import { TrajectoryGrid } from './components/TrajectoryGrid';
import { CourseReport } from './components/CourseReport';
import { processCommand } from './services/geminiService';
import { 
  Search, 
  UserPlus, 
  MessageSquare, 
  Users,
  ChevronRight,
  Loader2,
  Sparkles,
  LayoutGrid,
  ClipboardList,
  AlertCircle,
  FileSpreadsheet,
  Upload,
  Trash2,
  X,
  FileText,
  Save,
  Edit2,
  Check,
  ChevronDown,
  CloudUpload
} from 'lucide-react';

type ViewMode = 'individual' | 'course';

const STORAGE_KEY = 'escolar_db_v1';

const App: React.FC = () => {
  // Inicializar estado desde localStorage o con array vacío
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error cargando datos de localStorage", e);
        return [];
      }
    }
    return [];
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [command, setCommand] = useState('');
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [lastSaved, setLastSaved] = useState<number>(Date.now());
  
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedYearForReport, setSelectedYearForReport] = useState<string>('1');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importCourseFull, setImportCourseFull] = useState('');

  // Efecto para persistir cambios automáticamente
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    setLastSaved(Date.now());
  }, [students]);

  // Cargar dummy data solo si no hay nada guardado
  useEffect(() => {
    if (students.length === 0) {
      const dummyStudent: Student = {
        id: '1',
        dni: '50.828.593',
        fullName: 'MANQUILLAN ARÒM IGNACIO',
        course: '1°2° - T.T.',
        shift: '',
        trajectory: getInitialTrajectory()
      };
      setStudents([dummyStudent]);
      setSelectedStudentId('1');
      setSelectedCourse('1°2° - T.T.');
    }
  }, []);

  const courseOptions = useMemo(() => {
    const years = [1, 2, 3, 4, 5];
    const divisions = [1, 2, 3];
    const shifts = ['T.M.', 'T.T.'];
    const options: string[] = [];
    
    years.forEach(y => {
      divisions.forEach(d => {
        shifts.forEach(s => {
          options.push(`${y}°${d}° - ${s}`);
        });
      });
    });
    return options;
  }, []);

  const selectedStudent = students.find(s => s.id === selectedStudentId) || null;

  const filteredStudents = useMemo(() => {
    return students
      .filter(s => 
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.dni.includes(searchQuery)
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [students, searchQuery]);

  const handleUpdateStudentSubject = (studentId: string, year: string, subjectKey: string, data: SubjectData) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          trajectory: { ...s.trajectory, [year]: { ...s.trajectory[year], [subjectKey]: data } }
        };
      }
      return s;
    }));
  };

  const handleUpdateHeaderField = (studentId: string, field: keyof Student, value: string) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, [field]: value } : s
    ));
  };

  const deleteStudent = (id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm(`¿Está seguro de que desea eliminar permanentemente la ficha de "${name}"?\n\nEsta acción no se puede deshacer.`);
    if (confirmed) {
      setStudents(prev => prev.filter(s => s.id !== id));
      if (selectedStudentId === id) setSelectedStudentId(null);
    }
  };

  const handleCourseSelect = (course: string) => {
    setSelectedCourse(course);
    const match = course.match(/(\d)/);
    if (match) {
      setSelectedYearForReport(match[1]);
    }
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    setIsProcessing(true);
    const updatedStudent = await processCommand(command, selectedStudent);
    if (updatedStudent) {
      setStudents(prev => {
        const exists = prev.find(s => s.dni === updatedStudent.dni || s.id === updatedStudent.id);
        if (exists) return prev.map(s => (s.dni === updatedStudent.dni || s.id === updatedStudent.id) ? { ...updatedStudent, id: s.id } : s);
        return [...prev, { ...updatedStudent, id: Date.now().toString() }];
      });
      setCommand('');
    }
    setIsProcessing(false);
  };

  const createNewStudent = () => {
    const newId = Date.now().toString();
    const newStudent: Student = {
      id: newId,
      dni: '',
      fullName: 'NUEVO ESTUDIANTE',
      course: selectedCourse || '1°1° - T.M.',
      shift: '',
      trajectory: getInitialTrajectory()
    };
    setStudents(prev => [...prev, newStudent]);
    setSelectedStudentId(newId);
    setViewMode('individual');
    setIsEditingHeader(true);
  };

  const handleBulkImport = () => {
    const lines = importText.split('\n').filter(line => line.trim() !== '');
    const newStudents: Student[] = lines.map((line, index) => {
      const parts = line.trim().split(/\s+/);
      const dni = parts[0] || '';
      const fullName = parts.slice(1).join(' ') || 'ESTUDIANTE SIN NOMBRE';
      return {
        id: (Date.now() + index).toString(),
        dni,
        fullName: fullName.toUpperCase(),
        course: importCourseFull || '1°1° - T.M.',
        shift: '',
        trajectory: getInitialTrajectory()
      };
    });
    if (newStudents.length > 0) {
      setStudents(prev => [...prev, ...newStudents]);
      if (newStudents.length === 1) setSelectedStudentId(newStudents[0].id);
    }
    setImportText('');
    setIsImportModalOpen(false);
  };

  const availableCourses = Array.from(new Set(students.map(s => s.course).filter(Boolean))).sort();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Users className="text-white" size={20} />
            </div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">Archivo Trayectoria</h1>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
            <button onClick={() => setViewMode('individual')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'individual' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><LayoutGrid size={14} /> Fichas</button>
            <button onClick={() => setViewMode('course')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'course' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><ClipboardList size={14} /> Planilla</button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Buscar alumno..." className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {viewMode === 'individual' ? (
            filteredStudents.length > 0 ? (
              filteredStudents.map(s => (
                <div key={s.id} className="relative group">
                  <button onClick={() => { setSelectedStudentId(s.id); setIsEditingHeader(false); }} className={`w-full text-left p-4 rounded-xl transition-all border ${selectedStudentId === s.id ? 'bg-blue-50 border-blue-100 shadow-sm' : 'hover:bg-slate-50 border-transparent'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded truncate max-w-[150px] ${selectedStudentId === s.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{s.course || 'S/C'}</span>
                      <ChevronRight size={14} className={selectedStudentId === s.id ? 'text-blue-500' : 'text-slate-300'} />
                    </div>
                    <p className={`font-bold text-sm truncate pr-6 ${selectedStudentId === s.id ? 'text-blue-900' : 'text-slate-700'}`}>{s.fullName}</p>
                    <p className="text-xs text-slate-400">DNI: {s.dni}</p>
                  </button>
                  <button onClick={(e) => deleteStudent(s.id, s.fullName, e)} className="absolute right-3 bottom-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 px-4">
                <p className="text-slate-400 text-sm italic">No se encontraron resultados.</p>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Seleccionar Curso</label>
              <div className="space-y-2">
                {availableCourses.length > 0 ? (
                  availableCourses.map(course => (
                    <button 
                      key={course} 
                      onClick={() => handleCourseSelect(course)} 
                      className={`w-full text-left py-3 px-4 rounded-xl text-sm font-bold border transition-all ${selectedCourse === course ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                    >
                      {course}
                    </button>
                  ))
                ) : (
                  <p className="px-2 text-xs text-slate-400">No hay cursos registrados.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <button onClick={createNewStudent} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors font-semibold shadow-lg shadow-slate-200"><UserPlus size={18} /> Nueva Ficha</button>
          <button onClick={() => setIsImportModalOpen(true)} className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium text-xs"><FileSpreadsheet size={16} /> Importar Lista</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {viewMode === 'individual' ? (
          selectedStudent ? (
            <>
              <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 p-6 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <FileText size={12} />
                      <span>FICHA DE TRAYECTORIA ESTUDIANTIL</span>
                      <span className="mx-2 text-slate-200">|</span>
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        GUARDADO AUTOMÁTICO
                      </div>
                    </div>
                    {isEditingHeader ? (
                      <div className="space-y-3 mt-2">
                        <input className="text-3xl font-black text-slate-900 tracking-tight w-full bg-blue-50 border-b-2 border-blue-400 outline-none py-1 rounded px-2" value={selectedStudent.fullName} onChange={(e) => handleUpdateHeaderField(selectedStudent.id, 'fullName', e.target.value)} placeholder="Nombre Completo" autoFocus />
                        <div className="flex flex-wrap gap-3">
                          <input className="bg-slate-100 text-sm font-bold text-slate-700 outline-none px-3 py-1 rounded-full border border-slate-200 w-28" value={selectedStudent.dni} onChange={(e) => handleUpdateHeaderField(selectedStudent.id, 'dni', e.target.value)} placeholder="DNI" />
                          <select 
                            className="bg-blue-50 text-sm font-bold text-blue-700 outline-none px-3 py-1 rounded-full border border-blue-200"
                            value={selectedStudent.course}
                            onChange={(e) => handleUpdateHeaderField(selectedStudent.id, 'course', e.target.value)}
                          >
                            <option value="">Seleccionar Curso</option>
                            {courseOptions.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedStudent.fullName}</h2>
                          <button onClick={() => setIsEditingHeader(true)} className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">DNI: <strong>{selectedStudent.dni || '---'}</strong></span>
                          <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-bold">{selectedStudent.course || 'S/C'}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 self-end md:self-auto items-center">
                    <div className="text-[10px] text-slate-400 mr-2 font-mono hidden lg:block">
                      Guardado: {new Date(lastSaved).toLocaleTimeString()}
                    </div>
                    {isEditingHeader ? (
                      <button onClick={() => setIsEditingHeader(false)} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200 font-bold text-sm"><Check size={16} /> Finalizar</button>
                    ) : (
                      <button onClick={() => deleteStudent(selectedStudent.id, selectedStudent.fullName)} className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors shadow-sm font-medium text-sm"><Trash2 size={16} /> Eliminar Ficha</button>
                    )}
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 font-medium text-sm">Exportar PDF</button>
                  </div>
                </div>
              </header>

              <div className="max-w-6xl mx-auto w-full p-8 pb-32">
                <TrajectoryGrid student={selectedStudent} onUpdateSubject={(yr, sub, data) => handleUpdateStudentSubject(selectedStudent.id, yr, sub, data)} />
              </div>

              {/* Command Bar */}
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-30">
                <form onSubmit={handleCommandSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 flex items-center gap-2 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                  <div className="flex-1 flex items-center gap-3 pl-4">
                    {isProcessing ? <Loader2 className="animate-spin text-blue-500" size={20} /> : <Sparkles className="text-blue-500" size={20} />}
                    <input type="text" placeholder='IA: "Ponle E/C en Historia de 1er año"...' className="w-full py-3 outline-none text-slate-700 text-sm placeholder:text-slate-400" value={command} onChange={(e) => setCommand(e.target.value)} disabled={isProcessing} />
                  </div>
                  <button type="submit" disabled={isProcessing || !command.trim()} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:bg-slate-200 transition-colors shadow-lg shadow-blue-100"><MessageSquare size={20} /></button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Users size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Seleccione un alumno del panel lateral</p>
              <p className="text-xs mt-2 text-slate-300">Todos los cambios se guardan automáticamente en este navegador</p>
            </div>
          )
        ) : (
          <div className="p-8 max-w-[98%] mx-auto w-full">
            <header className="mb-8 flex justify-between items-start">
               <div>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3"><ClipboardList className="text-blue-600" /> Planilla Consolidada</h2>
                 <p className="text-slate-500 text-sm mt-1 font-medium">Reporte automático del año lectivo correspondiente al curso.</p>
               </div>
            </header>
            
            {selectedCourse ? (
              <CourseReport students={students} course={selectedCourse} year={selectedYearForReport} />
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <Users size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 italic">Seleccione un curso en la barra lateral para ver el reporte consolidado</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsImportModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Upload className="text-blue-600" size={20} /> 
                Importar Alumnos
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Curso y Turno de Destino</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-sm font-bold text-blue-700 bg-blue-50 outline-none appearance-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={importCourseFull}
                    onChange={(e) => setImportCourseFull(e.target.value)}
                  >
                    <option value="">Seleccionar curso y turno...</option>
                    {courseOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={18} />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Listado de Estudiantes</label>
                <textarea 
                  className="w-full h-48 p-4 text-sm font-mono border border-slate-200 rounded-xl outline-none resize-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  placeholder="DNI Nombre Completo (Uno por línea)...&#10;Ejemplo:&#10;12345678 PEREZ JUAN ALBERTO" 
                  value={importText} 
                  onChange={(e) => setImportText(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button 
                onClick={handleBulkImport} 
                disabled={!importText.trim() || !importCourseFull}
                className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none transition-all shadow-lg shadow-blue-100"
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
