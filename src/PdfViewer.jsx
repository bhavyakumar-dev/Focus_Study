function PdfViewer({ pdfUrl }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
      <iframe 
        src={`${pdfUrl}#view=FitH&scrollbar=1`} 
        style={{ flex: 1, width: '100%', border: 'none' }}
        title="PDF Document"
      />
    </div>
  );
}

export default PdfViewer;
