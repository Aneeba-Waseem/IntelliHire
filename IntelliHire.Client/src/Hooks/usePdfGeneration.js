import { useState, useCallback } from 'react';
import ReportPdfGenerator from '../services/ReportPdfGenerator';

/**
 * Custom hook for managing report PDF generation
 * Handles loading states, error handling, and success notifications
 */
export const usePdfGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Generate PDF and trigger download
   * @param {HTMLElement} element - DOM element to convert
   * @param {string} reportType - 'standard' or 'detailed'
   * @param {Object} reportData - Report metadata
   * @returns {Promise<boolean>} Success status
   */
  const generateAndDownloadPdf = useCallback(
    async (element, reportType = 'standard', reportData = {}) => {
      setIsGenerating(true);
      setError(null);

      try {
        if (!element) {
          throw new Error('Report element not found');
        }

        const success = await ReportPdfGenerator.generatePdf(
          element,
          reportType,
          reportData
        );

        if (success) {
          const message =
            reportType === 'standard'
              ? 'Report downloaded successfully!'
              : 'Detailed report downloaded successfully!';

          ReportPdfGenerator.showSuccessNotification(message);
          return true;
        }

        return false;
      } catch (err) {
        const errorMessage = err.message || 'Failed to generate PDF';
        setError(errorMessage);
        ReportPdfGenerator.showErrorNotification(errorMessage);
        return false;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  /**
   * Download standard report
   */
  const downloadStandardReport = useCallback(
    (element, reportData) => {
      return generateAndDownloadPdf(element, 'standard', reportData);
    },
    [generateAndDownloadPdf]
  );

  /**
   * Download detailed report
   */
  const downloadDetailedReport = useCallback(
    (element, reportData) => {
      return generateAndDownloadPdf(element, 'detailed', reportData);
    },
    [generateAndDownloadPdf]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isGenerating,
    error,
    clearError,
    generateAndDownloadPdf,
    downloadStandardReport,
    downloadDetailedReport,
  };
};

export default usePdfGeneration;