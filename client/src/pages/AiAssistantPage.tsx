import React, { useState } from 'react';
import { ApiService } from '../services/api';
import {
  Sparkles,
  Bot,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  CalendarCheck,
  CalendarDays,
  MessageSquare,
  Trash2,
  ArrowRight,
  HelpCircle,
  Loader2,
  Copy
} from 'lucide-react';
import { PersonStage, OperationalStatus } from '@dms/shared';

interface ParsedPerson {
  fullName: string;
  contactNumber?: string;
  unitName?: string;
  currentStage?: PersonStage;
  operationalStatus?: OperationalStatus;
  rabtakarName?: string;
  daeenName?: string;
  notes?: string;
}

interface ParsedMeeting {
  personName: string;
  meetingDate?: string;
  unitName?: string;
  primaryDaeenName?: string;
  rabtakarName?: string;
  comments?: string;
}

interface ParsedRmm {
  unitName?: string;
  rmmDate?: string;
  weekStartDate?: string;
  weekEndDate?: string;
  plannedMaduMeetings?: number;
  plannedMdfMeetings?: number;
  comments?: string;
}

interface ParsedDf {
  unitName?: string;
  date?: string;
  mentorName?: string;
  topic?: string;
  comments?: string;
  attendeeNames?: string[];
}

