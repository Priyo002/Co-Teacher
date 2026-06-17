import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Award, Download, ArrowLeft, Loader2 } from 'lucide-react';

export default function CertificatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const certificateRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  // Simulated data
  const courseName = "Introduction to Artificial Intelligence";
  const studentName = "John Doe";
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleExportPDF = async () => {
    if (!certificateRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#0B0D17', // Match dark-900
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${courseName.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 animate-fade-in max-w-6xl mx-auto flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-8">
        <button 
          onClick={() => navigate(`/course/${id}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Course
        </button>

        <button 
          onClick={handleExportPDF}
          disabled={isExporting}
          className="btn-primary shadow-brand-500/20"
        >
          {isExporting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</>
          ) : (
            <><Download className="w-4 h-4" /> Download Certificate</>
          )}
        </button>
      </div>

      {/* Certificate Preview Container */}
      <div className="w-full max-w-[1000px] bg-dark-800 p-2 sm:p-6 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden flex justify-center items-center">
        
        {/* Actual Certificate DOM (what gets exported) */}
        <div 
          ref={certificateRef}
          className="relative w-full max-w-[900px] aspect-[1.414/1] bg-dark-900 border-[12px] border-dark-800 flex flex-col items-center justify-center p-12 text-center overflow-hidden"
          style={{ backgroundImage: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05), rgba(13, 148, 136, 0.1))' }}
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -ml-32 -mt-32"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl -mr-40 -mb-40"></div>
          
          <div className="border border-brand-500/30 w-full h-full p-8 flex flex-col items-center justify-center relative z-10">
            <Award className="w-20 h-20 text-brand-400 mb-6" />
            
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 tracking-widest uppercase">
              Certificate of Completion
            </h1>
            <div className="w-32 h-1 bg-brand-500 rounded-full mb-10"></div>
            
            <p className="text-xl text-slate-400 mb-4 font-serif italic">This is to certify that</p>
            <h2 className="text-4xl font-bold text-gradient mb-8">{studentName}</h2>
            
            <p className="text-lg text-slate-400 mb-4 font-serif italic">has successfully completed the course</p>
            <h3 className="text-3xl font-bold text-brand-400 mb-12 max-w-2xl">{courseName}</h3>
            
            <div className="flex justify-between w-full max-w-3xl mt-auto pt-8 border-t border-white/10">
              <div className="text-center">
                <p className="text-lg font-bold text-white mb-1">{date}</p>
                <p className="text-sm text-slate-500 uppercase tracking-widest">Date Issued</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gradient-brand mb-1 font-signature">Co-Teacher</p>
                <p className="text-sm text-slate-500 uppercase tracking-widest">Platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
