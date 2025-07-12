console.log('Minimal script.js has been loaded.');

document.addEventListener('DOMContentLoaded', function() {
    const uploadSection = document.getElementById('uploadSection');
    const uploadArea = document.getElementById('uploadArea');
    const pdfFileInput = document.getElementById('pdfFile');
    const processBtn = document.getElementById('processBtn');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const metadataGrid = document.getElementById('metadataGrid');
    const downloadBtn = document.getElementById('downloadBtn');
    const processAnother = document.getElementById('processAnother');
    const fileSizeComparison = document.getElementById('fileSizeComparison');

    let cleanedPdfData = null;
    let originalFileName = 'document.pdf';

    // --- Event Listeners ---

    // Handle click to browse
    uploadArea.addEventListener('click', () => pdfFileInput.click());

    // Handle drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            pdfFileInput.files = files;
            handleFileSelection();
        }
    });

    // Handle file selection from input
    pdfFileInput.addEventListener('change', handleFileSelection);

    // Handle "Strip Metadata" button click
    processBtn.addEventListener('click', processFile);

    // Handle "Download" button click
    downloadBtn.addEventListener('click', downloadCleanedPdf);

    // Handle "Process Another" button click
    processAnother.addEventListener('click', resetToUpload);


    // --- Core Functions ---

    function handleFileSelection() {
        const file = pdfFileInput.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Please select a valid PDF file.');
            resetFileInput();
            return;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('File is too large. Maximum size is 10MB.');
            resetFileInput();
            return;
        }

        originalFileName = file.name;
        uploadArea.querySelector('h3').textContent = `Selected: ${file.name}`;
        processBtn.disabled = false;
    }

    async function processFile() {
        const file = pdfFileInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('pdf', file);

        // Switch to loading view
        uploadSection.style.display = 'none';
        loading.style.display = 'block';
        results.style.display = 'none';

        try {
            const response = await fetch('/strip-metadata', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            cleanedPdfData = data.cleanedPdf;
            displayResults(data);

        } catch (error) {
            console.error('Error processing PDF:', error);
            alert(`An error occurred: ${error.message}`);
            resetToUpload();
        }
    }

    function displayResults(data) {
        // Display metadata
        displayMetadata(data.originalMetadata);

        // Display file size comparison
        const originalSizeKB = (data.originalSize / 1024).toFixed(1);
        const cleanedSizeKB = (data.cleanedSize / 1024).toFixed(1);
        fileSizeComparison.textContent = `Original: ${originalSizeKB} KB → Cleaned: ${cleanedSizeKB} KB`;

        // Switch to results view
        loading.style.display = 'none';
        results.style.display = 'block';
    }

    function displayMetadata(metadata) {
        metadataGrid.innerHTML = '';
        const items = Object.entries(metadata);

        if (items.every(item => !item[1] || (Array.isArray(item[1]) && item[1].length === 0))) {
             metadataGrid.innerHTML = '<p>No metadata was found in the original file.</p>';
             return;
        }

        items.forEach(([key, value]) => {
            if (value && (!Array.isArray(value) || value.length > 0)) {
                const div = document.createElement('div');
                div.className = 'metadata-item';
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                let formattedValue = value;
                if (key.toLowerCase().includes('date') && value) {
                    formattedValue = new Date(value).toLocaleString();
                }
                div.innerHTML = `<strong>${formattedKey}:</strong> <span>${formattedValue}</span>`;
                metadataGrid.appendChild(div);
            }
        });
    }

    function downloadCleanedPdf() {
        if (!cleanedPdfData) return;

        const byteCharacters = atob(cleanedPdfData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cleaned-${originalFileName}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function resetFileInput() {
        pdfFileInput.value = '';
        uploadArea.querySelector('h3').textContent = 'Drag & drop your PDF file here or click to browse.';
        processBtn.disabled = true;
    }

    function resetToUpload() {
        uploadSection.style.display = 'block';
        loading.style.display = 'none';
        results.style.display = 'none';
        resetFileInput();
        metadataGrid.innerHTML = '';
        fileSizeComparison.textContent = '';
        cleanedPdfData = null;
    }
});