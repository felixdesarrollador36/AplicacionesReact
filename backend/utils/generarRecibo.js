const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generarRecibo({
  nombreCompleto,
  concepto,
  monto,
  fecha,
  numeroRecibo,
  datosAcademia,
  logoPath,
  estado,
  mes
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const fileName = `recibo_${numeroRecibo}.pdf`;
    const filePath = path.join(__dirname, '../recibos', fileName);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const left = doc.page.margins.left;
    const top = doc.page.margins.top;

    const primary = '#1f3a5f';
    const accent = '#f2f6fb';
    const muted = '#6b7280';

    const sectionGap = 18;

    const drawSectionHeader = (label, y) => {
      doc
        .fillColor(primary)
        .fontSize(12)
        .text(label, left + 14, y + 10, { continued: false });
      doc
        .moveTo(left + 14, y + 28)
        .lineTo(left + pageWidth - 14, y + 28)
        .lineWidth(1)
        .strokeColor('#e5e7eb')
        .stroke();
    };

    const defaultLogoPath = path.resolve(__dirname, '../../frontend/src/mente-tester-logo.png');
    const resolvedLogoPath = logoPath && fs.existsSync(logoPath) ? logoPath : defaultLogoPath;

    // Header card
    const headerHeight = 110;
    doc
      .roundedRect(left, top, pageWidth, headerHeight, 10)
      .fill(accent);

    if (resolvedLogoPath && fs.existsSync(resolvedLogoPath)) {
      doc.image(resolvedLogoPath, left + 16, top + 16, { width: 68, height: 68, fit: [68, 68] });
    }

    doc
      .fillColor(primary)
      .fontSize(22)
      .text('Academia Mente Tester', left + 98, top + 22, { width: pageWidth - 190 });

    doc
      .fillColor(muted)
      .fontSize(11)
      .text('Recibo de pago', left + 98, top + 52);

    const badgeWidth = 160;
    const badgeHeight = 60;
    const badgeX = left + pageWidth - badgeWidth - 16;
    const badgeY = top + 20;

    doc
      .roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 8)
      .fill('#ffffff');

    doc
      .fillColor(primary)
      .fontSize(11)
      .text('Recibo N°', badgeX + 12, badgeY + 10)
      .fontSize(13)
      .text(`${numeroRecibo}`, badgeX + 12, badgeY + 26, { width: badgeWidth - 24 });

    doc
      .fillColor(muted)
      .fontSize(10)
      .text(`Fecha: ${fecha}`, badgeX + 12, badgeY + 44);

    let currentY = top + headerHeight + sectionGap;

    // Datos del estudiante
    doc
      .roundedRect(left, currentY, pageWidth, 150, 10)
      .fill('#ffffff');

    drawSectionHeader('Datos del estudiante', currentY);
    const labelX = left + 18;
    const valueX = left + 140;
    let rowY = currentY + 42;

    doc.fillColor(muted).fontSize(11);
    doc.text('Nombre:', labelX, rowY);
    doc.fillColor('#111827').fontSize(12).text(nombreCompleto, valueX, rowY, { width: pageWidth - 160 });
    rowY += 22;

    doc.fillColor(muted).fontSize(11);
    doc.text('Concepto:', labelX, rowY);
    doc.fillColor('#111827').fontSize(12).text(`${concepto}${mes ? ' (' + mes + ')' : ''}`, valueX, rowY, { width: pageWidth - 160 });
    rowY += 22;

    doc.fillColor(muted).fontSize(11);
    doc.text('Monto pagado:', labelX, rowY);
    doc.fillColor(primary).fontSize(13).text(`$${monto}`, valueX, rowY, { width: pageWidth - 160 });
    rowY += 22;

    if (estado) {
      doc.fillColor(muted).fontSize(11).text('Estado:', labelX, rowY);
      doc.fillColor('#10b981').fontSize(12).text(`${estado}`, valueX, rowY, { width: pageWidth - 160 });
    }

    currentY += 150 + sectionGap;

    // Datos de la academia
    doc
      .roundedRect(left, currentY, pageWidth, 120, 10)
      .fill('#ffffff');

    drawSectionHeader('Datos de la academia', currentY);
    doc
      .fillColor('#111827')
      .fontSize(11)
      .text(datosAcademia, left + 18, currentY + 42, { width: pageWidth - 36 });

    currentY += 120 + sectionGap;

    // Footer
    doc
      .fillColor(muted)
      .fontSize(9)
      .text('Gracias por confiar en nosotros.', left, currentY, { align: 'center', width: pageWidth });

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = generarRecibo;
