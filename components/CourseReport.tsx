
import React from 'react';
import { Student } from '../types';
import { YEAR_LABELS, YEAR_SUBJECTS_CONFIG } from '../constants';

interface CourseReportProps {
  students: Student[];
  course: string;
  year: string;
}

export const CourseReport: React.FC<CourseReportProps> = ({ 
  students, 
  course, 
  year
}) => {
  const filteredStudents = students
    .filter(s => s.course === course)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const yearConfig = YEAR_SUBJECTS_CONFIG[year] || {};
  const subjects = Object.keys(yearConfig);

  const getGradeClass = (val: string) => {
    if (!val) return 'text-slate-300';
    const upper = val.toUpperCase();
    if (upper === 'EN CURSO' || upper === 'E/C') return 'text-red-600 font-bold';
    if (['7', '8', '9', '10'].includes(val)) return 'text-emerald-600 font-bold';
    return 'text-slate-600';
  };

  const getPendingSubjects = (student: Student, currentYear: string) => {
    const currentYearNum = parseInt(currentYear);
    const pending: string[] = [];
    
    const getGradeNum = (val: string) => {
      const n = parseInt(val);
      return isNaN(n) ? 0 : n;
    };

    const isEC = (val: string) => {
      const v = val?.toUpperCase();
      return v === 'E/C' || v === 'EN CURSO';
    };

    // Revisamos desde 1° año hasta el año actual seleccionado
    for (let y = 1; y <= currentYearNum; y++) {
      const yearKey = y.toString();
      const yearTrajectory = student.trajectory[yearKey];
      const config = YEAR_SUBJECTS_CONFIG[yearKey];
      
      if (yearTrajectory && config) {
        // REGLA MAESTRA: Si la Nota de Área (Final) es >= 7, el año está aprobado
        const areaData = yearTrajectory['notaArea'];
        const areaFinalGrade = getGradeNum(areaData?.rec);
        
        if (areaFinalGrade >= 7) {
          // El área está aprobada con 7+, no adeuda nada de este año
          continue; 
        }

        // Si el área no está aprobada con 7+, revisamos materias individuales
        Object.entries(config).forEach(([subKey, label]) => {
          // No incluir "Nota de área" como materia adeudada individualmente en el listado
          if (subKey === 'notaArea') return;

          const subData = yearTrajectory[subKey];
          
          // Si el recuperatorio de la materia es >= 7, esa materia individual no se adeuda
          const subRecGrade = getGradeNum(subData?.rec);
          if (subRecGrade >= 7) return;

          const isPending = 
            isEC(subData?.c1) || 
            isEC(subData?.c2) || 
            isEC(subData?.rec) || 
            isEC(subData?.closure?.approved);

          if (isPending) {
            const labelWithYear = y < currentYearNum ? `${label} (${y}°)` : label;
            if (!pending.includes(labelWithYear)) {
              pending.push(labelWithYear);
            }
          }
        });
      }
    }
    return pending;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Resumen de Calificaciones: {course}</h3>
          <p className="text-sm text-slate-500">Visualizando {YEAR_LABELS[parseInt(year) - 1]}</p>
        </div>
        <div className="text-sm font-medium text-slate-400">
          {filteredStudents.length} Estudiantes registrados
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left table-fixed min-w-[1200px]">
          <thead>
            <tr className="bg-slate-100/50 border-b border-slate-200">
              <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-20 w-[250px]">Estudiante / DNI</th>
              {subjects.map(subKey => (
                <th key={subKey} className="p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200 text-center" colSpan={3}>
                  {yearConfig[subKey]}
                </th>
              ))}
              <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200 w-[200px]">Materias que Adeuda</th>
            </tr>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-2 sticky left-0 bg-slate-50 z-20"></th>
              {subjects.map(subKey => (
                <React.Fragment key={`${subKey}-headers`}>
                  <th className="p-1 text-[9px] font-bold text-slate-400 text-center border-l border-slate-100">1°C</th>
                  <th className="p-1 text-[9px] font-bold text-slate-400 text-center">2°C</th>
                  <th className="p-1 text-[9px] font-bold text-slate-400 text-center">{subKey === 'notaArea' ? 'FINAL' : 'REC'}</th>
                </React.Fragment>
              ))}
              <th className="p-1 border-l border-slate-200"></th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={100} className="p-12 text-center text-slate-400 italic">
                  No hay estudiantes registrados en este curso.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, idx) => {
                const yearData = student.trajectory[year] || {};
                const pendingList = getPendingSubjects(student, year);
                const hasDebts = pendingList.length > 0;
                
                return (
                  <tr key={student.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/20 transition-colors border-b border-slate-100`}>
                    <td className="p-4 sticky left-0 bg-inherit z-20 border-r border-slate-100">
                      <div className={`font-bold text-sm truncate ${hasDebts ? 'text-red-600' : 'text-slate-700'}`}>
                        {student.fullName}
                      </div>
                      <div className={`text-[9px] font-medium ${hasDebts ? 'text-red-400' : 'text-slate-400'}`}>
                        DNI: {student.dni}
                      </div>
                    </td>
                    {subjects.map(subKey => {
                      const data = yearData[subKey] || { c1: '', c2: '', rec: '', closure: { approved: '', date: '' } };
                      return (
                        <React.Fragment key={`${student.id}-${subKey}`}>
                          <td className={`p-2 text-center text-xs border-l border-slate-100 ${getGradeClass(data.c1)}`}>{data.c1 || '-'}</td>
                          <td className={`p-2 text-center text-xs ${getGradeClass(data.c2)}`}>{data.c2 || '-'}</td>
                          <td className={`p-2 text-center text-xs ${subKey === 'notaArea' ? 'bg-blue-50/30' : 'bg-slate-50/50'} ${getGradeClass(data.rec)}`}>{data.rec || '-'}</td>
                        </React.Fragment>
                      );
                    })}
                    <td className="p-3 border-l border-slate-100">
                      {hasDebts ? (
                        <div className="flex flex-wrap gap-1">
                          {pendingList.map((item, i) => (
                            <span key={i} className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap">
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">Al día</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-slate-50 text-[10px] text-slate-400 flex flex-wrap gap-x-8 gap-y-2 justify-between">
        <div className="flex gap-4">
          <span>Notas: <strong className="text-red-600 uppercase">E/C</strong> (rojo), <strong className="text-emerald-600">7-10</strong> (verde)</span>
          <span>1°C: 1er Cuatrimestre</span>
          <span>2°C: 2do Cuatrimestre</span>
          <span>REC/FINAL: Recuperatorio o Nota Final de Área</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
          <span className="text-red-500 font-bold uppercase">Nombre en rojo indica materias con "E/C" (sin área aprobada)</span>
        </div>
      </div>
    </div>
  );
};
