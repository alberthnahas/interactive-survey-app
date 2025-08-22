import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    onSnapshot, 
    updateDoc, 
    arrayUnion, 
    getDoc,
    collection,
    query,
    where,
    limit,
    getDocs
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- Helper Functions & Configuration ---

// Your Firebase configuration is now directly used.
const firebaseConfig = {
    apiKey: "AIzaSyB7REh2ZdA3_tA0HuR-GPTG4CCG9-qp4ao",
    authDomain: "interactive-survey-app.firebaseapp.com",
    projectId: "interactive-survey-app",
    storageBucket: "interactive-survey-app.appspot.com",
    messagingSenderId: "862127120915",
    appId: "1:862127120915:web:9f673dd1df9f19ab8695e6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- SVG Icons ---
const CreateIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> );
const JoinIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg> );
const BarChartIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg> );
const CopyIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> );
const CloudIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg> );
const MessageSquareIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> );

// --- Components ---

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
    </div>
);

const ResultsChart = ({ options }) => {
    const totalVotes = useMemo(() => options.reduce((sum, option) => sum + option.votes, 0), [options]);
    const chartColors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-teal-500'];
    return (
        <div className="w-full space-y-4 p-4 md:p-6 bg-slate-800 rounded-lg">
            <div className="flex justify-between items-center text-slate-300">
                <h3 className="text-lg font-semibold">Live Results</h3>
                <span className="text-sm font-medium">{totalVotes} Total Votes</span>
            </div>
            <div className="space-y-3">
                {options.map((option, index) => {
                    const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                    return (
                        <div key={index} className="w-full">
                            <div className="flex justify-between items-center mb-1 text-sm text-slate-200">
                                <span>{option.text}</span>
                                <span className="font-bold">{option.votes}</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-6 overflow-hidden">
                                <div className={`${chartColors[index % chartColors.length]} h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-bold transition-all duration-500 ease-out`} style={{ width: `${percentage}%` }}>
                                    {percentage > 10 && `${percentage.toFixed(0)}%`}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const WordCloudChart = ({ words }) => {
    const sortedWords = useMemo(() => {
        if (!words || words.length === 0) return [];
        const maxVotes = Math.max(...words.map(w => w.votes), 1);
        return [...words]
            .sort((a, b) => b.votes - a.votes)
            .map(word => ({
                ...word,
                size: 1 + (word.votes / maxVotes) * 3,
            }));
    }, [words]);

    const colors = ['text-indigo-300', 'text-purple-300', 'text-pink-300', 'text-teal-300', 'text-green-300', 'text-yellow-300'];

    return (
        <div className="w-full p-4 md:p-6 bg-slate-800 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-300 mb-4">Word Cloud</h3>
            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 min-h-[200px]">
                {sortedWords.length > 0 ? sortedWords.map((word, index) => (
                    <span key={index} className={`${colors[index % colors.length]} transition-all duration-300`} style={{ fontSize: `${word.size}rem`, fontWeight: 600 }}>
                        {word.text}
                    </span>
                )) : <p className="text-slate-500">Waiting for responses...</p>}
            </div>
        </div>
    );
};

const OpenEndedResults = ({ responses }) => {
    return (
        <div className="w-full p-4 md:p-6 bg-slate-800 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-300 mb-4">Responses</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {responses && responses.length > 0 ? (
                    responses.slice().reverse().map((response, index) => (
                        <div key={index} className="bg-slate-700 p-3 rounded-md text-slate-200">
                            {response}
                        </div>
                    ))
                ) : <p className="text-slate-500 text-center py-8">Waiting for responses...</p>}
            </div>
        </div>
    );
};

const CreateSurvey = ({ setView, setSurveyId }) => {
    const [title, setTitle] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [surveyType, setSurveyType] = useState('multiple-choice');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => { if (options.length < 8) setOptions([...options, '']); };
    const removeOption = (index) => { if (options.length > 2) setOptions(options.filter((_, i) => i !== index)); };

    const generateSurveyId = async () => {
        const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
        let id = '';
        for (let i = 0; i < 6; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
        const docSnap = await getDoc(doc(db, "surveys", id));
        return docSnap.exists() ? generateSurveyId() : id;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!title.trim() || (surveyType === 'multiple-choice' && options.some(opt => !opt.trim()))) {
            setError('Please fill out the title and all option fields.');
            return;
        }

        setIsLoading(true);
        try {
            const newSurveyId = await generateSurveyId();
            let surveyData = {
                title,
                type: surveyType,
                createdAt: new Date(),
                participants: [],
            };

            if (surveyType === 'multiple-choice') {
                surveyData.options = options.map(opt => ({ text: opt, votes: 0 }));
            } else if (surveyType === 'word-cloud') {
                surveyData.words = [];
            } else if (surveyType === 'open-ended') {
                surveyData.responses = [];
            }
            
            await setDoc(doc(db, "surveys", newSurveyId), surveyData);
            setSurveyId(newSurveyId);
            setView('presenter');
        } catch (err) {
            console.error("Error creating survey:", err);
            setError('Failed to create survey. Please try again.');
            setIsLoading(false);
        }
    };

    const QuestionTypeButton = ({ type, label, icon }) => (
        <button type="button" onClick={() => setSurveyType(type)} className={`flex-1 p-3 rounded-md text-sm font-semibold flex flex-col items-center gap-2 transition-colors ${surveyType === type ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            {icon}
            {label}
        </button>
    );

    return (
        <div className="w-full max-w-lg mx-auto">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Create a New Survey</h2>
                {error && <p className="bg-red-500/20 text-red-300 p-3 rounded-md mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Question Type</label>
                        <div className="flex gap-2">
                            <QuestionTypeButton type="multiple-choice" label="Multiple Choice" icon={<BarChartIcon />} />
                            <QuestionTypeButton type="word-cloud" label="Word Cloud" icon={<CloudIcon />} />
                            <QuestionTypeButton type="open-ended" label="Open-Ended" icon={<MessageSquareIcon />} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">Your Question</label>
                        <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., What's our top priority for Q3?" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    </div>
                    {surveyType === 'multiple-choice' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Options</label>
                            <div className="space-y-3">
                                {options.map((option, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} placeholder={`Option ${index + 1}`} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 outline-none" required />
                                        {options.length > 2 && (<button type="button" onClick={() => removeOption(index)} className="p-2 text-slate-400 hover:text-red-400"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>)}
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addOption} disabled={options.length >= 8} className="text-sm text-indigo-400 hover:text-indigo-300 mt-3 disabled:opacity-50">+ Add Option</button>
                        </div>
                    )}
                    <div className="pt-2">
                        <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-md transition duration-300 disabled:bg-indigo-400">
                            {isLoading ? 'Creating...' : 'Create Survey'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SurveyPresenter = ({ surveyId, setView }) => {
    const [survey, setSurvey] = useState(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!surveyId) return;
        const unsub = onSnapshot(doc(db, "surveys", surveyId), (doc) => {
            if (doc.exists()) setSurvey({ id: doc.id, ...doc.data() });
            else setError("Survey not found.");
        }, (err) => {
            console.error("Error fetching survey:", err);
            setError("Failed to load survey data.");
        });
        return () => unsub();
    }, [surveyId]);

    const handleCopy = () => {
        navigator.clipboard.writeText(surveyId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    if (error) return <p className="text-red-400 text-center">{error}</p>;
    if (!survey) return <LoadingSpinner />;

    const renderResults = () => {
        switch (survey.type) {
            case 'word-cloud': return <WordCloudChart words={survey.words} />;
            case 'open-ended': return <OpenEndedResults responses={survey.responses} />;
            case 'multiple-choice':
            default:
                return <ResultsChart options={survey.options} />;
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <button onClick={() => setView('home')} className="mb-4 text-indigo-400 hover:text-indigo-300">&larr; Back to Home</button>
            <div className="bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl">
                <div className="text-center mb-6">
                    <p className="text-slate-400">Participants can join with this code:</p>
                    <div className="flex justify-center items-center gap-2 mt-2">
                        <span className="text-3xl md:text-4xl font-bold tracking-widest text-white bg-slate-700 px-4 py-2 rounded-lg">{survey.id}</span>
                        <button onClick={handleCopy} className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-slate-600">{copied ? 'Copied!' : <CopyIcon />}</button>
                    </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">{survey.title}</h2>
                {renderResults()}
            </div>
        </div>
    );
};

const SurveyParticipant = ({ surveyId, userId, setView }) => {
    const [survey, setSurvey] = useState(null);
    const [error, setError] = useState('');
    const [hasVoted, setHasVoted] = useState(false);
    const [isVoting, setIsVoting] = useState(false);
    const [textInput, setTextInput] = useState('');

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "surveys", surveyId), (docSnap) => {
            if (docSnap.exists()) {
                const surveyData = docSnap.data();
                setSurvey({ id: docSnap.id, ...surveyData });
                if (surveyData.participants?.includes(userId)) setHasVoted(true);
            } else setError("Survey not found.");
        }, (err) => setError("Could not connect to the survey."));
        return () => unsub();
    }, [surveyId, userId]);

    const handleVote = async (optionIndex) => {
        if (hasVoted || isVoting) return;
        setIsVoting(true);
        try {
            const surveyRef = doc(db, "surveys", surveyId);
            const surveyDoc = await getDoc(surveyRef);
            if (!surveyDoc.exists() || surveyDoc.data().participants?.includes(userId)) {
                setIsVoting(false);
                return;
            }
            const newOptions = [...surveyDoc.data().options];
            newOptions[optionIndex].votes += 1;
            await updateDoc(surveyRef, { options: newOptions, participants: arrayUnion(userId) });
            setHasVoted(true);
        } catch (err) { setError("Your vote could not be cast."); } 
        finally { setIsVoting(false); }
    };

    const handleTextSubmit = async (e) => {
        e.preventDefault();
        if (hasVoted || isVoting || !textInput.trim()) return;
        setIsVoting(true);
        const submission = textInput.trim();

        try {
            const surveyRef = doc(db, "surveys", surveyId);
            if (survey.type === 'open-ended') {
                await updateDoc(surveyRef, { responses: arrayUnion(submission), participants: arrayUnion(userId) });
            } else if (survey.type === 'word-cloud') {
                const surveyDoc = await getDoc(surveyRef);
                const currentData = surveyDoc.data();
                const newWords = [...(currentData.words || [])];
                const wordIndex = newWords.findIndex(w => w.text.toLowerCase() === submission.toLowerCase());
                if (wordIndex > -1) {
                    newWords[wordIndex].votes += 1;
                } else {
                    newWords.push({ text: submission, votes: 1 });
                }
                await updateDoc(surveyRef, { words: newWords, participants: arrayUnion(userId) });
            }
            setHasVoted(true);
        } catch (err) { setError("Your submission failed."); }
        finally { setIsVoting(false); }
    };
    
    if (error) return ( <div className="text-center"><p className="text-red-400 mb-4">{error}</p><button onClick={() => setView('home')} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md">Go Home</button></div> );
    if (!survey) return <LoadingSpinner />;

    const renderVotingArea = () => {
        if (survey.type === 'multiple-choice') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {survey.options.map((option, index) => (
                        <button key={index} onClick={() => handleVote(index)} disabled={isVoting} className="w-full text-left p-4 bg-slate-700 rounded-lg text-white font-semibold hover:bg-indigo-600 transition duration-200 disabled:opacity-50">
                            {option.text}
                        </button>
                    ))}
                </div>
            );
        }
        if (survey.type === 'word-cloud' || survey.type === 'open-ended') {
            return (
                <form onSubmit={handleTextSubmit} className="flex gap-2">
                    <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type your response here..." maxLength={50} className="flex-grow px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    <button type="submit" disabled={isVoting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-indigo-400">Submit</button>
                </form>
            );
        }
        return null;
    };

    const renderResults = () => {
        switch (survey.type) {
            case 'word-cloud': return <WordCloudChart words={survey.words} />;
            case 'open-ended': return <OpenEndedResults responses={survey.responses} />;
            case 'multiple-choice':
            default: return <ResultsChart options={survey.options} />;
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl">
                <h2 className="text-3xl font-bold text-white text-center mb-6">{survey.title}</h2>
                {hasVoted ? (
                    <div>
                        <p className="text-center text-green-400 text-xl mb-4">Thanks for participating!</p>
                        {renderResults()}
                    </div>
                ) : (
                    renderVotingArea()
                )}
            </div>
        </div>
    );
};

const HomePage = ({ setView, setSurveyId }) => {
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleJoin = async (e) => {
        e.preventDefault();
        setError('');
        if (!joinCode.trim()) { setError('Please enter a survey code.'); return; }
        setIsLoading(true);
        try {
            const surveyRef = doc(db, "surveys", joinCode.toUpperCase().trim());
            const surveyDoc = await getDoc(surveyRef);
            if (surveyDoc.exists()) {
                setSurveyId(joinCode.toUpperCase().trim());
                setView('participant');
            } else {
                setError('Survey not found. Please check the code.');
            }
        } catch (err) { setError('There was a problem joining the survey.'); } 
        finally { setIsLoading(false); }
    };

    return (
        <div className="text-center">
            <div className="mb-12">
                <BarChartIcon className="mx-auto h-16 w-16 text-indigo-400" />
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white mt-4">Real-Time Survey</h1>
                <p className="text-slate-400 mt-2">Create and join interactive surveys instantly.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-slate-800 p-8 rounded-xl shadow-lg flex flex-col items-center justify-center">
                    <CreateIcon />
                    <h2 className="text-2xl font-bold text-white mt-4 mb-2">I'm a Presenter</h2>
                    <p className="text-slate-400 mb-6">Create a survey and engage your audience.</p>
                    <button onClick={() => setView('create')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition duration-300">
                        Create New Survey
                    </button>
                </div>
                <div className="bg-slate-800 p-8 rounded-xl shadow-lg flex flex-col items-center justify-center">
                    <JoinIcon />
                    <h2 className="text-2xl font-bold text-white mt-4 mb-2">I'm a Participant</h2>
                    <p className="text-slate-400 mb-6">Enter a code to join a survey and vote.</p>
                    <form onSubmit={handleJoin} className="w-full flex flex-col gap-3">
                        <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Enter 6-digit code" className="w-full text-center tracking-widest font-mono uppercase px-4 py-3 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                        <button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-purple-400">
                           {isLoading ? 'Joining...' : 'Join Survey'}
                        </button>
                    </form>
                    {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default function App() {
    const [view, setView] = useState('home');
    const [surveyId, setSurveyId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                // If no user, sign in anonymously.
                signInAnonymously(auth).catch(error => {
                    console.error("Anonymous sign-in failed:", error);
                });
            }
            setIsAuthReady(true);
        });
        
        return () => unsubscribe();
    }, []);
    
    const renderView = () => {
        switch (view) {
            case 'create': return <CreateSurvey setView={setView} setSurveyId={setSurveyId} />;
            case 'presenter': return <SurveyPresenter surveyId={surveyId} setView={setView} />;
            case 'participant': return <SurveyParticipant surveyId={surveyId} userId={userId} setView={setView} />;
            default: return <HomePage setView={setView} setSurveyId={setSurveyId} />;
        }
    };

    if (!isAuthReady) return ( <div className="bg-slate-900 min-h-screen flex items-center justify-center"><LoadingSpinner /></div> );

    return (
        <main className="bg-slate-900 min-h-screen w-full flex items-center justify-center p-4 font-sans">
            <div className="w-full">{renderView()}</div>
        </main>
    );
}
