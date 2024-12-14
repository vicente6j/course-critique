export interface CourseProfessorInfo {
  course: Course;
  professor: Professor;
  averageGpa: number;
  A: number;
  B: number;
  C: number;
  D: number;
  F: number;
  W: number;
}

export interface Course {
  courseName: string;
  averageGpa: number;
}

export interface Professor {
  professorName: string;
  professorGtUsername: string;
  workingStatus: "retired" | "active" | "break";
}