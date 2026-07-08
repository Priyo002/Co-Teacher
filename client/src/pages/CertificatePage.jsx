import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Award, Download, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { useApi } from '../hooks/useApi';

export default function CertificatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const certificateRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchApi = useApi();

  useEffect(() => {
    fetchApi(`/certificates/${id}`)
      .then(data => {
        if (!data || data.error) throw new Error(data?.error || 'Certificate not found');
        setCertificate(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id, fetchApi]);

  const handleExportPDF = async () => {
    if (!certificateRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff', // Match white
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      
      // Make the entire PDF a clickable link to verify authenticity
      const verifyUrl = `${window.location.origin}/certificate/${certificate.certificateId}`;
      pdf.link(0, 0, canvas.width / 2, canvas.height / 2, { url: verifyUrl });
      
      pdf.save(`${certificate?.courseTitle?.replace(/\s+/g, '_') || 'Course'}_Certificate.pdf`);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };



  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4 text-center">
        <Award className="w-16 h-16 text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Certificate Not Found</h2>
        <p className="text-slate-600 mb-6">This certificate link is invalid or the certificate does not exist.</p>
        <button onClick={() => navigate('/')} className="btn-primary">Go to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 animate-fade-in max-w-6xl mx-auto flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-8">
        <button 
          onClick={() => navigate(`/course/${certificate.course}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Course
        </button>

        <button 
          onClick={handleExportPDF}
          disabled={isExporting}
          className="btn-primary shadow-md shadow-brand-500/20 transform hover:-translate-y-0.5"
        >
          {isExporting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</>
          ) : (
            <><Download className="w-4 h-4" /> Download Certificate</>
          )}
        </button>
      </div>

      {/* Certificate Preview Container */}
      <div className="w-full max-w-[1000px] bg-white p-2 sm:p-6 rounded-2xl border border-slate-200 shadow-md relative overflow-hidden">
        {/* Certificate Container Wrapper for Scroll */}
        <div className="w-full overflow-x-auto flex justify-center pb-8 px-4">
          {/* Actual Certificate DOM (what gets exported) */}
          <div 
            ref={certificateRef}
            className="relative w-[900px] h-[636px] min-w-[900px] shrink-0 bg-white text-slate-800 flex flex-col items-center justify-center p-8 overflow-hidden shadow-2xl mx-auto"
            style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 0%, #f8fafc 100%)' }}
          >
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 10px)' }}></div>
            
            {/* Outer Border */}
            <div className="absolute inset-4 border border-slate-200"></div>
            {/* Inner Border */}
            <div className="absolute inset-6 border-[3px] border-slate-800 pointer-events-none flex items-center justify-center">
              {/* Corner ornaments */}
              <div className="absolute top-0 left-0 w-3 h-3 bg-slate-800 -mt-1.5 -ml-1.5"></div>
              <div className="absolute top-0 right-0 w-3 h-3 bg-slate-800 -mt-1.5 -mr-1.5"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 bg-slate-800 -mb-1.5 -ml-1.5"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-slate-800 -mb-1.5 -mr-1.5"></div>
            </div>
            
            <div className="w-full h-full p-8 flex flex-col items-center justify-center relative z-10 text-center">
              
              <div className="mb-4 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border border-slate-300 flex items-center justify-center mb-4 bg-white shadow-sm">
                  <ShieldCheck size={32} color="#1e293b" strokeWidth={1.5} />
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-widest uppercase pb-2">
                  Certificate of Completion
                </h1>
                <p className="text-sm tracking-[0.3em] text-slate-500 uppercase">Proudly Presented To</p>
              </div>
              
              <div className="mb-4 text-center w-full max-w-md mx-auto">
                <h2 className="text-5xl font-bold text-slate-800 font-display italic px-12 pb-4" style={{ lineHeight: '1.2' }}>
                  {certificate.userName}
                </h2>
                <div className="w-full h-[2px] bg-slate-200 mx-auto mb-4"></div>
              </div>
              
              <p className="text-lg text-slate-600 mb-2 font-serif max-w-2xl leading-relaxed">
                For successfully completing the comprehensive requirements and demonstrating proficiency in
              </p>
              <h3 className="text-3xl font-bold text-slate-900 mb-8 max-w-2xl font-serif">{certificate.courseTitle}</h3>
              
              <div className="flex justify-between items-end w-full max-w-3xl mt-auto px-4 sm:px-8">
                <div className="text-center w-32 sm:w-48">
                  <p className="text-lg font-bold text-slate-800 pb-4" style={{ lineHeight: '1.2' }}>
                    {new Date(certificate.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <div className="w-full h-[1px] bg-slate-300 mx-auto mb-3"></div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Date Issued</p>
                </div>
                
                <div className="text-center pb-2">
                  <Award size={48} color="#f59e0b" strokeWidth={1.5} className="mb-2 mx-auto" />
                  <p className="text-[10px] font-mono text-slate-400">ID: {certificate.certificateId.substring(0, 8).toUpperCase()}</p>
                </div>

                <div className="text-center w-32 sm:w-48">
                  <p className="text-3xl font-bold text-slate-800 pb-2" style={{ fontFamily: "cursive, 'Brush Script MT'", lineHeight: '1.2' }}>
                    Co-Teacher
                  </p>
                  <div className="w-full h-[1px] bg-slate-300 mx-auto mb-2"></div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Lead Instructor</p>
                </div>
              </div>

              {/* Verification Link in normal flow to guarantee it's below signatures */}
              <div className="w-full text-center mt-6 z-20">
                <p className="text-[8px] text-slate-400 font-mono tracking-widest">Verify Authenticity: {window.location.origin}/certificate/{certificate.certificateId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
