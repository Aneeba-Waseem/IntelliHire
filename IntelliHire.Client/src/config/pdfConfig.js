/**
 * PDF Generation Configuration
 * Advanced settings for professional PDF generation
 */

export const PDF_GENERATION_CONFIG = {
  /**
   * Standard Report Configuration
   */
  standard: {
    filename: 'Interview_Report.pdf',
    title: 'Job Interview Report',
    metadata: {
      subject: 'Interview Assessment Report',
      author: 'IntelliHire Recruitment System',
      creator: 'IntelliHire',
      producer: 'html2pdf',
      keywords: 'interview, recruitment, assessment, report',
    },
    canvas: {
      allowTaint: true,
      useCORS: true,
      scale: 2,
      logging: false,
      backgroundColor: '#ffffff',
      windowHeight: null,
      imageTimeout: 15000,
    },
    pdf: {
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      margin: 10,
      compress: true,
      precision: 16,
      userUnit: 1.0,
    },
    notifications: {
      loading: 'Generating standard report...',
      success: 'Report downloaded successfully!',
      error: 'Failed to generate report',
    },
  },

  /**
   * Detailed Report Configuration
   */
  detailed: {
    filename: 'Interview_Report_Detailed.pdf',
    title: 'Job Interview Report - Detailed Assessment',
    metadata: {
      subject: 'Detailed Interview Assessment Report',
      author: 'IntelliHire Recruitment System',
      creator: 'IntelliHire',
      producer: 'html2pdf',
      keywords: 'interview, recruitment, detailed assessment, report, feedback',
    },
    canvas: {
      allowTaint: true,
      useCORS: true,
      scale: 2,
      logging: false,
      backgroundColor: '#ffffff',
      windowHeight: null,
      imageTimeout: 15000,
    },
    pdf: {
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      margin: 10,
      compress: true,
      precision: 16,
      userUnit: 1.0,
    },
    notifications: {
      loading: 'Generating detailed report...',
      success: 'Detailed report downloaded successfully!',
      error: 'Failed to generate detailed report',
    },
  },

  /**
   * Global PDF Settings
   */
  global: {
    // Maximum file size in MB (for warning purposes)
    maxFileSize: 50,

    // Timeout for PDF generation in milliseconds
    generationTimeout: 60000,

    // Retry attempts if generation fails
    retryAttempts: 2,
    retryDelay: 1000,

    // Notification display duration in milliseconds
    notificationDuration: 5000,

    // Enable debug logging
    debug: false,

    // Page break settings
    pageBreak: {
      enabled: true,
      avoidSelector: '[data-no-break]',
    },

    // Quality settings
    quality: {
      high: { scale: 3 },
      medium: { scale: 2 },
      low: { scale: 1 },
    },
  },

  /**
   * Error Handling Configuration
   */
  errors: {
    ELEMENT_NOT_FOUND: 'Report element could not be found',
    CANVAS_FAILED: 'Failed to convert content to image',
    PDF_GENERATION_FAILED: 'Failed to generate PDF document',
    DOWNLOAD_FAILED: 'Failed to download PDF file',
    TIMEOUT: 'PDF generation took too long',
    INVALID_DATA: 'Invalid report data provided',
  },

  /**
   * File Naming Templates
   * Use {date}, {time}, {candidate}, {role} as placeholders
   */
  fileNameTemplates: {
    standard: 'Interview_Report_{candidate}_{date}.pdf',
    detailed: 'Interview_Report_Detailed_{candidate}_{date}.pdf',
  },
};

/**
 * Utility function to get config for specific report type
 */
export const getReportConfig = (reportType = 'standard') => {
  return PDF_GENERATION_CONFIG[reportType] || PDF_GENERATION_CONFIG.standard;
};

/**
 * Utility function to generate filename with dynamic content
 */
export const generateFilename = (template, data = {}) => {
  let filename = template;

  // Replace placeholders
  filename = filename.replace('{date}', new Date().toISOString().split('T')[0]);
  filename = filename.replace('{time}', new Date().toTimeString().slice(0, 8));
  filename = filename.replace('{candidate}', data.candidate || 'Candidate');
  filename = filename.replace('{role}', data.role || 'Report');

  // Remove invalid characters
  filename = filename.replace(/[<>:"|?*]/g, '');

  return filename;
};

/**
 * Utility function to validate report data
 */
export const validateReportData = (data) => {
  const required = ['candidate', 'role'];
  const errors = [];

  if (!data) {
    return {
      valid: false,
      errors: ['Report data is required'],
    };
  }

  required.forEach((field) => {
    if (!data[field]) {
      errors.push(`${field} is required`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Utility function to get quality settings
 */
export const getQualitySettings = (quality = 'medium') => {
  return (
    PDF_GENERATION_CONFIG.global.quality[quality] ||
    PDF_GENERATION_CONFIG.global.quality.medium
  );
};

export default PDF_GENERATION_CONFIG;