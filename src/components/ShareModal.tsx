import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export default function ShareModal({ isOpen, onClose, url, title }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = encodeURIComponent(`${title}\n\nПриєднуйтесь за посиланням:`);
  const encodedUrl = encodeURIComponent(url);

  const links = {
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${shareText}`,
    viber: `viber://forward?text=${shareText}%20${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${shareText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-900">Поділитися</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm font-bold text-slate-800 mb-2">{title}</p>
            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                type="text"
                readOnly
                value={url}
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-600 px-2 truncate"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Скопійовано' : 'Копіювати'}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Надіслати через:</p>
            <div className="grid grid-cols-2 gap-3">
              <a href={links.telegram} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9]/20 rounded-xl font-bold transition-colors">
                <span>✈️</span> Telegram
              </a>
              <a href={links.viber} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-[#7360F2]/10 text-[#7360F2] hover:bg-[#7360F2]/20 rounded-xl font-bold transition-colors">
                <span>📞</span> Viber
              </a>
              <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 rounded-xl font-bold transition-colors">
                <span>💬</span> WhatsApp
              </a>
              <a href={links.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 rounded-xl font-bold transition-colors">
                <span>📘</span> Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}