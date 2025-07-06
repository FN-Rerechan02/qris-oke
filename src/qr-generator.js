const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

class QRISGenerator {
    constructor(config) {
        if (!config.merchantId || !config.baseQrString) {
            throw new Error('merchantId dan baseQrString harus diisi');
        }

        this.config = {
            merchantId: config.merchantId,
            baseQrString: config.baseQrString,
            logoPath: config.logoPath
        };
    }

    async generateQRWithLogo(qrString) {
        try {
            if (!qrString) {
                throw new Error('qrString tidak boleh kosong');
            }
            const canvas = createCanvas(500, 500);
            const ctx = canvas.getContext('2d');
            await QRCode.toCanvas(canvas, qrString, {
                errorCorrectionLevel: 'H',
                margin: 2,
                width: 500,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            if (this.config.logoPath && fs.existsSync(this.config.logoPath)) {
                const logo = await loadImage(this.config.logoPath);
                const logoSize = canvas.width * 0.2;
                const logoPosition = (canvas.width - logoSize) / 2;

                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(logoPosition - 5, logoPosition - 5, logoSize + 10, logoSize + 10);
                ctx.drawImage(logo, logoPosition, logoPosition, logoSize, logoSize);
            }
            return canvas.toBuffer('image/png');
        } catch (error) {
            throw new Error('Gagal generate QR: ' + error.message);
        }
    }

    generateQrString(amount) {
        try {
            if (!amount || amount <= 0) {
                throw new Error('Nominal harus lebih besar dari 0');
            }
            if (!this.config.baseQrString.includes("5802ID")) {
                throw new Error("Format QRIS tidak valid");
            }
            const finalAmount = Math.floor(amount);
            const qrisBase = this.config.baseQrString.slice(0, -4).replace("010211", "010212");
            const nominalStr = finalAmount.toString();
            const nominalTag = `54${nominalStr.length.toString().padStart(2, '0')}${nominalStr}`;
            const insertPosition = qrisBase.indexOf("5802ID");
            const qrisWithNominal = qrisBase.slice(0, insertPosition) + nominalTag + qrisBase.slice(insertPosition);
            const checksum = this.calculateCRC16(qrisWithNominal);
            
            return qrisWithNominal + checksum;
        } catch (error) {
            throw new Error('Gagal generate string QRIS: ' + error.message);
        }
    }

    calculateCRC16(str) {
        try {
            if (!str) {
                throw new Error('String tidak boleh kosong');
            }

            let crc = 0xFFFF;
            for (let i = 0; i < str.length; i++) {
                crc ^= str.charCodeAt(i) << 8;
                for (let j = 0; j < 8; j++) {
                    crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
                }
                crc &= 0xFFFF;
            }
            return crc.toString(16).toUpperCase().padStart(4, '0');
        } catch (error) {
            throw new Error('Gagal kalkulasi CRC16: ' + error.message);
        }
    }
}

module.exports = QRISGenerator;
