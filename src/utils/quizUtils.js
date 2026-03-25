// A simple ID generator
export const generateId = () => crypto.randomUUID();

// ==========================================
// 1. CREATION UTILS (For building the quiz)
// ==========================================

/**
 * Creates a new standard question.
 */
export const createQuestion = (text, choiceTexts = []) => {
  return {
    id: generateId(),
    text,
    choices: choiceTexts.map(text => ({
      id: generateId(),
      text,
      conditionalQuestionId: null // This is the trigger hook
    }))
  };
};

/**
 * Links a conditional question to a specific choice.
 * Returns updated question data to be saved in your state.
 */
export const attachConditionalToChoice = (parentQuestion, choiceId, conditionalQuestion) => {
  const updatedChoices = parentQuestion.choices.map(choice => {
    if (choice.id === choiceId) {
      return { ...choice, conditionalQuestionId: conditionalQuestion.id };
    }
    return choice;
  });

  return { ...parentQuestion, choices: updatedChoices };
};


// ==========================================
// 2. RUNTIME UTILS (For the live quiz flow)
// ==========================================

/**
 * Computes the dynamic sequence of questions.
 * This automatically "splices" conditionals in and cleans them up 
 * if the user changes their previous answer.
 */
export const computeLiveFlow = (baseSequence, questionsMap, answers) => {
  const liveSequence = [];

  for (const qId of baseSequence) {
    const currentQuestion = questionsMap[qId];
    
    if (!currentQuestion) continue;
    
    // 1. Always add the base question to the flow
    liveSequence.push(currentQuestion);

    // 2. Check if the user has answered this base question
    const userAnswerId = answers[qId];
    if (userAnswerId) {
      const selectedChoice = currentQuestion.choices.find(c => c.id === userAnswerId);
      
      // 3. If the chosen answer has a conditional, append it immediately!
      if (selectedChoice && selectedChoice.conditionalQuestionId) {
        const conditionalQ = questionsMap[selectedChoice.conditionalQuestionId];
        if (conditionalQ) {
            liveSequence.push(conditionalQ);
            
            // Note: If you want deeply nested conditionals (a conditional that 
            // triggers another conditional), you would make this a recursive check.
        }
      }
    }
  }

  return liveSequence; // Returns the dynamically spliced array of question objects
};