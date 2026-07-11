export interface BookSession {
  bookName: string;
  chapters: string;
  startDate: string;
  isActive: boolean;
}

export interface Participant {
  id: string;
  name: string;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  captainId: string;
  members: Participant[];
}

export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  question: string;
  options: QuestionOption[];
}

export interface Score {
  participantId: string;
  teamId: string;
  correct: number;
  incorrect: number;
}

export interface Turn {
  participantId: string;
  teamId: string;
  date: string;
  questionId: string;
  questionText: string;
  answeredCorrectly: boolean;
}

export type DisplayEvent =
  | { type: 'IDLE' }
  | { type: 'SHOW_QUESTION'; participant: Participant; team: Team; question: Question; teams: Team[] }
  | { type: 'REVEAL_ANSWER'; selectedOptionIndex: number; correct: boolean; correctOptionIndex: number }
  | { type: 'UPDATE_SCORES'; scores: Score[] }
  | { type: 'SHOW_FINAL_SCORES'; scores: Score[]; teams: Team[] };

export interface TeamsImport {
  teams: Array<{
    name: string;
    captain: string;
    members: string[];
  }>;
}
