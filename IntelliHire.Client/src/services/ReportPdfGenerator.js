import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * PDF Generation Service for Interview Reports
 * Handles both standard and detailed report PDF generation
 */

class ReportPdfGenerator {
  /**
   * Configuration for PDF generation
   */
  static PDF_CONFIG = {
    standard: {
      filename: 'Interview_Report.pdf',
      title: 'Job Interview Report',
      margin: 10,
      pageFormat: 'a4',
    },
    detailed: {
      filename: 'Interview_Report_Detailed.pdf',
      title: 'Job Interview Report - Detailed',
      margin: 10,
      pageFormat: 'a4',
    },
  };

  /**
   * Generate PDF from HTML element
   * @param {HTMLElement} element - DOM element to convert to PDF
   * @param {string} reportType - 'standard' or 'detailed'
   * @param {Object} reportData - Report metadata (candidate name, role, etc.)
   */
  static async generatePdf(element, reportType = 'standard', reportData = {}) {
    try {
      const config = this.PDF_CONFIG[reportType];

      // Validate element
      if (!element) {
        throw new Error('Invalid element provided for PDF generation');
      }

      // Show loading state if available
      this.showLoadingState(true, `Generating ${reportType} report...`);

      // Create canvas from HTML
      const canvas = await html2canvas(element, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff',
        windowHeight: element.scrollHeight,
      });

      // Initialize PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: config.pageFormat,
      });

      const imgWidth = 210 - config.margin * 2; // A4 width - margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');

      // First page
      pdf.addImage(
        imgData,
        'PNG',
        config.margin,
        config.margin,
        imgWidth,
        imgHeight
      );

      heightLeft -= pdf.internal.pageSize.getHeight() - config.margin * 2;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          imgData,
          'PNG',
          config.margin,
          position + config.margin,
          imgWidth,
          imgHeight
        );
        heightLeft -= pdf.internal.pageSize.getHeight() - config.margin * 2;
      }

      // Add metadata
      pdf.setProperties({
        title: config.title,
        subject: reportData.role || 'Interview Report',
        author: 'IntelliHire',
        creator: 'IntelliHire - Job Interview Report System',
        keywords: reportData.candidate || 'interview, report',
      });

      // Download PDF
      pdf.save(config.filename);

      // Hide loading state
      this.showLoadingState(false);

      return true;
    } catch (error) {
      console.error('PDF Generation Error:', error);
      this.showLoadingState(false);
      this.showErrorNotification(
        `Failed to generate ${reportType} report: ${error.message}`
      );
      return false;
    }
  }

  /**
   * Generate standard report PDF
   * @param {HTMLElement} element - Report container element
   * @param {Object} reportData - Report metadata
   */
  static async generateStandardReport(element, reportData = {}) {
    return this.generatePdf(element, 'standard', reportData);
  }

  /**
   * Generate detailed report PDF
   * @param {HTMLElement} element - Detailed report container element
   * @param {Object} reportData - Report metadata
   */
  static async generateDetailedReport(element, reportData = {}) {
    return this.generatePdf(element, 'detailed', reportData);
  }

  /**
   * Show/hide loading notification
   * @param {boolean} show - Show or hide loading state
   * @param {string} message - Loading message
   */
  static showLoadingState(show, message = 'Generating PDF...') {
    const loadingId = 'pdf-loading-notification';
    let loadingEl = document.getElementById(loadingId);

    if (show) {
      if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = loadingId;
        loadingEl.className =
          'fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50';
        loadingEl.innerHTML = `
          <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          <span>${message}</span>
        `;
        document.body.appendChild(loadingEl);
      }
    } else if (loadingEl) {
      loadingEl.remove();
    }
  }

  /**
   * Show error notification
   * @param {string} message - Error message
   */
  static showErrorNotification(message) {
    const errorId = 'pdf-error-notification';
    const errorEl = document.createElement('div');
    errorEl.id = errorId;
    errorEl.className =
      'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorEl.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(errorEl);

    setTimeout(() => errorEl.remove(), 5000);
  }

  /**
   * Show success notification
   * @param {string} message - Success message
   */
  static showSuccessNotification(message) {
    const successId = 'pdf-success-notification';
    const successEl = document.createElement('div');
    successEl.id = successId;
    successEl.className =
      'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse';
    successEl.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(successEl);

    setTimeout(() => successEl.remove(), 3000);
  }
}

export default ReportPdfGenerator;