import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInterview } from '../InterviewContext';
import interviewerAvatar from '../assets/interviewer.svg';
import hangupIcon from '../assets/hangup.svg';
import interviewService from '../services/interview.service';
import { getSocket } from '../services/socket';

const AIInterviewWidget = () => {
    const { isInterviewWidgetOpen, closeInterviewWidget } = useInterview();
    const [interviewState, setInterviewState] = useState('setup'); 
    const [cvFile, setCvFile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(900); 

    const isAiSpeakingRef = useRef(false);
    const isMicMutedRef = useRef(false);
    const audioContext = useRef(null);
    const recognitionRef = useRef(null);
    const socket = getSocket();
    const timerIdRef = useRef(null); 
    const silenceTimeRef = useRef(null);

    const toggleMic = () => {
        setIsMicMuted(!isMicMuted);
        isMicMutedRef.current = !isMicMutedRef.current;
        if (isMicMutedRef.current && recognitionRef.current) {
            recognitionRef.current.stop();
        } else if (!isMicMutedRef.current && recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {}
        }
    };

    useEffect(() => {
        if (!isInterviewWidgetOpen) {
            setInterviewState('setup');
            setCvFile(null);
            setJobDescription('');
            setIsLoading(false);
            setError('');
            setSessionId(null);
            setAnalysisResult(null);
            setIsMicMuted(false);
            isMicMutedRef.current = false;
            setTimeLeft(900);
            if (timerIdRef.current) clearInterval(timerIdRef.current);

            if (audioContext.current && audioContext.current.state !== 'closed') {
                audioContext.current.close();
                audioContext.current = null;
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        }
    }, [isInterviewWidgetOpen]);

    const handleNoResponse = useCallback(() => {
        if (socket && sessionId && interviewState === 'interviewing') {
            console.log("Ứng viên im lặng quá lâu, chuyển câu hỏi...");
            socket.emit('user_text_turn', { 
                sessionId, 
                text: "[Hệ thống: Ứng viên không trả lời được câu hỏi này, vui lòng bỏ qua và chuyển sang câu tiếp theo hoặc gợi ý cho họ]" 
            });
            setIsAiSpeaking(true); 
            isAiSpeakingRef.current = true;
        }
    }, [socket, sessionId, interviewState]);

    const handleHangUp = useCallback(() => {
        if (socket && sessionId) {
            if (timerIdRef.current) {
                clearInterval(timerIdRef.current);
            }
            setIsLoading(true);
            socket.emit('end_interview', { sessionId });
            
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        }
    }, [socket, sessionId]);

    useEffect(() => {
        if (interviewState === 'interviewing') {
            setTimeLeft(900); 
            timerIdRef.current = setInterval(() => {
                setTimeLeft(prevTime => prevTime - 1);
            }, 1000);
        }
        return () => clearInterval(timerIdRef.current); 
    }, [interviewState]);

    useEffect(() => {
        if (timeLeft <= 0 && interviewState === 'interviewing') {
            handleHangUp();
        }
    }, [timeLeft, interviewState, handleHangUp]);

    useEffect(() => {
        if (interviewState !== 'interviewing' || !sessionId || !socket) return;

        if (!audioContext.current) {
            console.error("AudioContext chưa được khởi tạo. Âm thanh sẽ không hoạt động.");
            return;
        }

        socket.on('ai_audio_chunk', handleAudioChunk);
        socket.on('interview_ended', handleInterviewEnded);

        socket.emit('join_interview_session', sessionId);
        
        socket.emit('trigger_greeting', { sessionId });
        isAiSpeakingRef.current = true;
        setIsAiSpeaking(true);

        const audioQueue = [];
        let nextPlayTime = 0;

        const playNextAudio = async () => {
            if (audioQueue.length === 0) return;

            setIsAiSpeaking(true);
            isAiSpeakingRef.current = true;

            const item = audioQueue.shift();
            const { audioData } = item;

            try {
                const bufferData = audioData instanceof ArrayBuffer ? audioData : new Uint8Array(audioData).buffer;
                const audioBuffer = await audioContext.current.decodeAudioData(bufferData);

                const source = audioContext.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.current.destination);

                const currentTime = audioContext.current.currentTime;
                if (nextPlayTime < currentTime) {
                    nextPlayTime = currentTime; 
                }
                
                source.start(nextPlayTime);
                nextPlayTime += audioBuffer.duration; 

                source.onended = () => { 
                    if (audioQueue.length === 0 && audioContext.current.currentTime >= nextPlayTime - 0.1) {
                        setIsAiSpeaking(false);
                        isAiSpeakingRef.current = false;
                        if(silenceTimeRef.current) clearTimeout(silenceTimeRef.current);
                        silenceTimeRef.current = setTimeout(handleNoResponse, 30000);
                    }
                };

                if (audioQueue.length > 0) {
                     playNextAudio();
                }

            } catch (e) {
                console.error("Lỗi giải mã audio:", e);
                if (audioQueue.length > 0) playNextAudio();
            }
        };

        function handleAudioChunk(data) {
            if (data.sessionId === sessionId) {
                audioQueue.push({ audioData: data.audioChunk, mimeType: data.mimeType });
                
                if (audioQueue.length === 1) {
                    playNextAudio();
                }
            }
        }

        function handleInterviewEnded(data) {
            if (data.sessionId === sessionId) {
                setAnalysisResult(data.analysis);
                setInterviewState('finished');
                setIsLoading(false);
                if (timerIdRef.current) clearInterval(timerIdRef.current);
            }
        }

        let silenceListeningTimer = null;
        let finalTranscript = '';

        const startSpeechRecognition = () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.error("Trình duyệt không hỗ trợ Web Speech API.");
                setError("Trình duyệt không hỗ trợ nhận dạng giọng nói.");
                return;
            }

            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'vi-VN'; 

            recognition.onstart = () => {
                console.log("Bắt đầu nhận dạng giọng nói");
            };

            recognition.onresult = (event) => {
                if (isAiSpeakingRef.current || isMicMutedRef.current) return;
                
                setIsListening(true);
                
                if (silenceTimeRef.current) clearTimeout(silenceTimeRef.current);
                silenceTimeRef.current = setTimeout(handleNoResponse, 30000);

                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript + ' ';
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (silenceListeningTimer) clearTimeout(silenceListeningTimer);
                
                silenceListeningTimer = setTimeout(() => {
                    setIsListening(false);
                    const textToSend = finalTranscript.trim();
                    if (textToSend) {
                        console.log("Gửi text từ giọng nói:", textToSend);
                        socket.emit('user_text_turn', { sessionId, text: textToSend });
                        finalTranscript = ''; 
                    }
                }, 1500); 
            };

            recognition.onerror = (event) => {
                console.error("Lỗi nhận dạng giọng nói:", event.error);
                if (event.error === 'not-allowed') {
                    setError("Không thể truy cập microphone. Vui lòng kiểm tra quyền.");
                }
            };

            recognition.onend = () => {
                if (interviewState === 'interviewing' && !isMicMutedRef.current && recognitionRef.current) {
                    try {
                        recognition.start();
                    } catch (e) {}
                }
            };

            if (!isMicMutedRef.current) {
                try {
                    recognition.start();
                } catch (e) {}
            }
        };

        startSpeechRecognition();

        return () => {
            socket.emit('leave_interview_session', sessionId);
            socket.off('ai_audio_chunk', handleAudioChunk);
            socket.off('interview_ended', handleInterviewEnded);

            if (timerIdRef.current) clearInterval(timerIdRef.current);
            if (silenceTimeRef.current) clearTimeout(silenceTimeRef.current);
            if (silenceListeningTimer) clearTimeout(silenceListeningTimer);
            if (recognitionRef.current) {
                recognitionRef.current.onend = null; 
                recognitionRef.current.stop();
            }
        };
    }, [interviewState, sessionId, socket, handleNoResponse]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setCvFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!cvFile || !jobDescription) {
            setError('Vui lòng tải lên CV và nhập mô tả công việc.');
            return;
        }
        setIsLoading(true);
        setError('');   
        await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.current.state === 'suspended') {
            await audioContext.current.resume();
        }

        const formData = new FormData();
        formData.append('cv', cvFile);
        formData.append('jdContext', jobDescription);

        try {
            const response = await interviewService.initiate(formData);
            const { sessionId: newSessionId } = response.data;
            setSessionId(newSessionId);
            setInterviewState('interviewing');
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi bắt đầu phỏng vấn.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isInterviewWidgetOpen) {
        return null;
    }

    const renderSetupScreen = () => (
        <>
            <h2 className="text-2xl font-bold text-green-500 mb-6 text-center">Phỏng vấn AI</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="cv-upload" className="block text-white mb-2 font-semibold">Tải lên CV của bạn (PDF, DOCX) *</label>
                    <input
                        id="cv-upload"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                        required
                    />
                    {cvFile && <p className="text-sm text-gray-300 mt-2">Đã chọn: {cvFile.name}</p>}
                </div>
                <div>
                    <label htmlFor="job-description" className="block text-white mb-2 font-semibold">Dán mô tả công việc (JD) *</label>
                    <textarea
                        id="job-description"
                        rows="8"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Dán toàn bộ nội dung mô tả công việc vào đây..."
                        className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
                        required
                    />
                </div>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <div className="text-center text-gray-300 italic">
                    Hãy nhấn Submit khi bạn đã sẵn sàng.
                </div>
                <button
                    type="submit"
                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold transition-colors disabled:bg-gray-500"
                    disabled={isLoading}
                >
                    {isLoading ? 'Đang khởi tạo...' : 'Bắt đầu'}
                </button>
            </form>
        </>
    );

    const renderInterviewScreen = () => (
        <div className="flex flex-col h-full items-center justify-between">
            <div className="flex-shrink-0 flex flex-col items-center mt-8">
                <img src={interviewerAvatar} alt="AI Interviewer" className="w-32 h-32 rounded-full border-4 border-green-500 shadow-lg mb-4" />
                <div className="h-8">
                    {isAiSpeaking ? (
                        <p className="text-lg text-green-400 animate-pulse">AI đang nói...</p>
                    ) : isListening ? (
                        <p className="text-lg text-blue-400 animate-pulse">Đang lắng nghe bạn...</p>
                    ) : (
                        <p className="text-lg text-blue-400">Đang chờ bạn trả lời...</p>
                    )}
                </div>
            </div>

            <div className="flex-shrink-0 flex items-center justify-center mb-8 space-x-4">
                <button
                    onClick={toggleMic}
                    className={`flex items-center justify-center py-3 px-8 rounded-full text-white font-bold transition-colors shadow-lg ${isMicMuted ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        {isMicMuted ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        )}
                    </svg>
                    {isMicMuted ? 'Mic Tắt' : 'Mic Bật'}
                </button>
                <button
                    onClick={handleHangUp}
                    disabled={isLoading}
                    className="flex items-center justify-center py-3 px-8 bg-red-600 hover:bg-red-700 rounded-full text-white font-bold transition-colors shadow-lg disabled:bg-red-800"
                >
                    <img src={hangupIcon} alt="Hang up" className="w-6 h-6 mr-3" />
                    {isLoading ? 'Đang xử lý...' : 'Dập máy'}
                </button>
            </div>
        </div>
    );

    const renderResultsScreen = () => (
        <div className="text-left flex flex-col h-full">
            <h2 className="text-2xl font-bold text-green-500 mb-4 text-center">Kết quả Phỏng vấn</h2>
            {analysisResult ? (
                <div className="bg-gray-900 p-6 rounded-lg w-full flex-grow overflow-y-auto">
                    <h3 className="text-xl font-semibold text-green-400 mb-2">Tóm tắt</h3>
                    <p className="text-gray-300 mb-4">{analysisResult.summary}</p>

                    <h3 className="text-xl font-semibold text-green-400 mb-2">Chấm điểm (Thang điểm 10)</h3>
                    <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                        {Object.entries(analysisResult.scores || {}).map(([key, value]) => (
                            <div key={key} className="bg-gray-800 p-4 rounded-lg">
                                <p className="text-2xl font-bold text-white">{value}</p>
                                <p className="text-gray-400 capitalize">{key.replace('_', ' ')}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <h3 className="text-xl font-semibold text-green-400 mb-2">Điểm mạnh</h3>
                            <ul className="list-disc list-inside text-gray-300 space-y-1">
                                {analysisResult.strengths?.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-red-400 mb-2">Điểm yếu</h3>
                            <ul className="list-disc list-inside text-gray-300 space-y-1">
                                {analysisResult.weaknesses?.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-700 p-6 rounded-lg w-full flex-grow flex items-center justify-center">
                    <p className="italic text-gray-400">Đang chờ kết quả phân tích...</p>
                </div>
            )}
            <div className="text-center mt-6">
                <button onClick={closeInterviewWidget} className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-bold">Đóng</button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
            <div className="bg-gray-800 w-11/12 max-w-7xl h-[85vh] p-8 rounded-lg border border-white relative overflow-y-auto">
                <button
                    onClick={closeInterviewWidget}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                {interviewState === 'setup' && renderSetupScreen()}
                {interviewState === 'interviewing' && renderInterviewScreen()}
                {interviewState === 'finished' && renderResultsScreen()}
            </div>
        </div>
    );
};

export default AIInterviewWidget;