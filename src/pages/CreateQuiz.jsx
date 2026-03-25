import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const generateId = () => crypto.randomUUID();

const CreateQuiz = () => {
  const [title, setTitle] = useState('');
  const [questionsMap, setQuestionsMap] = useState({});
  const [baseSequence, setBaseSequence] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);

  // --- CRUD LOGIC ---
  const addBaseQuestion = () => {
    const newId = generateId();
    setQuestionsMap(prev => ({ 
      ...prev, 
      [newId]: { id: newId, text: '', choices: [] } 
    }));
    setBaseSequence(prev => [...prev, newId]);
  };

  const updateQuestionText = (qId, text) => {
    setQuestionsMap(prev => ({
      ...prev, [qId]: { ...prev[qId], text }
    }));
  };

  const addChoice = (qId) => {
    const choiceId = generateId();
    setQuestionsMap(prev => {
      const q = prev[qId];
      return {
        ...prev,
        [qId]: { ...q, choices: [...q.choices, { id: choiceId, text: '', conditionalQuestionId: null }] }
      };
    });
  };

  const updateChoiceText = (qId, choiceId, text) => {
    setQuestionsMap(prev => {
      const q = prev[qId];
      const updatedChoices = q.choices.map(c => c.id === choiceId ? { ...c, text } : c);
      return { ...prev, [qId]: { ...q, choices: updatedChoices } };
    });
  };

  const addConditionalQuestion = (parentQId, choiceId) => {
    const condId = generateId();
    setQuestionsMap(prev => {
      const newMap = { 
        ...prev, 
        [condId]: { id: condId, text: '', choices: [] } 
      };
      const parent = newMap[parentQId];
      parent.choices = parent.choices.map(c => 
        c.id === choiceId ? { ...c, conditionalQuestionId: condId } : c
      );
      return newMap;
    });
  };

  const handleSaveQuiz = async () => {
    if (!title || baseSequence.length === 0) return alert("Please add a title and at least one question.");
    
    setIsSaving(true);
    const payload = {
      title,
      quiz_data: { questionsMap, baseSequence }
    };

    const { data, error } = await supabase
      .from('quizzes')
      .insert([payload])
      .select();
    
    if (error) {
      console.error("Error saving:", error);
    } else {
      setSavedId(data[0].id);
    }
    setIsSaving(false);
  };

  // --- RENDER HELPERS ---
  const renderQuestionNode = (qId, depth = 0, isPreview = false) => {
    const question = questionsMap[qId];
    if (!question) return null;

    return (
      <div 
        key={qId} 
        className={`relative p-5 rounded-xl border bg-amber-100 transition-all duration-300 ${
          depth > 0 
            ? 'ml-6 md:ml-12 mt-4 border-l-4 border-l-indigo-500 bg-white/50 shadow-sm' 
            : 'mb-8 bg-white shadow-md border-slate-200'
        }`}
      >
        {depth > 0 && (
          <div className="absolute -left-6 top-8 w-6 h-0.5 bg-indigo-500 hidden md:block" />
        )}

        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
            {depth + 1}
          </span>
          {depth > 0 && <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Conditional Branch</span>}
        </div>
        
        {isPreview ? (
          <h3 className="text-lg font-bold text-slate-800 mb-4">{question.text || "(No question text)"}</h3>
        ) : (
          <input
            type="text"
            placeholder="What is your question?"
            value={question.text}
            onChange={(e) => updateQuestionText(qId, e.target.value)}
            className="w-full text-xl font-semibold bg-transparent border-b-2 border-slate-100 focus:border-indigo-500 outline-none pb-2 mb-6 transition-colors"
          />
        )}

        <div className="space-y-3">
          {question.choices.map((choice) => (
            <div key={choice.id} className="group">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-400 transition-colors" />
                {isPreview ? (
                  <p className="text-slate-600 py-1">{choice.text || "(Empty choice)"}</p>
                ) : (
                  <input
                    type="text"
                    placeholder="Option text..."
                    value={choice.text}
                    onChange={(e) => updateChoiceText(qId, choice.id, e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                )}
                
                {!isPreview && !choice.conditionalQuestionId && (
                  <button 
                    onClick={() => addConditionalQuestion(qId, choice.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase"
                  >
                    + Branch
                  </button>
                )}
              </div>

              {choice.conditionalQuestionId && renderQuestionNode(choice.conditionalQuestionId, depth + 1, isPreview)}
            </div>
          ))}
        </div>

        {!isPreview && (
          <button 
            onClick={() => addChoice(qId)}
            className="mt-6 cursor-pointer text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1 uppercase tracking-tighter"
          >
            Add Option
          </button>
        )}
      </div>
    );
  };

  if (savedId) {
    return (
      <div className="max-w-4xl mx-auto p-8 animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-3xl p-10 shadow-2xl border border-slate-100 text-center mb-8">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Quiz Live!</h1>
          <p className="text-slate-500 mb-8">Your adaptive quiz structure has been saved to Supabase.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to={`/takequiz/${savedId}`}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              Test Your Quiz
            </Link>
            <button 
              onClick={() => { setSavedId(null); setTitle(''); setQuestionsMap({}); setBaseSequence([]); }}
              className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Create New
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Structure Review</h2>
          {baseSequence.map(qId => renderQuestionNode(qId, 0, true))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 min-h-screen bg-amber-100">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex-1 w-full">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Quiz Architecture</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-4xl font-black text-slate-900 bg-transparent outline-none w-full placeholder:text-slate-200"
            placeholder="Untitled Quiz..."
          />
        </div>
        <button 
          onClick={handleSaveQuiz}
          disabled={isSaving}
          className="w-full md:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-600 disabled:opacity-30 transition-all shadow-xl shadow-slate-200"
        >
          {isSaving ? 'Deploying...' : 'Save Quiz'}
        </button>
      </header>

      <div className="max-w-3xl">
        {baseSequence.map(qId => renderQuestionNode(qId))}

        <button 
          onClick={addBaseQuestion}
          className="group cursor-pointer w-full py-12 border-2 border-dashed border-black rounded-3xl text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all flex flex-col items-center gap-2"
        >
          <span className="text-2xl group-hover:scale-125 transition-transform">＋</span>
          <span className="font-bold uppercase tracking-widest text-xs text-black">Add Primary Question</span>
        </button>
      </div>
    </div>
  );
};

export default CreateQuiz;