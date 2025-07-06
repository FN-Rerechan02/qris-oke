const axios = require('axios');
const moment = require('moment');

class PaymentChecker {
    constructor(config) {
        if (!config.merchantId || !config.baseurl) {
            throw new Error('merchantId dan baseurl harus diisi');
        }
        this.config = {
            merchantId: config.merchantId,
            baseurl: config.baseurl
        };
    }

    async checkPaymentStatus(reference, amount) {
        try {
            if (!reference || !amount || amount <= 0) {
                throw new Error('Reference dan amount harus diisi dengan benar');
            }

            const response = await axios.get(this.config.baseurl);
            
            if (!response.data || !Array.isArray(response.data)) {
                throw new Error('Response tidak valid dari server atau bukan array');
            }

            const transactions = response.data;
            const matchingTransactions = transactions.filter(tx => {
                const txAmountString = tx["Nominal Nett"] ? tx["Nominal Nett"].replace(/\./g, '') : '0';
                const txAmount = parseInt(txAmountString);
                
                const txDate = moment(tx["Tanggal"], "DD/MM/YYYY HH:mm:ss").toDate();
                const now = new Date();
                const timeDiff = now - txDate;

                return txAmount === amount && 
                       tx.Status === "IN" &&
                       tx.Reff === reference &&
                       timeDiff <= 5 * 60 * 1000;
            });

            if (matchingTransactions.length > 0) {
                const latestTransaction = matchingTransactions.reduce((latest, current) => {
                    const currentDate = moment(current["Tanggal"], "DD/MM/YYYY HH:mm:ss").toDate();
                    const latestDate = moment(latest["Tanggal"], "DD/MM/YYYY HH:mm:ss").toDate();
                    return currentDate > latestDate ? current : latest;
                });
                
                return {
                    success: true,
                    data: {
                        status: 'PAID',
                        amount: parseInt(latestTransaction["Nominal Nett"].replace(/\./g, '')),
                        reference: latestTransaction["Reff"],
                        date: latestTransaction["Tanggal"],
                        brand_name: latestTransaction["Brand Name"],
                        buyer_reff: latestTransaction["Buyer Reff"]
                    }
                };
            }
            
            return {
                success: true,
                data: {
                    status: 'UNPAID',
                    amount: amount,
                    reference: reference
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Gagal cek status pembayaran: ' + error.message
            };
        }
    }
}

module.exports = PaymentChecker;