// State
let state = {
    page: 'details',
    payment: '',
    qrTimer: null,
    qrTime: 300,
    qrRef: '',
    orderId: '404-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
    transId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase()
};

// Init
document.addEventListener('DOMContentLoaded', function() {
    initPhone();
});

// Phone Input
function initPhone() {
    const phone = document.getElementById('phone');
    if (phone) {
        window.phoneInput = window.intlTelInput(phone, {
            initialCountry: "us",
            preferredCountries: ['us', 'my', 'sg', 'gb', 'au', 'jp', 'kr', 'cn'],
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
        });
        phone.value = '+1 (123) 456-7890';
    }
}

// Navigation
function goToPayment() {
    if (!validateDetails()) return;
    saveDetails();
    showPage('payment');
}

function goBack() {
    showPage('details');
    if (state.qrTimer) clearInterval(state.qrTimer);
}

function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page' + page.charAt(0).toUpperCase() + page.slice(1)).classList.add('active');
    state.page = page;
}

// Validation
function validateDetails() {
    let valid = true;
    clearErrors();
    
    const name = document.getElementById('fullName').value.trim();
    if (!name) { showError('nameError', 'Enter name'); valid = false; }
    
    const email = document.getElementById('email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('emailError', 'Invalid email'); valid = false; }
    
    if (!window.phoneInput?.isValidNumber()) { showError('phoneError', 'Invalid phone'); valid = false; }
    
    const address = document.getElementById('address').value.trim();
    if (!address) { showError('addressError', 'Enter address'); valid = false; }
    
    return valid;
}

function saveDetails() {
    state.customer = {
        name: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: window.phoneInput?.getNumber() || '',
        address: document.getElementById('address').value.trim()
    };
}

// Payment Selection
function selectPayment(method) {
    state.payment = method;
    
    if (state.qrTimer) {
        clearInterval(state.qrTimer);
        state.qrTimer = null;
    }
    
    document.querySelectorAll('.payment-form, .qr-payment, .bank-form').forEach(el => {
        el.classList.add('hidden');
    });
    
    const payBtn = document.getElementById('payButton');
    
    if (method === 'card') {
        document.getElementById('cardForm').classList.remove('hidden');
        payBtn.textContent = 'Complete Payment';
    } else if (method === 'tng' || method === 'grabpay') {
        document.getElementById(method + 'QR').classList.remove('hidden');
        generateQR(method);
        startTimer(method);
        payBtn.textContent = 'I scanned the QR';
    } else if (method === 'bank') {
        document.getElementById('bankForm').classList.remove('hidden');
        payBtn.textContent = 'Proceed to Bank';
    }
}

// QR Functions
function generateQR(type) {
    state.qrRef = type.toUpperCase() + '-' + Math.floor(Math.random() * 1000000);
    console.log('QR Generated:', state.qrRef);
}

function startTimer(type) {
    state.qrTime = 300;
    const timer = document.getElementById(type + 'Timer');
    if (!timer) return;
    
    state.qrTimer = setInterval(() => {
        state.qrTime--;
        const min = Math.floor(state.qrTime / 60);
        const sec = state.qrTime % 60;
        timer.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        
        if (state.qrTime <= 0) {
            clearInterval(state.qrTimer);
            timer.textContent = 'Expired';
            alert('QR expired. Generate new one.');
        }
    }, 1000);
}

function refreshQR(type) {
    generateQR(type);
    if (state.qrTimer) clearInterval(state.qrTimer);
    startTimer(type);
}

// Process Payment
function processPayment() {
    if (!state.payment) return alert('Select payment method');
    
    if (state.payment === 'card') {
        if (!validateCard()) return;
    } else if (state.payment === 'bank') {
        const bank = document.getElementById('bankSelect');
        if (!bank.value) return alert('Select bank');
    } else if (state.payment === 'tng' || state.payment === 'grabpay') {
        if (!confirm(`Did you pay with ${state.payment === 'tng' ? 'Touch \'n Go' : 'Grab'}?\nQR: ${state.qrRef}\nAmount: RM 486.97`)) return;
    }
    
    completePayment();
}

function validateCard() {
    const card = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const expiry = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const name = document.getElementById('cardName').value.trim();
    
    if (!/^\d{16}$/.test(card)) return alert('Invalid card number');
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return alert('Invalid expiry');
    if (!/^\d{3,4}$/.test(cvv)) return alert('Invalid CVV');
    if (!name) return alert('Enter card name');
    
    return true;
}

function completePayment() {
    const btn = document.getElementById('payButton');
    btn.textContent = 'Processing...';
    btn.disabled = true;
    
    if (state.qrTimer) {
        clearInterval(state.qrTimer);
        state.qrTimer = null;
    }
    
    setTimeout(() => {
        updateReceipt();
        showPage('receipt');
        btn.textContent = 'Complete Payment';
        btn.disabled = false;
    }, 1500);
}

// Update Receipt
function updateReceipt() {
    document.getElementById('receiptOrderId').textContent = state.orderId;
    document.getElementById('receiptDate').textContent = new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    const methods = {
        'card': 'Credit Card',
        'tng': 'Touch \'n Go',
        'grabpay': 'GrabPay',
        'bank': 'Online Banking'
    };
    document.getElementById('receiptPaymentMethod').textContent = methods[state.payment] || 'Unknown';
    
    if (state.qrRef) {
        document.getElementById('qrRow').style.display = 'flex';
        document.getElementById('receiptQRRef').textContent = state.qrRef;
    }
    
    document.getElementById('receiptTransaction').textContent = state.transId;
    
    if (state.customer) {
        document.getElementById('receiptName').textContent = state.customer.name;
        document.getElementById('receiptEmail').textContent = state.customer.email;
        document.getElementById('receiptPhone').textContent = state.customer.phone;
        document.getElementById('receiptAddress').textContent = state.customer.address;
    }
}

// Receipt Functions
function printReceipt() {
    const content = `
        <html>
        <head><title>Receipt - 404WEAR</title>
        <style>body{font-family:Arial;padding:40px;max-width:500px;margin:auto}
        .header{text-align:center;margin-bottom:30px}
        .receipt{border:1px solid #000;padding:30px;border-radius:8px}
        .row{display:flex;justify-content:space-between;margin-bottom:8px}
        .total{border-top:2px solid #000;padding-top:15px;margin-top:15px;font-weight:bold}
        </style></head>
        <body>
        <div class="header"><h1>404WEAR</h1><p>PREMIUM FASHION</p></div>
        <div class="receipt">
            <h2>Payment Receipt</h2>
            <div class="row"><strong>Order:</strong> <span>${state.orderId}</span></div>
            <div class="row"><strong>Date:</strong> <span>${new Date().toLocaleString()}</span></div>
            <div class="row"><strong>Payment:</strong> <span>${document.getElementById('receiptPaymentMethod').textContent}</span></div>
            <hr>
            <div class="row"><span>Headphones × 1</span> <span>RM 349.99</span></div>
            <div class="row"><span>T-Shirt × 2</span> <span>RM 99.98</span></div>
            <div class="row"><span>Shipping</span> <span>RM 10.00</span></div>
            <div class="row total"><strong>Total</strong> <strong>RM 486.97</strong></div>
            <hr>
            <div class="row"><strong>Customer:</strong> <span>${state.customer?.name}</span></div>
            <div class="row"><strong>Email:</strong> <span>${state.customer?.email}</span></div>
        </div>
        </body></html>
    `;
    
    const win = window.open('', '_blank');
    win.document.write(content);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
}

function copyTransId() {
    const id = document.getElementById('receiptTransaction').textContent;
    navigator.clipboard.writeText(id).then(() => {
        const btn = document.querySelector('.transaction button');
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = original, 2000);
    });
}

function goHome() {
    window.location.href = 'https://www.wix.com';
}

// Helpers
function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
}

function clearErrors() {
    document.querySelectorAll('.error').forEach(el => el.textContent = '');
}

// Input Formatting
document.addEventListener('input', function(e) {
    if (e.target.id === 'cardNumber') {
        let val = e.target.value.replace(/\D/g, '');
        let formatted = '';
        for (let i = 0; i < val.length && i < 16; i++) {
            if (i > 0 && i % 4 === 0) formatted += ' ';
            formatted += val[i];
        }
        e.target.value = formatted;
    }
    
    if (e.target.id === 'expiryDate') {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length >= 2) {
            e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4);
        }
    }
});