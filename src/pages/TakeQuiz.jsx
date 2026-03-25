import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const TakeQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({}); 
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // New states for handling database submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 1. Fetch Quiz Data from Supabase
  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Error fetching quiz:", error);
        return;
      }

      setQuiz(data);
      setLoading(false);
    };

    fetchQuiz();
  }, [id]);

  // 2. THE RECURSIVE ENGINE
  const liveSequence = useMemo(() => {
    if (!quiz || !quiz.quiz_data) return [];
    
    const { baseSequence, questionsMap } = quiz.quiz_data;
    const sequence = [];

    // Loop through the primary track
    for (const qId of baseSequence) {
      let currentInBranchId = qId;

      // While there is a valid question to add...
      while (currentInBranchId) {
        const question = questionsMap[currentInBranchId];
        if (!question) break;

        // Add the question to the live flow
        sequence.push(question);

        // Check if this question is answered
        const selectedChoiceId = answers[currentInBranchId];
        
        if (selectedChoiceId) {
          const choice = question.choices.find(c => c.id === selectedChoiceId);
          
          // If the choice has a conditional, that ID becomes the "next" in this specific branch
          if (choice?.conditionalQuestionId) {
            currentInBranchId = choice.conditionalQuestionId;
            continue; 
          }
        }
        
        // Terminate branch
        currentInBranchId = null;
      }
    }
    return sequence;
  }, [quiz, answers]);

  const currentQuestion = liveSequence[currentIndex];
  const progress = liveSequence.length > 0 ? ((currentIndex + 1) / liveSequence.length) * 100 : 0;

  const handleAnswer = (choiceId) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: choiceId }));
  };

  const handleNext = () => {
    if (currentIndex < liveSequence.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      submitResults();
    }
  };

  // 3. Save to Supabase
  const submitResults = async () => {
    setIsSubmitting(true);
    
    const payload = {
      quiz_id: id,
      answers: answers
    };

    const { error } = await supabase
      .from('quizzes_submissions')
      .insert([payload]);
    
    if (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to save responses. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setIsSubmitted(true); // Trigger the Success UI
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-indigo-500 rounded-full mb-4"></div>
        <p className="text-slate-400 font-medium">Loading Quiz Structure...</p>
      </div>
    </div>
  );

  // 4. Success View (Shown after successful Supabase insert)
  if (isSubmitted) return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
      <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-6 border-2 border-indigo-500">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h1 className="text-4xl font-bold text-white mb-4">Quiz Completed!</h1>
      <p className="text-slate-400 mb-10 text-center max-w-md">
        Your answers have been securely recorded. You can view the aggregated responses using the link below.
      </p>
      
      <Link 
        to={`/${id}/submissions`}
        className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] active:scale-95"
      >
        View Responses
      </Link>
    </div>
  );

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-2xl mx-auto pt-12">
        
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="text-xs uppercase tracking-widest text-slate-500 font-bold">{quiz.title}</h1>
              <p className="text-2xl text-white font-bold mt-1">Question {currentIndex + 1}</p>
            </div>
            <span className="text-xs text-slate-500 font-mono">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-700 ease-in-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Area */}
        <div key={currentQuestion.id} className="animate-in fade-in slide-in-from-bottom-6 duration-500">
          <h2 className="text-3xl font-medium mb-10 text-white leading-snug">
            {currentQuestion.text}
          </h2>

          <div className="grid gap-4">
            {currentQuestion.choices.map((choice) => {
              const isSelected = answers[currentQuestion.id] === choice.id;
              return (
                <button
                  key={choice.id}
                  onClick={() => handleAnswer(choice.id)}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 ${
                    isSelected 
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg' 
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="text-lg">{choice.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-16 flex justify-between items-center">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0 || isSubmitting}
            className="px-6 py-2 text-slate-500 hover:text-white disabled:opacity-0 transition-all font-medium uppercase tracking-widest text-xs"
          >
            Previous
          </button>
          
          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion.id] || isSubmitting}
            className="px-10 py-4 bg-white text-black font-black rounded-2xl hover:bg-indigo-400 transition-all disabled:opacity-10 active:scale-95 shadow-xl flex items-center justify-center min-w-[200px]"
          >
            {isSubmitting ? (
               <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : currentIndex === liveSequence.length - 1 ? (
              'COMPLETE QUIZ'
            ) : (
              'CONTINUE'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default TakeQuiz;