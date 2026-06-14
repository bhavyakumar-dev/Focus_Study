import { useEffect } from 'react';

function PdfViewer({ pdfUrl }) {
  // Hack to fix Chrome bug where body overflow:hidden hides iframe scrollbars
  useEffect(() => {
    document.body.style.overflow = 'visible';
    return () => {
      document.body.style.overflow = 'hidden';
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', flex: 1, backgroundColor: '#fff' }}>
      <embed 
        src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`} 
        type="application/pdf"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        title="PDF Document"
      />
    </div>
  );
}

export default PdfViewer;
