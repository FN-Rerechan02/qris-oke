const QRISGenerator = require('./qr-generator');
const PaymentChecker = require('./payment-checker');
const ReceiptGenerator = require('./receipt-generator');

class QRISPayment {
    constructor(config) {
        this.qrGenerator = new QRISGenerator(config);
        this.paymentChecker = new PaymentChecker(config);
        this.receiptGenerator = new ReceiptGenerator(config);
    }

    async generateQR(amount) {
        const qrString = this.qrGenerator.generateQrString(amount);
        const qrBuffer = await this.qrGenerator.generateQRWithLogo(qrString);
        return {
            qrString,
            qrBuffer
        };
    }

    async checkPayment(reference, amount) {
        const result = await this.paymentChecker.checkPaymentStatus(reference, amount);
        if (result.success && result.data.status === 'PAID') {
            const receipt = await this.receiptGenerator.generateReceipt(result.data);
            result.receipt = receipt;
        }
        
        return result;
    }

    async generateReceipt(transactionData) {
        return await this.receiptGenerator.generateReceipt(transactionData);
    }
}

module.exports = QRISPayment;
