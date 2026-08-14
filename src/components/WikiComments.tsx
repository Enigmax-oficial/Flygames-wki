import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Mail, 
  User, 
  Clock, 
  AlertCircle, 
  Loader2, 
  CheckCircle,
  HelpCircle,
  Hash,
  Globe
} from 'lucide-react';

interface Comment {
  id: string;
  pageId: string;
  userName: string;
  userEmail: string;
  comment: string;
  createdAt: string; // ISO string
}

interface WikiCommentsProps {
  pageId: string;
  pageTitle: string;
  currentUser: string | null;
  currentUserEmail: string | null;
}

export const WikiComments: React.FC<WikiCommentsProps> = ({ 
  pageId, 
  pageTitle,
  currentUser,
  currentUserEmail
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Guest fields (only shown if not logged in)
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  // Load comments from D1 Database
  const loadComments = async () => {
    try {
      const res = await fetch(`/api/comments?pageId=${encodeURIComponent(pageId)}`);
      if (res.ok) {
        const data = await res.json() as any;
        if (data.success && Array.isArray(data.comments)) {
          setComments(data.comments);
        } else {
          setComments([]);
        }
      } else {
        setComments([]);
      }
    } catch (e) {
      console.error('Failed to read comments from D1:', e);
      setComments([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    loadComments();
  }, [pageId]);

  // Scroll to bottom
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Handle Comment Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Determine sender info
    const finalName = currentUser ? currentUser : guestName.trim();
    const finalEmail = currentUserEmail ? currentUserEmail : guestEmail.trim();

    // Validations
    if (!finalName) {
      setError('Please provide your name to post a comment.');
      return;
    }
    if (!finalEmail) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) {
      setError('Please enter a valid email address format (e.g. name@example.com).');
      return;
    }

    setIsPosting(true);
    setError(null);
    setSuccess(null);

    const commentData = {
      pageId,
      userName: finalName,
      userEmail: finalEmail,
      comment: inputText.trim(),
    };

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData),
      });

      if (!res.ok) {
        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch {}
        throw new Error(data.error || 'Failed to post comment to D1');
      }

      const data = await res.json() as any;
      const newComment: Comment = data.comment || {
        id: `cmt_${Date.now()}`,
        ...commentData,
        createdAt: new Date().toISOString(),
      };
      
      // Refresh state
      setComments(prev => [...prev, newComment]);

      // Reset form states
      setInputText('');
      setGuestName('');
      setGuestEmail('');
      setSuccess('Comment successfully posted to Cloudflare D1!');
      setTimeout(() => setSuccess(null), 4000);

    } catch (err: any) {
      console.error('Failed to save comment to D1:', err);
      setError(err.message || 'Failed to post comment to Cloudflare D1.');
    } finally {
      setIsPosting(false);
    }
  };

  // Formatter for timestamp
  const formatTime = (createdAt: string) => {
    if (!createdAt) return 'Just now';
    try {
      const date = new Date(createdAt);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <div id="comments-section" className="space-y-8 text-[#cbd5e1] font-sans max-w-3xl mx-auto">
      
      {/* minimalist Title block */}
      <div className="flex items-center gap-4">
        <div className="w-1.5 h-6 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)]"></div>
        <h3 className="font-black text-xl text-white uppercase tracking-tighter">
          Community Discussions
        </h3>
        <div className="flex-1 border-b border-[#1e293b]"></div>
      </div>

      {/* Message feedback - Error only, silent success */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[11px] flex gap-3 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* List of Comments */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#94a3b8] gap-3">
            <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Retrieving thread...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-[#111827]/30 border border-[#1e293b]/50 rounded-2xl">
            <MessageSquare className="w-8 h-8 mx-auto opacity-10 text-sky-400" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No entries yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {comments.map((item) => {
              const isMine = currentUserEmail && item.userEmail.toLowerCase().trim() === currentUserEmail.toLowerCase().trim();
              return (
                <div 
                  key={item.id} 
                  className="group relative flex gap-4 animate-in fade-in duration-500"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border-2 shadow-sm transition-transform group-hover:scale-105 ${
                    isMine 
                      ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {item.userName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white uppercase tracking-tight">
                        {item.userName}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                        {formatTime(item.createdAt)}
                      </span>
                      {isMine && (
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[8px] font-black uppercase ml-1">You</span>
                      )}
                    </div>
                    <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-line break-words bg-[#111827]/40 p-4 rounded-2xl rounded-tl-none border border-[#1e293b]/50 group-hover:border-sky-500/20 transition-colors">
                      {item.comment}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={commentsEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="mt-12 bg-[#111827] border border-[#1e293b] rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500/50 to-emerald-500/50 opacity-30 group-hover:opacity-100 transition-opacity"></div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Guest Form Fields if not logged in */}
          {!currentUser && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Steve"
                  className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-2xl py-3 px-4 text-xs text-white focus:outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-800"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="steve@minecraft.net"
                  className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-2xl py-3 px-4 text-xs text-white focus:outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-800"
                />
              </div>
            </div>
          )}

          {/* Logged in state info */}
          {currentUser && (
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span>
                Verified as <span className="text-white">{currentUser}</span>
              </span>
            </div>
          )}

          {/* Textarea comment */}
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Share your thoughts or ask a question..."
                rows={3}
                maxLength={800}
                required
                className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all resize-none placeholder:text-slate-700"
              />
              <div className="absolute bottom-3 right-3 text-[9px] font-bold text-slate-600">
                {inputText.length}/800
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-[9px] text-slate-600 max-w-[200px] leading-tight font-medium uppercase tracking-tighter">
                * Entries are moderated and saved to the global expansion database.
              </p>
              <button
                type="submit"
                disabled={isPosting || !inputText.trim() || (!currentUser && (!guestName.trim() || !guestEmail.trim()))}
                className="px-8 py-3 rounded-2xl bg-white hover:bg-sky-400 text-black font-black text-xs uppercase tracking-widest transition-all disabled:opacity-20 disabled:grayscale cursor-pointer shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Entry</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
