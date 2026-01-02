
import React from 'react';
import { Student, SubjectData } from '../types';
import { YEAR_LABELS, YEAR_SUBJECTS_CONFIG } from '../constants';

interface TrajectoryGridProps {
  student: Student;
  onUpdateSubject: (year: string, subjectKey: string, data: SubjectData) => void;
}

const SubjectCell: React.FC<{
  label: string;
  data: SubjectData;
  onChange: (newData: SubjectData) => void;
  isAreaNote?: boolean;
}> = ({ label, data, onChange, isAreaNote }) => {
  const getGradeStyle = (val: string) => {
    const upper = val.toUpperCase();
    if (upper === 'EN CURSO' || upper === 'E/C') return 'text-red-600 font-bold';
    if (['7', '8', '9', '10'].includes(val)) return 'text-emerald-600 font-bold';
    return 'text-slate-700';
  };

  const GradeSelect = ({ value, label, onValueChange, className = "" }: { value: string, label: string, onValueChange: (val: string) => void, className?: string }) => (
    <div className={className}>
      <div className="text-[9px] text-slate-400 font-bold mb-1">{label}</div>
      <select 
        className={`w-full h-7 text-center text-sm border-none rounded-lg focus:ring-2 focus:ring-blue-400 outline-none cursor-pointer appearance-none bg-transparent ${getGradeStyle(value)}`}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        <option value="">-</option>
        <option value="E/C">E/C</option>
        <option value="7">7</option>
        <option value="8">8</option>
        <option value="9">9</option>
        <option value="10">10</option>
      </select>
    </div>
  );

  return (
    <div className={`border rounded-xl p-3 shadow-sm flex flex-col h-full group transition-all ${isAreaNote ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100 ring-offset-1' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
      <div className={`text-[10px] font-black uppercase tracking-wider mb-2 border-b pb-1 ${isAreaNote ? 'text-blue-700 border-blue-200' : 'text-slate-500 border-slate-100'}`}>
        {label}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center flex-1 items-center">
        <GradeSelect 
          label="1°C" 
          value={data.c1} 
          onValueChange={(val) => onChange({ ...data, c1: val })}
          className={isAreaNote ? 'bg-white rounded-lg' : 'bg-slate-50 rounded-lg'}
        />
        <GradeSelect 
          label="2°C" 
          value={data.c2} 
          onValueChange={(val) => onChange({ ...data, c2: val })}
          className={isAreaNote ? 'bg-white rounded-lg' : 'bg-slate-50 rounded-lg'}
        />
        <div className={`${isAreaNote ? 'bg-blue-100/50' : 'bg-slate-100'} rounded-lg p-0.5 border border-transparent`}>
          <GradeSelect 
            label={isAreaNote ? 'FINAL' : 'REC'} 
            value={data.rec} 
            onValueChange={(val) => onChange({ ...data, rec: val })}
          />
        </div>
      </div>
    </div>
  );
};

export const TrajectoryGrid: React.FC<TrajectoryGridProps> = ({ student, onUpdateSubject }) => {
  const years = ['1', '2', '3', '4', '5'];

  return (
    <div className="flex flex-col gap-10">
      {years.map((yearKey, idx) => {
        const yearConfig = YEAR_SUBJECTS_CONFIG[yearKey];
        const yearData = student.trajectory[yearKey] || {};
        
        return (
          <div key={yearKey} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <span className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-blue-100">
                {idx + 1}
              </span>
              {YEAR_LABELS[idx]}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {Object.entries(yearConfig).map(([subKey, label]) => (
                <SubjectCell
                  key={subKey}
                  label={label}
                  data={yearData[subKey] || { c1: '', c2: '', rec: '', closure: { approved: '', date: '' } }}
                  onChange={(newData) => onUpdateSubject(yearKey, subKey, newData)}
                  isAreaNote={subKey === 'notaArea'}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
