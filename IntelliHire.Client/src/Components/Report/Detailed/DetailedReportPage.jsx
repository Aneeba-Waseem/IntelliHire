import React, { useRef } from 'react';
import usePdfGeneration from '../../../Hooks/usePdfGeneration';

/**
 * ReportPage Component (Advanced Version with Custom Hook)
 * Displays interview report with integrated PDF download functionality
 */
const ReportPage = ({ reportData = {} }) => {
  // Refs for PDF content
  const standardReportRef = useRef(null);
  const detailedReportRef = useRef(null);

  // Use custom hook for PDF generation
  const {
    isGenerating,
    error,
    clearError,
    downloadStandardReport,
    downloadDetailedReport,
  } = usePdfGeneration();

  /**
   * Handle download button clicks
   */
  const handleDownloadStandard = async () => {
    clearError();
    await downloadStandardReport(standardReportRef.current, {
      candidate: reportData.candidate || 'Candidate',
      role: reportData.role || 'Position',
    });
  };

  const handleDownloadDetailed = async () => {
    clearError();
    await downloadDetailedReport(detailedReportRef.current, {
      candidate: reportData.candidate || 'Candidate',
      role: reportData.role || 'Position',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      {/* Error Banner */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <p>{error}</p>
          <button
            onClick={clearError}
            className="text-sm mt-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="container mx-auto px-4">
        {/* Standard Report - PDF Export #1 */}
        <div
          ref={standardReportRef}
          className="bg-white rounded-lg shadow-lg p-8 mb-8"
          style={{ isolation: 'isolate' }}
        >
          <StandardReportContent reportData={reportData} />
        </div>

        {/* Download Buttons */}
        <div className="flex gap-4 justify-center mb-8">
          <DownloadButton
            onClick={handleDownloadStandard}
            isLoading={isGenerating}
            variant="standard"
          >
            DOWNLOAD REPORT
          </DownloadButton>
          <DownloadButton
            onClick={handleDownloadDetailed}
            isLoading={isGenerating}
            variant="detailed"
          >
            DOWNLOAD DETAILED REPORT
          </DownloadButton>
        </div>

        {/* Detailed Report - PDF Export #2 */}
        <div
          ref={detailedReportRef}
          className="bg-white rounded-lg shadow-lg p-8"
          style={{ isolation: 'isolate' }}
        >
          <DetailedReportContent reportData={reportData} />
        </div>
      </div>
    </div>
  );
};

/**
 * Standard Report Content Component
 */
const StandardReportContent = ({ reportData }) => {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          JOB INTERVIEW REPORT
        </h1>
      </div>

      <div className="space-y-6">
        {/* Report Header */}
        <ReportHeader reportData={reportData} />

        {/* Domain Wise Score */}
        <div>
          <h2 className="font-bold text-slate-700 mb-4">DOMAIN WISE SCORE:</h2>
          <ScoreVisualization />
        </div>

        {/* Summary Section */}
        <SummarySection />
      </div>
    </>
  );
};

/**
 * Detailed Report Content Component
 */
const DetailedReportContent = ({ reportData }) => {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          JOB INTERVIEW REPORT
        </h1>
      </div>

      <div className="space-y-6">
        {/* Report Header */}
        <ReportHeader reportData={reportData} />

        {/* DevOps Questions Section */}
        <div>
          <h2 className="font-bold text-slate-700 mb-4">DEVOPS:</h2>
          <QuestionsSection />
        </div>

        {/* Summary Section */}
        <SummarySection />
      </div>
    </>
  );
};

/**
 * Reusable Report Header Component
 */
const ReportHeader = ({ reportData }) => (
  <div className="space-y-2 text-sm">
    <p>
      <span className="font-bold text-slate-700">CANDIDATE:</span>{' '}
      {reportData.candidate || '[Candidate Name]'}
    </p>
    <p>
      <span className="font-bold text-slate-700">ROLE:</span>{' '}
      {reportData.role || '[Position Title]'}
    </p>
    <p>
      <span className="font-bold text-slate-700">DURATION:</span>{' '}
      {reportData.duration || '[Duration]'}
    </p>
    <p>
      <span className="font-bold text-slate-700">OVERALL SCORE SCALE:</span> 1=5
      (1=BELOW BAR, 3=MEETS BAR, 5=EXCEPTIONAL)
    </p>
  </div>
);

/**
 * Score Visualization Component
 */
const ScoreVisualization = () => {
  const scores = [
    { label: 'WEB DEVELOPER', score: 4, color: 'bg-red-500' },
    { label: 'WEB DEVELOPER', score: 3, color: 'bg-blue-500' },
    { label: 'WEB DEVELOPER', score: 5, color: 'bg-green-500' },
    { label: 'WEB DEVELOPER', score: 2, color: 'bg-yellow-400' },
  ];

  return (
    <div className="flex gap-8">
      {/* Pie Chart Placeholder */}
      <div className="flex-shrink-0">
        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 via-green-400 to-red-400 flex items-center justify-center">
          <div className="text-white text-xs font-bold text-center">
            Chart Area
          </div>
        </div>
      </div>

      {/* Score Bars */}
      <div className="flex-1 space-y-3">
        {scores.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 w-32">
              {item.label}
            </span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color}`}
                style={{ width: `${(item.score / 5) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700 w-6">
              {item.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Questions Section Component
 */
const QuestionsSection = () => {
  const questions = [
    {
      q: 'How would you automate infrastructure provisioning?',
      feedback:
        'Correctly identified terraform and infrastructure as code with clear reasoning.',
      score: '4.5 / 5',
    },
    {
      q: 'How would you automate infrastructure provisioning?',
      feedback:
        'Correctly identified terraform and infrastructure as code with clear reasoning.',
      score: '4 / 5',
    },
    {
      q: 'How would you automate infrastructure provisioning?',
      feedback:
        'Correctly identified terraform and infrastructure as code with clear reasoning.',
      score: '4.5 / 5',
    },
  ];

  return (
    <div className="space-y-4 text-sm">
      {questions.map((item, idx) => (
        <div key={idx} className="border-l-4 border-slate-300 pl-4">
          <p className="font-semibold text-slate-800 mb-2">Q: {item.q}</p>
          <p className="text-slate-600 mb-2">
            <span className="font-semibold">FEEDBACK:</span> {item.feedback}
          </p>
          <p className="text-slate-700 font-bold">
            <span className="font-semibold">SCORE:</span> {item.score}
          </p>
        </div>
      ))}
    </div>
  );
};

/**
 * Reusable Summary Section Component
 */
const SummarySection = () => (
  <div className="space-y-3 text-sm">
    <h3 className="font-bold text-slate-700">SUMMARY:</h3>

    <div>
      <p className="font-bold text-slate-700 mb-2">TOP STRENGTHS:</p>
      <ul className="list-disc list-inside text-slate-600 space-y-1">
        <li>AI</li>
        <li>WEB</li>
        <li>BLAH</li>
      </ul>
    </div>

    <div>
      <p className="font-bold text-slate-700 mb-2">TOP CONCERNS:</p>
      <ul className="list-disc list-inside text-slate-600 space-y-1">
        <li>AI</li>
        <li>WEB</li>
        <li>BLAH</li>
      </ul>
    </div>

    <p className="text-slate-600">
      <span className="font-bold">RECOMMENDATION:</span>
      <br />
      HIRE / HOLD / REJECT
    </p>
  </div>
);

/**
 * Download Button Component
 */
const DownloadButton = ({ onClick, isLoading, children, variant }) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className={`px-8 py-3 font-semibold rounded-lg transition-all shadow-md ${
      isLoading
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-green-600 hover:bg-green-700 active:scale-95'
    } text-white`}
  >
    {isLoading ? (
      <span className="flex items-center gap-2">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Generating...
      </span>
    ) : (
      children
    )}
  </button>
);

export default ReportPage;