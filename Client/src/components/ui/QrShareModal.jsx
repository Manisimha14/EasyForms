import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Dialog } from './Dialog';
import { Button } from './Button';
import {
  Copy,
  Check,
  Download,
  ExternalLink,
  QrCode,
  Share2,
  Code,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function QrShareModal({
  isOpen,
  onClose,
  formTitle = 'Easy Form',
  publicUrl = '',
  slug = '',
}) {
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'embed'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!publicUrl) return;

    // Generate high resolution QR Code (1024x1024) for crisp display & download
    QRCode.toDataURL(publicUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: '#1C1917', // Dark stone modules
        light: '#FFFFFF', // Pure white background
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR Code:', err));
  }, [publicUrl]);

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    toast.success('Form link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const embedCode = `<iframe src="${publicUrl}" width="100%" height="650" frameborder="0" marginheight="0" marginwidth="0" style="border: 1px solid #E7E5E4; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);" title="${formTitle}">Loading…</iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    toast.success('Embed code copied to clipboard!');
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${slug || 'easyform'}-qr-code.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('QR Code downloaded as PNG!');
  };

  const handleDownloadSvg = async () => {
    try {
      const svgString = await QRCode.toString(publicUrl, {
        type: 'svg',
        margin: 2,
        color: {
          dark: '#1C1917',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug || 'easyform'}-qr-code.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('QR Code downloaded as SVG vector!');
    } catch {
      toast.error('Failed to generate SVG QR code');
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Share Your Form"
      description="Distribute this live form using an instant link, scannable QR code, or website embed."
    >
      <div className="space-y-5 pt-1">
        {/* Tab switcher */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'qr'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200/60'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-primary-600" />
            Link & QR Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('embed')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'embed'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200/60'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-primary-600" />
            Embed on Website
          </button>
        </div>

        {activeTab === 'qr' ? (
          <div className="space-y-4">
            {/* Direct Link Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Direct URL
              </label>
              <div className="flex items-center gap-2 p-2 bg-stone-50 border border-stone-200 rounded-xl focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="bg-transparent text-sm text-stone-800 flex-1 outline-none font-mono truncate px-1"
                />
                <Button
                  variant="primary"
                  size="sm"
                  icon={copiedLink ? Check : Copy}
                  onClick={handleCopyLink}
                >
                  {copiedLink ? 'Copied' : 'Copy Link'}
                </Button>
              </div>
            </div>

            {/* QR Code Presentation Box */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
              <div className="relative shrink-0 p-3 bg-white border border-stone-200 rounded-xl shadow-subtle group">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${formTitle}`}
                    className="w-36 h-36 rounded-md object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 bg-stone-100 rounded-md animate-pulse flex items-center justify-center text-stone-400">
                    <QrCode className="w-8 h-8" />
                  </div>
                )}
                {/* Branding Badge on QR */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-white/70 rounded-xl backdrop-blur-xs">
                  <span className="text-[11px] font-bold text-primary-700 px-2 py-0.5 rounded-full bg-primary-100 border border-primary-200 shadow-xs">
                    Easy Forms
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 leading-snug">
                    Print & Digital QR Code
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Scan with any smartphone camera to open the form directly. Ideal for posters, flyers, business cards, and presentations.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Download}
                    onClick={handleDownloadPng}
                    title="Download high-resolution PNG image"
                  >
                    Download PNG
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Download}
                    onClick={handleDownloadSvg}
                    title="Download vector SVG format"
                  >
                    Download SVG
                  </Button>
                </div>
              </div>
            </div>

            {/* Open in new tab link */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1.5 transition-colors"
              >
                Open public form in new tab <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <Button variant="ghost" size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  iFrame Embed Snippet
                </label>
                <button
                  type="button"
                  onClick={handleCopyEmbed}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                >
                  {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedEmbed ? 'Copied' : 'Copy Snippet'}
                </button>
              </div>

              <div className="p-3 bg-stone-900 text-stone-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-stone-800">
                {embedCode}
              </div>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              Paste this HTML snippet into your WordPress, Webflow, Notion, Next.js, or HTML website to display your form seamlessly in place.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <Button variant="primary" size="sm" icon={Copy} onClick={handleCopyEmbed}>
                {copiedEmbed ? 'Snippet Copied' : 'Copy Embed Code'}
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
