
import { GoogleGenAI, Type } from "@google/genai";
import { Student } from "../types";
import { YEAR_SUBJECTS_CONFIG } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Actúas como un experto desarrollador de aplicaciones de gestión escolar. 
Tu objetivo es procesar las peticiones del usuario para actualizar objetos JSON de "Fichas de Trayectoria Estudiantil".

ESTRUCTURA DE NOTAS:
Cada materia tiene:
- c1: Nota 1er Cuatrimestre.
- c2: Nota 2do Cuatrimestre.
- rec: Recuperatorio general.

REGLAS DE PROCESAMIENTO:
1. "E/C" significa que la materia está pendiente (En Curso). Úsalo si el usuario menciona que adeuda, está cursando o rindiendo.
2. "Nota Final" o "Nota de Área" se refiere a la clave 'notaArea'.
3. El campo 'approved' dentro de 'closure' es un string. 
   - Usa "SI" si el usuario indica que aprobó.
   - Usa "E/C" si el usuario menciona que está cursando o pendiente.
   - Usa "" (cadena vacía) si no hay información.
4. Devuelve SIEMPRE el objeto JSON completo del estudiante.
5. No añadas texto fuera del JSON.
`;

export const processCommand = async (command: string, currentStudent: Student | null): Promise<Student | null> => {
  try {
    const prompt = `
Contexto actual del estudiante: ${JSON.stringify(currentStudent || {})}
Comando del usuario: "${command}"
Configuración de materias válida: ${JSON.stringify(YEAR_SUBJECTS_CONFIG)}

Actualiza el JSON siguiendo las reglas. Si no hay notas previas, crea los campos c1, c2, rec según corresponda. Usa preferentemente "E/C" para materias pendientes.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text?.trim() || '{}');
    return result as Student;
  } catch (error) {
    console.error("Error processing command with Gemini:", error);
    return null;
  }
};
