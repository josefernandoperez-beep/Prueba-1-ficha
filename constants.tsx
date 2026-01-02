
import { SubjectData, YearTrajectory } from './types';

export const EMPTY_SUBJECT: SubjectData = {
  c1: '',
  c2: '',
  rec: '',
  closure: { date: '', approved: '' }
};

export const YEAR_SUBJECTS_CONFIG: { [year: string]: { [subjectKey: string]: string } } = {
  '1': { 
    historia: 'HISTORIA', 
    geografia: 'GEOGRAFÍA', 
    tfpyc: 'T.F.P.yC.', 
    tcs: 'T.C.S.',
    notaArea: 'NOTA DE ÁREA'
  },
  '2': { 
    historia: 'HISTORIA', 
    geografia: 'GEOGRAFÍA', 
    tfpyc: 'T.F.P.yC.', 
    teys: 'T.E.yS.',
    notaArea: 'NOTA DE ÁREA'
  },
  '3': { 
    historia: 'HISTORIA', 
    geografia: 'GEOGRAFÍA', 
    eicsyh: 'E.I.C.S.yH.',
    notaArea: 'NOTA DE ÁREA'
  },
  '4': { 
    historia: 'HISTORIA', 
    geografia: 'GEOGRAFÍA', 
    eicsyh: 'E.I.C.S.yH.',
    notaArea: 'NOTA DE ÁREA'
  },
  '5': { 
    eicsyh: 'E.I.C.S.yH.',
    notaArea: 'NOTA DE ÁREA'
  }
};

export const getInitialTrajectory = () => {
  const trajectory: { [year: string]: YearTrajectory } = {};
  Object.keys(YEAR_SUBJECTS_CONFIG).forEach(year => {
    trajectory[year] = {};
    Object.keys(YEAR_SUBJECTS_CONFIG[year]).forEach(subKey => {
      trajectory[year][subKey] = JSON.parse(JSON.stringify(EMPTY_SUBJECT));
    });
  });
  return trajectory;
};

export const YEAR_LABELS = ['1° Año', '2° Año', '3° Año', '4° Año', '5° Año'];
