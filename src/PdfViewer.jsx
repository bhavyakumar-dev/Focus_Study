function PdfViewer({ pdfUrl }) {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#fff' }}>
      <iframe 
        src={`${pdfUrl}#toolbar=0&navpanes=0`} 
        width="100%" 
        height="100%" 
        style={{ border: 'none' }}
        title="PDF Document"
      />
    </div>
  );
}

export default PdfViewer;
