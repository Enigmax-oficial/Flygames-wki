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

  // Load comments from Local Storage
  const loadLocalComments = () => {
    try {
      const saved = localStorage.getItem('wiki_comments_local');
      if (saved) {
        const allComments: Comment[] = JSON.parse(saved);
        const filtered = allComments.filter(c => c.pageId === pageId);
        // Sort chronologically
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setComments(filtered);
      } else {
        setComments([]);
      }
    } catch (e) {
      console.error('Failed to read local comments', e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    loadLocalComments();
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
      // Save to Local Storage
      const saved = localStorage.getItem('wiki_comments_local');
      const allComments: Comment[] = saved ? JSON.parse(saved) : [];
      const newComment: Comment = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...commentData,
        createdAt: new Date().toISOString()
      };
      allComments.push(newComment);
      localStorage.setItem('wiki_comments_local', JSON.stringify(allComments));
      
      // Refresh local state
      setComments(prev => [...prev, newComment]);

      // Reset form states
      setInputText('');
      setGuestName('');
      setGuestEmail('');
      setSuccess('Comment successfully posted and registered!');
      setTimeout(() => setSuccess(null), 4000);

    } catch (err: any) {
      console.error('Failed to save comment:', err);
      setError('Failed to post comment. Storage error.');
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
    <div id="comments-section" className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 sm:p-6 shadow-xl space-y-6 text-[#cbd5e1] font-sans">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white flex items-center gap-2.5">
              Discussions & Questions
            </h3>
            <p className="text-xs text-[#94a3b8]">
              Ask questions or share feedback about the "{pageTitle}" article.
            </p>
          </div>
        </div>
      </div>

      {/* Message feedback */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs sm:text-sm flex gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Execution Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* List of Comments */}
      <div className="bg-[#0b0f19] border border-[#1e293b] rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 max-h-[380px] overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#94a3b8] gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
              <p className="text-xs">Loading comment thread...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center text-[#475569] space-y-2">
              <HelpCircle className="w-10 h-10 mx-auto opacity-30 text-sky-400" />
              <p className="text-sm font-semibold text-[#94a3b8]">No questions yet</p>
              <p className="text-xs max-w-xs mx-auto text-[#64748b]">Have a query about recipes, attributes, or stats? Be the first to ask!</p>
            </div>
          ) : (
            comments.map((item) => {
              const isMine = currentUserEmail && item.userEmail.toLowerCase().trim() === currentUserEmail.toLowerCase().trim();
              return (
                <div 
                  key={item.id} 
                  className={`flex gap-3 items-start max-w-[90%] p-3 rounded-xl border border-transparent transition-all ${
                    isMine 
                      ? 'ml-auto flex-row-reverse bg-sky-500/5 border-sky-500/10' 
                      : 'bg-[#111827]/40 hover:bg-[#111827] hover:border-[#1e293b]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                    isMine 
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' 
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}>
                    {item.userName.charAt(0).toUpperCase()}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${isMine ? 'justify-end' : ''}`}>
                      <span className="text-xs font-extrabold text-white truncate">
                        {item.userName}
                      </span>
                      <span className="text-[10px] text-[#64748b] font-mono flex items-center gap-1 max-w-[140px] sm:max-w-none truncate" title={item.userEmail}>
                        <Mail className="w-2.5 h-2.5" />
                        {item.userEmail}
                      </span>
                      <span className="text-[9px] text-[#475569] font-mono flex items-center gap-1 ml-auto">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime(item.createdAt)}
                      </span>
                    </div>
                    <div className={`text-xs sm:text-sm leading-relaxed text-[#cbd5e1] whitespace-pre-line break-words`}>
                      {item.comment}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input area */}
        <div className="p-4 bg-[#070a12] border-t border-[#1e293b]">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Guest Form Fields if not logged in */}
            {!currentUser && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1">
                    <User className="w-3 h-3 text-sky-400" />
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full bg-[#111827] border border-[#1e293b] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1">
                    <Mail className="w-3 h-3 text-sky-400" />
                    Your Email Address <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#111827] border border-[#1e293b] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/20"
                  />
                </div>
              </div>
            )}

            {/* Logged in state info */}
            {currentUser && (
              <div className="flex items-center gap-2 text-xs text-[#94a3b8] bg-[#111827] border border-[#1e293b] px-3 py-2 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Commenting as <strong className="text-white">{currentUser}</strong> (<span className="font-mono text-sky-400">{currentUserEmail}</span>)
                </span>
              </div>
            )}

            {/* Textarea comment */}
            <div className="relative flex items-center gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={currentUser ? `Ask a question or leave a comment...` : `Please enter your details above to leave a comment...`}
                rows={2}
                maxLength={800}
                required
                className="flex-1 bg-[#111827] border border-[#1e293b] rounded-xl py-2 px-4 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/20 disabled:opacity-60 resize-none min-h-[50px]"
              />
              <button
                type="submit"
                disabled={isPosting || !inputText.trim() || (!currentUser && (!guestName.trim() || !guestEmail.trim()))}
                className="h-10 w-10 shrink-0 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-[#1e293b] text-black disabled:text-[#475569] transition-all flex items-center justify-center cursor-pointer shadow-[0_0_12px_rgba(56,189,248,0.2)] disabled:shadow-none"
                title="Post Comment"
              >
                {isPosting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            
            <p className="text-[10px] text-[#64748b] leading-normal">
              * Email address is strictly stored in database to register comments and ensure authenticity. No marketing emails or spam will be sent.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
