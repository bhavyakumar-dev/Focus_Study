function PdfViewer({ pdfUrl }) {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#fff' }}>
      <object 
        data={pdfUrl} 
        type="application/pdf" 
        width="100%" 
        height="100%" 
        style={{ border: 'none' }}
      >
        <p>Your browser does not support PDFs. <a href={pdfUrl}>Download the PDF</a>.</p>
      </object>
    </div>
  );
}

export default PdfViewer;
