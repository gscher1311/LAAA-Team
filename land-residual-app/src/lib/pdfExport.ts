'use client';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportToPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Create a clone to avoid modifying the original
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = '800px';
  clone.style.padding = '40px';
  clone.style.backgroundColor = 'white';
  clone.style.color = 'black';

  // Temporarily append to body (hidden)
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  document.body.appendChild(clone);

  try {
    // Generate canvas from the element
    const canvas = await html2canvas(clone, {
      scale: 2, // Higher resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Calculate scaling to fit width
    const ratio = pdfWidth / imgWidth;
    const scaledHeight = imgHeight * ratio;

    // Handle multi-page if content is longer than one page
    let position = 0;
    let heightLeft = scaledHeight;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
    heightLeft -= pdfHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - scaledHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;
    }

    // Save the PDF
    pdf.save(filename);
  } finally {
    // Clean up the clone
    document.body.removeChild(clone);
  }
}

// Alternative: Print-optimized export
export function printReport(): void {
  window.print();
}
