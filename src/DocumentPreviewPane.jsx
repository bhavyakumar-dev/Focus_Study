import React, { useState, useEffect, useRef } from 'react';
import { Download, X } from 'lucide-react';
import { marked } from 'marked';

export default function DocumentPreviewPane({ activeFile, onClose }) {
  const [htmlContent, setHtmlContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (activeFile.language === 'markdown') {
      try {
        setHtmlContent(marked.parse(activeFile.content));
      } catch (e) {
        setHtmlContent('<p style="color:red">Error parsing Markdown</p>');
      }
    }
  }, [activeFile]);

  const handleDownloadWord = async () => {
    setIsGenerating(true);
    try {
      const htmlToDocx = (await import('html-to-docx')).default;
      const htmlString = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${htmlContent}</body></html>`;
      const fileBuffer = await htmlToDocx(htmlString, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
      });
      const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeFile.name.replace('.md', '')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating Word document:', err);
      alert('Failed to generate Word document.');
    } finally {
      setIsGenerating(false);
    }
  };

  const latexPreviewUrl = activeFile.language === 'latex' 
    ? `https://latexonline.cc/compile?text=${encodeURIComponent(activeFile.content)}` 
    : '';

  return (
    <div style={{ width: '400px', backgroundColor: '#fff', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column', flexShrink: 0, color: '#333' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9' }}>
        <strong style={{ fontSize: '0.85rem' }}>
          {activeFile.language === 'latex' ? 'LaTeX Preview' : 'Word Preview'}
        </strong>
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeFile.language === 'markdown' && (
            <button 
              onClick={handleDownloadWord} 
              disabled={isGenerating}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#2563eb', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              <Download size={12} /> {isGenerating ? 'Generating...' : 'Download .docx'}
            </button>
          )}
          {activeFile.language === 'latex' && (
            <a 
              href={latexPreviewUrl} 
              download={`${activeFile.name.replace('.tex', '')}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'none' }}
            >
              <Download size={12} /> Download PDF
            </a>
          )}
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', padding: '2px' }}>
            <X size={14} />
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto', padding: activeFile.language === 'markdown' ? '20px' : '0' }}>
        {activeFile.language === 'markdown' ? (
          <div 
            style={{ fontFamily: '"Inter", sans-serif', lineHeight: '1.6', fontSize: '0.9rem' }}
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
          />
        ) : (
          <iframe 
            src={latexPreviewUrl} 
            title="LaTeX PDF Preview" 
            style={{ width: '100%', height: '100%', border: 'none' }} 
          />
        )}
      </div>
    </div>
  );
}
