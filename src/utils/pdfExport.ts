import { jsPDF } from 'jspdf';
import { Attempt } from '../types';
import { invoke } from '@tauri-apps/api/core';

export interface PDFExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

function cleanPdfText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/«/g, '"')
    .replace(/»/g, '"')
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'Oe')
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'Ae')
    .replace(/\u00a0/g, ' ');
}

export async function exportAttemptToPDF(attempt: Attempt): Promise<PDFExportResult> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - 18) {
        doc.addPage();
        y = 20;
      }
    };

    // --- 1. HEADER BANNER ---
    doc.setFillColor(11, 17, 32); // Deep navy #0b1120
    doc.rect(margin, y, contentWidth, 24, 'F');

    doc.setTextColor(56, 189, 248); // Cyan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('TEF CANADA — EXPRESSION ÉCRITE', margin + 6, y + 9);

    doc.setTextColor(148, 163, 184); // Slate
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Official Examination Evaluation & Pedagogical Diagnostic Report', margin + 6, y + 16);

    // Score Badge in Header
    doc.setFillColor(20, 184, 166); // Teal
    doc.roundedRect(pageWidth - margin - 32, y + 5, 26, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`NCLC ${attempt.nclcScore}`, pageWidth - margin - 19, y + 14, { align: 'center' });

    y += 30;

    // --- 2. SUMMARY METRICS TABLE ---
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 18, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 18, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    const dateStr = new Date(attempt.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const taskLabel = attempt.taskType === 'task1' ? 'Task 1 (25 min)' : 'Task 2 (35 min)';
    const minutesSpent = Math.round(attempt.timeSpentSeconds / 60);

    doc.text(`TASK: ${taskLabel}`, margin + 5, y + 7);
    doc.text(`DATE: ${dateStr}`, margin + 5, y + 13);

    doc.text(`WORD COUNT: ${attempt.wordCount} words`, margin + 70, y + 7);
    doc.text(`DURATION: ${minutesSpent} min elapsed`, margin + 70, y + 13);

    doc.text(`LEVEL: ${attempt.nclcLevelDescription}`, margin + 125, y + 7);
    const topError = attempt.mistakes?.[0]?.category || 'None';
    doc.text(`TOP PRIORITY: ${topError.slice(0, 18)}`, margin + 125, y + 13);

    y += 24;

    // --- 3. TOPIC & PROMPT ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Topic: ${cleanPdfText(attempt.questionTitle)}`, margin, y);
    y += 5;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const promptLines = doc.splitTextToSize(cleanPdfText(attempt.questionPrompt), contentWidth);
    doc.text(promptLines, margin, y);
    y += promptLines.length * 4 + 6;

    // --- 4. TEF SUB-SCORES ---
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('TEF Canada Sub-Scores Analysis (Grid NCLC 2026)', margin, y);
    y += 5;

    const sub = attempt.subScores || {
      coherence: attempt.nclcScore || 7,
      vocabulary: attempt.nclcScore || 7,
      taskCompletion: attempt.wordCount >= 200 ? 9 : 7,
      grammar: Math.max(4, (attempt.nclcScore || 7) - 2),
    };

    const subScoreText = `• Cohérence & Organisation: NCLC ${sub.coherence}   • Lexique (Vocabulaire): NCLC ${sub.vocabulary}   • Respect de la consigne: NCLC ${sub.taskCompletion}   • Syntaxe & Grammaire: NCLC ${sub.grammar}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(subScoreText, margin, y);
    y += 10;

    // --- 5. CANDIDATE'S ESSAY SUBMISSION ---
    checkPageBreak(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`1. Candidate Essay Submission (${attempt.wordCount} words)`, margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    const essayParas = attempt.userResponse.split('\n\n');
    for (const para of essayParas) {
      if (!para.trim()) continue;
      const lines = doc.splitTextToSize(cleanPdfText(para.trim()), contentWidth - 8);
      checkPageBreak(lines.length * 4.5 + 4);

      // Draw subtle background quote box
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 3, contentWidth, lines.length * 4.5 + 4, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, y - 3, margin, y - 3 + lines.length * 4.5 + 4);

      doc.text(lines, margin + 4, y + 2);
      y += lines.length * 4.5 + 6;
    }

    y += 4;

    // --- 6. MODEL BAND 9 REFERENCE ANSWER (IN ITS ENTIRETY) ---
    checkPageBreak(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Model Band 9 Reference Answer (Corrected in Full — NCLC 10 / C1 Master)', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);

    const modelParas = (attempt.correctedResponse || '(Model answer pending AI evaluation)').split('\n\n');
    for (const para of modelParas) {
      if (!para.trim()) continue;
      const lines = doc.splitTextToSize(cleanPdfText(para.trim()), contentWidth - 8);
      checkPageBreak(lines.length * 4.5 + 4);

      // Draw subtle green/cyan tinted quote box
      doc.setFillColor(240, 253, 250);
      doc.rect(margin, y - 3, contentWidth, lines.length * 4.5 + 4, 'F');
      doc.setDrawColor(45, 212, 191);
      doc.line(margin, y - 3, margin, y - 3 + lines.length * 4.5 + 4);

      doc.text(lines, margin + 4, y + 2);
      y += lines.length * 4.5 + 6;
    }

    y += 4;

    // --- 7. TARGET REMEDIATION & GRAMMAR RESOLUTION ---
    if (attempt.mistakes && attempt.mistakes.length > 0) {
      checkPageBreak(30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`3. Target Remediation & Linguistic Diagnostics (${attempt.mistakes.length} errors identified)`, margin, y);
      y += 7;

      attempt.mistakes.forEach((m, idx) => {
        checkPageBreak(28);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(220, 38, 38);
        doc.text(`${idx + 1}. ${cleanPdfText(m.category)}`, margin, y);
        y += 4.5;

        // Diff lines
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(185, 28, 28);
        doc.text(`   Erreur : "${cleanPdfText(m.original)}"`, margin, y);
        y += 4;

        doc.setTextColor(21, 128, 61);
        doc.text(`   Correction : "${cleanPdfText(m.correction)}"`, margin, y);
        y += 4.5;

        // English advice
        doc.setTextColor(51, 65, 85);
        const adviceText = `   Rule & How to avoid: ${cleanPdfText(m.explanation)} ${cleanPdfText(m.howToAvoid)}`;
        const adviceLines = doc.splitTextToSize(adviceText, contentWidth - 6);
        checkPageBreak(adviceLines.length * 4);
        doc.text(adviceLines, margin, y);
        y += adviceLines.length * 4 + 4;
      });
    }

    // --- 8. SAVE & EXPORT ---
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `TEF_Canada_Report_${attempt.taskType}_${dateStamp}_${attempt.id.slice(0, 6)}.pdf`;

    // Convert doc to array buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBytes = Array.from(new Uint8Array(pdfArrayBuffer));

    // Send to Tauri backend to write directly into ~/Downloads and open in macOS Preview
    try {
      const savedPath = await invoke<string>('save_pdf_report', {
        filename,
        pdfBytes,
      });

      return {
        success: true,
        filePath: savedPath,
      };
    } catch (tauriErr) {
      console.warn('Tauri invoke failed, falling back to browser download:', tauriErr);
      doc.save(filename);
      return {
        success: true,
        filePath: filename,
      };
    }
  } catch (err: any) {
    console.error('PDF export error:', err);
    return {
      success: false,
      error: err?.message || 'Failed to generate PDF',
    };
  }
}
