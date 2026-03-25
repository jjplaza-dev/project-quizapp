export const initialQuizState = {
  questionsMap: {},       // Holds ALL questions (base and conditionals) by ID
  baseSequence: [],       // Array of IDs for the default linear flow (e.g., ['q1', 'q2', 'q3'])
  answers: {}             // User's answers: { questionId: choiceId }
};