interface ParsedPayload {
  summary?: string;
  people?: ParsedPerson[];
  meetings?: ParsedMeeting[];
  rmm?: ParsedRmm[];
  dialogueForums?: ParsedDf[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export const AiAssistantPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ingestion' | 'chat'>('ingestion');

  // Ingestion State
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedPayload | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<{
    batchId: string;
    totalCreated: number;
    message: string;
  } | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Assalam-o-Alaikum! Main aapka Dawati AI Assistant hoon. Aap mujh se Roman Urdu, Urdu ya English mein workspace ka koi bhi sawal pooch saktay hain. Maslan: *"Mujhe sab Madueen ki list chahiye"* ya *"Pichlay 3 dinon mein kitni meetings hui hain?"*',
      timestamp: new Date()
    }
  ]);
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // Sample Raw Text Ingestion Examples
  const handleLoadSample = (sampleType: 'whatsapp' | 'rmm' | 'mixed') => {
    if (sampleType === 'whatsapp') {
      setRawText(
        `Assalam o Alaikum Bhai,\nAj ki Dawati report Unit 1:\n1. Daeen Bilal sb ne Tariq Khan (Madu) se meeting ki, sath Rabtakar Usman thay. Alhamdulillah achi guftagu hui.\n2. Ek naya Madu list mein shamil kya: Kamran Ahmed, Phone: 03001234567, Rabtakar: Usman, Unit: Unit 1.`
      );
    } else if (sampleType === 'rmm') {
      setRawText(
        `RMM Weekly Conclusion - Unit 2:\nTareekh: 2026-11-24\nIs hafte ka target:\n- Planned Madu meetings: 6\n- Planned MDF meetings: 2\nMeeting focal person Rabtakar Farhan.`
      );
    } else {
      setRawText(
        `Sector Updates:\n- New Madu: Salman Ali, Rabtakar: Tariq, Unit: Unit 1, Status: PIPELINE\n- Dialogue Forum munaqid hua Unit 1 mein, Mentor: Dr. Shahid, Topic: Importance of Dawat, Attendees: Tariq Khan, Kamran Ahmed.`
      );
    }
    setParsedData(null);
    setCommitResult(null);
    setUndoMessage(null);
  };

  // Step 1: Parse Raw Text
  const handleParseText = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    setParseError(null);
    setCommitResult(null);
    setUndoMessage(null);

    try {
      const res = await ApiService.post<ParsedPayload>('/ai/parse', { text: rawText });
      setParsedData(res);
    } catch (err: any) {
      setParseError(err.message || 'Failed to extract information from raw text');
    } finally {
      setIsParsing(false);
    }
  };

  // Step 2: Commit Batch
  const handleCommit = async () => {
    if (!parsedData) return;
    setIsCommitting(true);
    try {
      const res = await ApiService.post('/ai/commit', { parsedData });
      setCommitResult(res);
      setParsedData(null);
      setRawText('');
    } catch (err: any) {
      alert(err.message || 'Failed to commit batch');
    } finally {
      setIsCommitting(false);
    }
  };

  // Step 3: Undo Batch
  const handleUndo = async (batchId: string) => {
    if (!window.confirm('Are you sure you want to revert this batch? All entities created in this batch will be safely removed.')) {
      return;
    }
    setIsUndoing(true);
    try {
      const res = await ApiService.post(`/ai/undo/${batchId}`);
      setUndoMessage(res.message);
      setCommitResult(null);
    } catch (err: any) {
      alert(err.message || 'Failed to undo batch');
    } finally {
      setIsUndoing(false);
    }
  };

  // Chat Submission
  const handleSendMessage = async (textToSend?: string) => {
    const q = (textToSend || questionInput).trim();
    if (!q || isAsking) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date()
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setQuestionInput('');
    setIsAsking(true);

    try {
      const res = await ApiService.post<{ answer: string }>('/ai/ask', { question: q });
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date()
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `Error processing question: ${err.message || 'Service unavailable'}`,
        timestamp: new Date()
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-surface-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red/10 text-brand-red">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold text-typography-main">
              AI Dawati Assistant & Smart Ingestion
            </h1>
          </div>
          <p className="mt-1 text-xs text-typography-secondary">
            Paste raw text reports (WhatsApp, RMM, Sector notes) to ingest instantly, or query live records in Roman Urdu, Urdu or English.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex rounded-lg border border-surface-border bg-white p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('ingestion')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'ingestion'
                ? 'bg-brand-red text-white'
                : 'text-typography-secondary hover:text-typography-main'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Smart Ingestion
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'chat'
                ? 'bg-brand-red text-white'
                : 'text-typography-secondary hover:text-typography-main'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            Workspace Q&A
          </button>
        </div>
      </div>

      {/* TAB 1: SMART DATA INGESTION */}
      {activeTab === 'ingestion' && (
        <div className="space-y-6">
          {/* Commit Success Banner with Undo */}
          {commitResult && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">
                    {commitResult.message}
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Batch Reference: <code className="font-mono">{commitResult.batchId}</code> — Total {commitResult.totalCreated} items created.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleUndo(commitResult.batchId)}
                disabled={isUndoing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-xs"
              >
                {isUndoing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                <span>Undo This Ingestion</span>
              </button>
            </div>
          )}

          {/* Undo Message Banner */}
          {undoMessage && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-xs font-medium text-amber-900">{undoMessage}</p>
            </div>
          )}

          {/* Error Banner */}
          {parseError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <p className="text-xs font-medium text-rose-900">{parseError}</p>
            </div>
          )}

          {/* Input Card */}
          <div className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-red" />
                <h3 className="text-sm font-bold text-typography-main">
                  Paste Raw Unstructured Dawati Notes / WhatsApp Text
                </h3>
              </div>

              {/* Sample Templates */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-typography-tertiary">Quick Samples:</span>
                <button
                  type="button"
                  onClick={() => handleLoadSample('whatsapp')}
                  className="px-2 py-1 text-[11px] font-medium rounded border border-surface-border bg-surface-secondary text-typography-secondary hover:bg-slate-100"
                >
                  WhatsApp Report
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('rmm')}
                  className="px-2 py-1 text-[11px] font-medium rounded border border-surface-border bg-surface-secondary text-typography-secondary hover:bg-slate-100"
                >
                  RMM Conclusion
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('mixed')}
                  className="px-2 py-1 text-[11px] font-medium rounded border border-surface-border bg-surface-secondary text-typography-secondary hover:bg-slate-100"
                >
                  Sector Mixed
                </button>
              </div>
            </div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw WhatsApp message, meeting summary, new people list or RMM targets here in Urdu, Roman Urdu or English..."
              rows={6}
              className="w-full rounded-lg border border-surface-border p-3 text-xs text-typography-main focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red font-mono"
            />

            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-typography-tertiary flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" />
                The AI automatically maps names to registered Units, Rabtakars & Daeen with fallback heuristics.
              </p>
              <button
                type="button"
                onClick={handleParseText}
                disabled={isParsing || !rawText.trim()}
                className="btn-primary inline-flex items-center gap-1.5 text-xs py-2 px-4 shadow-sm"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing & Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Extract & Review</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Extracted Data Review & Commit Section */}
          {parsedData && (
            <div className="space-y-4 rounded-xl border border-surface-border bg-slate-50/70 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
                <div>
                  <h3 className="text-sm font-bold text-typography-main flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Extraction Preview & Verification
                  </h3>
                  <p className="text-xs text-typography-secondary">
                    Review extracted records before committing to the database. You can delete or edit items.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setParsedData(null)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleCommit}
                    disabled={isCommitting}
                    className="btn-primary inline-flex items-center gap-1.5 text-xs py-2 px-4 bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                  >
                    {isCommitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span>Commit All to Workspace</span>
                  </button>
                </div>
              </div>

              {/* People Preview */}
              {parsedData.people && parsedData.people.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-typography-main">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>Extracted People ({parsedData.people.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {parsedData.people.map((p, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-surface-border bg-white p-3 shadow-xs space-y-1 relative text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const newPeople = [...parsedData.people!];
                            newPeople.splice(idx, 1);
                            setParsedData({ ...parsedData, people: newPeople });
                          }}
                          className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="font-bold text-typography-main">{p.fullName}</div>
                        <div className="text-[11px] text-typography-secondary">
                          <span className="font-semibold">Stage:</span> {p.currentStage || 'MADU'} | <span className="font-semibold">Status:</span> {p.operationalStatus || 'ACTIVE'}
                        </div>
                        {p.unitName && (
                          <div className="text-[11px] text-typography-secondary">
                            <span className="font-semibold">Unit:</span> {p.unitName}
                          </div>
                        )}
                        {p.rabtakarName && (
                          <div className="text-[11px] text-typography-secondary">
                            <span className="font-semibold">Rabtakar:</span> {p.rabtakarName}
                          </div>
                        )}
                        {p.contactNumber && (
                          <div className="text-[11px] text-typography-secondary">
                            <span className="font-semibold">Phone:</span> {p.contactNumber}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meetings Preview */}
              {parsedData.meetings && parsedData.meetings.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-surface-border">
                  <div className="flex items-center gap-2 text-xs font-bold text-typography-main">
                    <CalendarCheck className="h-4 w-4 text-emerald-600" />
                    <span>Extracted Individual Meetings ({parsedData.meetings.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parsedData.meetings.map((m, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-surface-border bg-white p-3 shadow-xs space-y-1 relative text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const newMeetings = [...parsedData.meetings!];
                            newMeetings.splice(idx, 1);
                            setParsedData({ ...parsedData, meetings: newMeetings });
                          }}
                          className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="font-bold text-typography-main">Person: {m.personName}</div>
                        <div className="text-[11px] text-typography-secondary">
                          <span className="font-semibold">Daeen:</span> {m.primaryDaeenName || 'Assigned Daeen'} | <span className="font-semibold">Rabtakar:</span> {m.rabtakarName || 'N/A'}
                        </div>
                        {m.unitName && (
                          <div className="text-[11px] text-typography-secondary">
                            <span className="font-semibold">Unit:</span> {m.unitName}
                          </div>
                        )}
                        {m.comments && (
                          <div className="text-[11px] text-typography-tertiary italic">
                            "{m.comments}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RMM Preview */}
              {parsedData.rmm && parsedData.rmm.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-surface-border">
                  <div className="flex items-center gap-2 text-xs font-bold text-typography-main">
                    <CalendarDays className="h-4 w-4 text-purple-600" />
                    <span>Extracted RMM Weekly Plans ({parsedData.rmm.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parsedData.rmm.map((r, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-surface-border bg-white p-3 shadow-xs space-y-1 relative text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const newRmm = [...parsedData.rmm!];
                            newRmm.splice(idx, 1);
                            setParsedData({ ...parsedData, rmm: newRmm });
                          }}
                          className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="font-bold text-typography-main">Unit: {r.unitName || 'Default Unit'}</div>
                        <div className="text-[11px] text-typography-secondary">
                          Target Madu: <span className="font-semibold text-purple-700">{r.plannedMaduMeetings || 0}</span> | Target MDF: <span className="font-semibold text-purple-700">{r.plannedMdfMeetings || 0}</span>
                        </div>
                        {r.comments && (
                          <div className="text-[11px] text-typography-tertiary italic">
                            "{r.comments}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dialogue Forums Preview */}
              {parsedData.dialogueForums && parsedData.dialogueForums.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-surface-border">
                  <div className="flex items-center gap-2 text-xs font-bold text-typography-main">
                    <MessageSquare className="h-4 w-4 text-amber-600" />
                    <span>Extracted Dialogue Forums ({parsedData.dialogueForums.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parsedData.dialogueForums.map((df, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-surface-border bg-white p-3 shadow-xs space-y-1 relative text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const newDfs = [...parsedData.dialogueForums!];
                            newDfs.splice(idx, 1);
                            setParsedData({ ...parsedData, dialogueForums: newDfs });
                          }}
                          className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="font-bold text-typography-main">Topic: {df.topic || 'Dialogue Forum'}</div>
                        <div className="text-[11px] text-typography-secondary">
                          Unit: {df.unitName || 'Sector'} | Mentor: {df.mentorName || 'Default Mentor'}
                        </div>
                        {df.attendeeNames && df.attendeeNames.length > 0 && (
                          <div className="text-[11px] text-typography-secondary">
                            Attendees: {df.attendeeNames.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WORKSPACE ASSISTANT CHAT */}
      {activeTab === 'chat' && (
        <div className="rounded-xl border border-surface-border bg-white shadow-sm flex flex-col h-[650px]">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-surface-border p-4 bg-slate-50/50 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-red text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-typography-main">
                  Dawati Q&A Assistant
                </h3>
                <p className="text-[11px] text-typography-secondary">
                  Powered by live workspace context & Gemini engine (Roman Urdu, Urdu, English)
                </p>
              </div>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-typography-tertiary">Quick Ask:</span>
              <button
                type="button"
                onClick={() => handleSendMessage('Mujhe sab Madueen ki list chahiye')}
                className="px-2.5 py-1 text-[11px] rounded-full border border-surface-border bg-white hover:bg-slate-50 text-typography-secondary transition-colors"
              >
                Madu List
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Pichlay 3 dinon mein kitni meetings hui hain?')}
                className="px-2.5 py-1 text-[11px] rounded-full border border-surface-border bg-white hover:bg-slate-50 text-typography-secondary transition-colors"
              >
                3-Day Meetings
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Active RMM aur weekly targets kya hain?')}
                className="px-2.5 py-1 text-[11px] rounded-full border border-surface-border bg-white hover:bg-slate-50 text-typography-secondary transition-colors"
              >
                RMM Targets
              </button>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-brand-red mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-brand-red text-white rounded-tr-none'
                      : 'bg-surface-secondary text-typography-main rounded-tl-none border border-surface-border'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>
                  <div
                    className={`mt-1.5 text-[10px] ${
                      msg.sender === 'user' ? 'text-white/70 text-right' : 'text-typography-tertiary'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isAsking && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-none border border-surface-border bg-surface-secondary p-3 text-xs flex items-center gap-2 text-typography-secondary">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-red" />
                  <span>Checking live workspace records...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts Mobile */}
          <div className="lg:hidden flex items-center gap-1.5 px-4 py-2 border-t border-surface-border bg-slate-50 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => handleSendMessage('Mujhe sab Madueen ki list chahiye')}
              className="px-2.5 py-1 text-[11px] rounded-full border border-surface-border bg-white text-typography-secondary shrink-0"
            >
              Madu List
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Pichlay 3 dinon mein kitni meetings hui hain?')}
              className="px-2.5 py-1 text-[11px] rounded-full border border-surface-border bg-white text-typography-secondary shrink-0"
            >
              3-Day Meetings
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Active RMM aur weekly targets kya hain?')}
              className="px-2.5 py-1 text-[11px] rounded-full border border-surface-border bg-white text-typography-secondary shrink-0"
            >
              RMM Targets
            </button>
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="border-t border-surface-border p-3 flex items-center gap-2 bg-white rounded-b-xl"
          >
            <input
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              placeholder="Poochiye: 'Mujhe sab Madueen ki list chahiye' ya 'Pichlay 3 dinon mein kitni meetings hui hain?'..."
              className="flex-1 rounded-lg border border-surface-border px-3.5 py-2.5 text-xs text-typography-main focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
            />
            <button
              type="submit"
              disabled={isAsking || !questionInput.trim()}
              className="btn-primary inline-flex items-center gap-1.5 py-2.5 px-4 text-xs shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AiAssistantPage;
