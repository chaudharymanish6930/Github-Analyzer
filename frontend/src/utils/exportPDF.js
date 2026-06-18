import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportProfilePDF = (profile, analytics, repositories) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageW, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('GitHub Profile Analytics', 14, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 32);

  // Profile section
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.name || profile.login, 14, 55);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  if (profile.bio) {
    const bio = doc.splitTextToSize(profile.bio, pageW - 28);
    doc.text(bio, 14, 63);
  }

  // Stats table
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Profile Statistics', 14, 82);

  autoTable(doc, {
    startY: 86,
    head: [['Metric', 'Value']],
    body: [
      ['Username', `@${profile.login}`],
      ['Location', profile.location || 'Not specified'],
      ['Company', profile.company || 'Not specified'],
      ['Public Repositories', String(profile.public_repos)],
      ['Followers', String(profile.followers)],
      ['Following', String(profile.following)],
      ['Total Stars', String(analytics.totalStars)],
      ['Total Forks', String(analytics.totalForks)],
      ['Member Since', new Date(profile.created_at).toLocaleDateString()]
    ],
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 255] }
  });

  // Top languages
  if (analytics.topLanguages?.length > 0) {
    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Languages', 14, finalY);

    autoTable(doc, {
      startY: finalY + 4,
      head: [['Language', 'Repositories', 'Percentage']],
      body: analytics.topLanguages.slice(0, 8).map(l => [l.language, String(l.count), `${l.percentage}%`]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255 }
    });
  }

  // Top repos
  if (repositories?.length > 0) {
    const finalY2 = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Top Repositories', 14, finalY2);

    autoTable(doc, {
      startY: finalY2 + 4,
      head: [['Repository', 'Language', 'Stars', 'Forks']],
      body: repositories
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 10)
        .map(r => [r.name, r.language || 'N/A', String(r.stargazers_count), String(r.forks_count)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 255] }
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`GitAnalyzer — Page ${i} of ${pageCount}`, pageW / 2, 287, { align: 'center' });
  }

  doc.save(`${profile.login}-github-analytics.pdf`);
};
