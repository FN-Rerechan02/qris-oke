const PDFDocument = require('pdfkit');
const fs = require('fs');
const moment = require('moment');
const path = require('path');

class ReceiptGenerator {
    constructor(config) {
        this.config = config;
    }

    async generateReceipt(transactionData) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: [300, 450],
                    margin: 20,
                    layout: 'portrait'
                });

                const fileName = `receipt_${transactionData.reference}_${Date.now()}.pdf`;
                const filePath = `receipts/${fileName}`;
                if (!fs.existsSync('receipts')) {
                    fs.mkdirSync('receipts');
                }
                const writeStream = fs.createWriteStream(filePath);
                doc.pipe(writeStream);

                if (this.config.logoPath && fs.existsSync(this.config.logoPath)) {
                    const logoWidth = 40;
                    const logoHeight = 40;
                    const logoX = 20 + (260 - logoWidth) / 2;
                    const logoY = 10;
                    doc.image(this.config.logoPath, logoX, logoY, { width: logoWidth, height: logoHeight });
                    doc.y = logoY + logoHeight + 4;
                } else {
                    doc.moveDown(0.5);
                }

                doc.fontSize(14)
                   .fillColor('black')
                   .font('Helvetica-Bold');
                const headerText = 'QRIS PAYMENT RECEIPT';
                const headerWidth = doc.widthOfString(headerText);
                doc.text(headerText, 20 + (260 - headerWidth) / 2, doc.y, { width: headerWidth });

                doc.fontSize(9)
                   .font('Helvetica');
                const merchantText = this.config.storeName || 'STORE NAME';
                const merchantWidth = doc.widthOfString(merchantText);
                doc.text(merchantText, 20 + (260 - merchantWidth) / 2, doc.y, { width: merchantWidth });

                doc.moveDown(0.3);
                const lineY = doc.y;
                doc.moveTo(20, lineY)
                   .lineTo(280, lineY)
                   .strokeColor('#888').stroke();

                doc.moveDown(0.5);
                doc.fontSize(9)
                   .font('Helvetica-Bold');
                const detailsTitle = 'TRANSACTION DETAILS';
                const detailsTitleWidth = doc.widthOfString(detailsTitle);
                doc.text(detailsTitle, 20 + (260 - detailsTitleWidth) / 2, doc.y, { width: detailsTitleWidth });
                doc.moveDown(0.2);

                const formattedDate = moment(transactionData.date).format('DD/MM/YYYY HH:mm:ss');
                const details = [
                    ['Reference', transactionData.reference],
                    ['Date', formattedDate],
                    ['Amount', `Rp ${transactionData.amount.toLocaleString('id-ID')}`],
                    ['Status', transactionData.status],
                    ['Payment Method', transactionData.brand_name || '-'],
                    ['Buyer Reference', transactionData.buyer_reff || '-']
                ];

                const tableWidth = 240;
                const startX = (300 - tableWidth) / 2;
                const labelWidth = 100;
                const valueWidth = 130;
                let y = doc.y + 5;

                details.forEach(([label, value], idx) => {
                    doc.font('Helvetica-Bold')
                       .fontSize(9)
                       .fillColor('black')
                       .text(label, startX, y, { width: labelWidth, align: 'left' });
                    doc.font('Helvetica')
                       .fontSize(9)
                       .fillColor('black')
                       .text(value, startX + labelWidth, y, { width: valueWidth, align: 'right' });

                    y += 14;
                    doc.moveTo(startX, y)
                       .lineTo(startX + labelWidth + valueWidth, y)
                       .strokeColor('#e0e0e0').stroke();
                    y += 2;
                });

                y += 6;
                doc.moveTo(20, y)
                   .lineTo(280, y)
                   .strokeColor('#888').stroke();

                y += 12;
                doc.text('Thank you for your payment!', 0, y, { align: 'right', width: 260 });
                y += 12;
                doc.text(`Receipt No: ${transactionData.reference}`, 0, y, { align: 'right', width: 260 });

                doc.end();

                writeStream.on('finish', () => {
                    resolve({
                        success: true,
                        filePath: filePath,
                        fileName: fileName
                    });
                });

                writeStream.on('error', (error) => {
                    reject(error);
                });

            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = ReceiptGenerator;
