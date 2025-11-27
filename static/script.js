// API Configuration
const API_BASE = '/api';

// DOM Elements
const statusEl = document.getElementById('status');
const testBtn = document.getElementById('testBtn');
const responseEl = document.getElementById('response');

// Check API health on page load
async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        if (response.ok) {
            const data = await response.json();
            statusEl.textContent = `${data.status.toUpperCase()}`;
            statusEl.className = 'status-healthy';
        } else {
            throw new Error('Health check failed');
        }
    } catch (error) {
        statusEl.textContent = `Error: ${error.message}`;
        statusEl.className = 'status-error';
    }
}

// Test API endpoint
async function testAPI() {
    testBtn.disabled = true;
    testBtn.textContent = 'Loading';
    responseEl.textContent = '';
    
    try {
        const response = await fetch(`${API_BASE}/hello`);
        const data = await response.json();
        responseEl.textContent = JSON.stringify(data, null, 2);
        responseEl.style.color = '#10b981';
    } catch (error) {
        responseEl.textContent = `Error: ${error.message}`;
        responseEl.style.color = '#ef4444';
    } finally {
        testBtn.disabled = false;
        testBtn.textContent = 'Call Hello API';
    }
}

// Event Listeners
testBtn.addEventListener('click', testAPI);

// Initialize
checkHealth();

