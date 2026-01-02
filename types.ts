
export interface Closure {
  date: string;
  approved: string;
}

export interface SubjectData {
  c1: string;
  c2: string;
  rec: string;
  closure: Closure;
}

export interface YearTrajectory {
  [subjectKey: string]: SubjectData;
}

export interface Student {
  id: string;
  dni: string;
  fullName: string;
  course: string;
  shift: string;
  trajectory: {
    [year: string]: YearTrajectory; // '1', '2', '3', '4', '5'
  };
}

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  role: MessageRole;
  content: string;
}
