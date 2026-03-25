import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const SubmissionsPage = () => {
  const { id } = useParams();
  
  const [quiz, setQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Fetch the Quiz (Needed to translate IDs into actual Question/Choice text)
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();

      if (quizError) console.error("Error fetching quiz:", quizError);

      // 2. Fetch the Submissions for this specific quiz
      const { data: subData, error: subError } = await supabase
        .from('quizzes_submissions')
        .select('*')
        .eq('quiz_id', id)
        .order('created_at', { ascending: false });

      if (subError) console.error("Error fetching submissions:", subError);

      setQuiz(quizData);
      setSubmissions(subData || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  // --- MODAL RENDER HELPER ---
  const renderModalContent = () => {
    if (!selectedSubmission || !quiz?.quiz_data?.questionsMap) return null;

    const { answers } = selectedSubmission;

    return (
      <div className="space-y-6">
        {Object.entries(answers).map(([questionId, choiceId]) => {
          const question = quiz.quiz_data.questionsMap[questionId];
          if (!question) return null; // Fallback if quiz structure changed

          const choice = question.choices.find(c => c.id === choiceId);

          return (
            <div key={questionId} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <p className="text-sm text-slate-400 mb-2 font-medium">{question.text}</p>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                <p className="text-lg text-white font-semibold">
                  {choice ? choice.text : "Unknown Choice"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans relative">
      <div className="max-w-4xl mx-auto pt-12">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Quiz Responses</h1>
            <p className="text-slate-400">
              Viewing submissions for: <span className="text-indigo-400 font-semibold">{quiz?.title || "Unknown Quiz"}</span>
            </p>
          </div>
          <Link 
            to="/" 
            className="px-6 py-2 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-3xl">
            <p className="text-slate-500 text-lg">No submissions yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {submissions.map((sub, index) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubmission(sub)}
                className="w-full flex items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-indigo-500 hover:bg-slate-800/80 transition-all group text-left"
              >
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {sub.user_nickname || "Anonymous Participant"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">
                      {quiz?.title}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500 hidden sm:block">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </span>
                  <div className="px-4 py-2 rounded-full bg-slate-800 text-xs font-bold text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    View
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MODAL OVERLAY */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedSubmission(null)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur z-10">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedSubmission.user_nickname || "Anonymous Participant"}'s Responses
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Submitted on {new Date(selectedSubmission.created_at).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedSubmission(null)}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {renderModalContent()}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsPage;