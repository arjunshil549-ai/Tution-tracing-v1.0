import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, X, Send } from 'lucide-react';
import { sendEmailViaGmail } from '../services/workspace';

interface GmailSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  defaultRecipient?: string;
  defaultSubject: string;
  defaultBody: string;
}

export const GmailSendModal: React.FC<GmailSendModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  defaultRecipient = '',
  defaultSubject,
  defaultBody,
}) => {
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [showConfirmationStep, setShowConfirmationStep] = useState(false);

  if (!isOpen) return null;

  const handleInitialSendClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !recipient.includes('@')) {
      setError('Please provide a valid recipient email address.');
      return;
    }
    setError(null);
    setShowConfirmationStep(true);
  };

  const handleConfirmSend = async () => {
    setIsSending(true);
    setError(null);
    try {
      await sendEmailViaGmail(accessToken, {
        to: recipient.trim(),
        subject: subject.trim(),
        bodyText: body,
      });
      setSentSuccess(true);
      setShowConfirmationStep(false);
    } catch (err: any) {
      console.error('Failed to send email:', err);
      setError(err.message || 'Failed to send email via Gmail API.');
      setShowConfirmationStep(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Send Report via Gmail</h2>
              <p className="text-xs text-slate-400">Google Workspace Gmail API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {sentSuccess ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Email Sent Successfully!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your report was sent via your connected Gmail account to{' '}
                <span className="text-emerald-400 font-medium">{recipient}</span>.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition"
              >
                Done
              </button>
            </div>
          ) : showConfirmationStep ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                <strong>Explicit Confirmation Required:</strong>
                <p className="mt-1">
                  You are about to send an email on behalf of your Google account to{' '}
                  <span className="font-semibold text-white">{recipient}</span> with the subject "{subject}".
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                {body}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmationStep(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  Back to Edit
                </button>
                <button
                  type="button"
                  disabled={isSending}
                  onClick={handleConfirmSend}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSending ? (
                    <span>Sending email...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm & Send Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleInitialSendClick} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Recipient Email (Student / Guardian)
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. parent@example.com"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Message Body</label>
                <textarea
                  rows={6}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition flex items-center space-x-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Review & Send</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
