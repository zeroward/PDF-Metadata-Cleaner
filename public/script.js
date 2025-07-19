console.log('Enhanced script.js has been loaded.');

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const modeSelection = document.getElementById('modeSelection');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const processingButtons = document.querySelectorAll('.processing-btn');
    const processingInfo = document.getElementById('processingInfo');
    const uploadSection = document.getElementById('uploadSection');
    const uploadArea = document.getElementById('uploadArea');
    const pdfFileInput = document.getElementById('pdfFile');
    const processBtn = document.getElementById('processBtn');
    const metadataEditor = document.getElementById('metadataEditor');
    const clearMetadataBtn = document.getElementById('clearMetadataBtn');
    const processWithMetadataBtn = document.getElementById('processWithMetadataBtn');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const metadataGrid = document.getElementById('metadataGrid');
    const downloadBtn = document.getElementById('downloadBtn');
    const processAnother = document.getElementById('processAnother');
    const fileSizeComparison = document.getElementById('fileSizeComparison');
    const successMessage = document.getElementById('successMessage');

    // Metadata form inputs
    const titleInput = document.getElementById('title');
    const authorInput = document.getElementById('author');
    const subjectInput = document.getElementById('subject');
    const keywordsInput = document.getElementById('keywords');
    const creatorInput = document.getElementById('creator');
    const producerInput = document.getElementById('producer');

    let currentMode = 'strip';
    let currentProcessing = 'server';
    let cleanedPdfData = null;
    let originalFileName = 'document.pdf';
    let originalMetadata = null;

    // Mode selection
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            updateInterface();
        });
    });

    // Processing location selection
    processingButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            processingButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentProcessing = btn.dataset.processing;
            updateProcessingInfo();
        });
    });

    function updateProcessingInfo() {
        const file = pdfFileInput.files[0];
        if (file) {
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > 10 && currentProcessing === 'client') {
                processingInfo.innerHTML = '<p>⚠️ Large file detected. Client processing may be slow or fail. Consider using server processing for files over 10MB.</p>';
            } else if (currentProcessing === 'client') {
                processingInfo.innerHTML = '<p>🔒 Your file will be processed locally in your browser. No data will be sent to our servers.</p>';
            } else {
                processingInfo.innerHTML = '<p>🖥️ File will be processed on our secure server. Recommended for large files and better reliability.</p>';
            }
        } else {
            if (currentProcessing === 'client') {
                processingInfo.innerHTML = '<p>🔒 Files will be processed locally in your browser for maximum privacy.</p>';
            } else {
                processingInfo.innerHTML = '<p>🖥️ Files will be processed on our secure server for better reliability.</p>';
            }
        }
    }

    function updateInterface() {
        if (currentMode === 'strip') {
            metadataEditor.style.display = 'none';
            processBtn.textContent = 'Strip Metadata';
            processBtn.onclick = processFile;
        } else {
            metadataEditor.style.display = 'block';
            processBtn.textContent = 'Load Metadata';
            processBtn.onclick = loadMetadata;
        }
        updateProcessingInfo();
    }

    // File upload handling
    uploadArea.addEventListener('click', () => pdfFileInput.click());

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

    pdfFileInput.addEventListener('change', handleFileSelection);

    clearMetadataBtn.addEventListener('click', clearMetadataForm);
    processWithMetadataBtn.addEventListener('click', processWithCustomMetadata);
    downloadBtn.addEventListener('click', downloadCleanedPdf);
    processAnother.addEventListener('click', resetToUpload);

    function handleFileSelection() {
        const file = pdfFileInput.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Please select a valid PDF file.');
            resetFileInput();
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            alert('File is too large. Maximum size is 50MB.');
            resetFileInput();
            return;
        }

        originalFileName = file.name;
        uploadArea.querySelector('h3').textContent = `Selected: ${file.name}`;
        processBtn.disabled = false;
        updateProcessingInfo();
    }

    async function loadMetadata() {
        const file = pdfFileInput.files[0];
        if (!file) return;

        if (currentProcessing === 'client') {
            await loadMetadataClient(file);
        } else {
            await loadMetadataServer(file);
        }
    }

    async function loadMetadataClient(file) {
        uploadSection.style.display = 'none';
        loading.style.display = 'block';
        results.style.display = 'none';

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            
            const metadata = {
                title: pdfDoc.getTitle() || '',
                author: pdfDoc.getAuthor() || '',
                subject: pdfDoc.getSubject() || '',
                keywords: pdfDoc.getKeywords() || [],
                producer: pdfDoc.getProducer() || '',
                creator: pdfDoc.getCreator() || '',
                creationDate: pdfDoc.getCreationDate()?.toISOString() || '',
                modificationDate: pdfDoc.getModificationDate()?.toISOString() || '',
                pageCount: pdfDoc.getPageCount()
            };

            originalMetadata = metadata;
            populateMetadataForm(metadata);
            loading.style.display = 'none';
            uploadSection.style.display = 'block';

        } catch (error) {
            console.error('Error loading metadata:', error);
            alert(`An error occurred: ${error.message}`);
            resetToUpload();
        }
    }

    async function loadMetadataServer(file) {
        const formData = new FormData();
        formData.append('pdf', file);

        uploadSection.style.display = 'none';
        loading.style.display = 'block';
        results.style.display = 'none';

        try {
            const response = await fetch('/get-metadata', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            originalMetadata = data.metadata;
            populateMetadataForm(data.metadata);
            loading.style.display = 'none';
            uploadSection.style.display = 'block';

        } catch (error) {
            console.error('Error loading metadata:', error);
            alert(`An error occurred: ${error.message}`);
            resetToUpload();
        }
    }

    function populateMetadataForm(metadata) {
        titleInput.value = metadata.title || '';
        authorInput.value = metadata.author || '';
        subjectInput.value = metadata.subject || '';
        keywordsInput.value = Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : metadata.keywords || '';
        creatorInput.value = metadata.creator || '';
        producerInput.value = metadata.producer || '';
    }

    function clearMetadataForm() {
        titleInput.value = '';
        authorInput.value = '';
        subjectInput.value = '';
        keywordsInput.value = '';
        creatorInput.value = '';
        producerInput.value = '';
    }

    async function processFile() {
        const file = pdfFileInput.files[0];
        if (!file) return;

        if (currentProcessing === 'client') {
            await processFileClient(file);
        } else {
            await processFileServer(file);
        }
    }

    async function processFileClient(file) {
        uploadSection.style.display = 'none';
        loading.style.display = 'block';
        results.style.display = 'none';

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            
            const originalMetadata = {
                title: pdfDoc.getTitle() || '',
                author: pdfDoc.getAuthor() || '',
                subject: pdfDoc.getSubject() || '',
                keywords: pdfDoc.getKeywords() || [],
                producer: pdfDoc.getProducer() || '',
                creator: pdfDoc.getCreator() || '',
                creationDate: pdfDoc.getCreationDate()?.toISOString() || '',
                modificationDate: pdfDoc.getModificationDate()?.toISOString() || '',
                pageCount: pdfDoc.getPageCount()
            };
            
            const newPdfDoc = await PDFLib.PDFDocument.create();
            const copiedPages = await newPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach(page => newPdfDoc.addPage(page));

            const pdfBytes = await newPdfDoc.save();
            cleanedPdfData = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
            
            displayResults({
                originalMetadata,
                cleanedPdf: cleanedPdfData,
                originalSize: file.size,
                cleanedSize: pdfBytes.length
            }, 'Metadata Successfully Removed!');

        } catch (error) {
            console.error('Error processing PDF:', error);
            alert(`An error occurred: ${error.message}`);
            resetToUpload();
        }
    }

    async function processFileServer(file) {
        const formData = new FormData();
        formData.append('pdf', file);

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
            originalMetadata = data.originalMetadata;
            displayResults(data, 'Metadata Successfully Removed!');

        } catch (error) {
            console.error('Error processing PDF:', error);
            alert(`An error occurred: ${error.message}`);
            resetToUpload();
        }
    }

    async function processWithCustomMetadata() {
        const file = pdfFileInput.files[0];
        if (!file) return;

        if (currentProcessing === 'client') {
            await processWithCustomMetadataClient(file);
        } else {
            await processWithCustomMetadataServer(file);
        }
    }

    async function processWithCustomMetadataClient(file) {
        const customMetadata = {
            title: titleInput.value.trim() || undefined,
            author: authorInput.value.trim() || undefined,
            subject: subjectInput.value.trim() || undefined,
            keywords: keywordsInput.value.trim() ? keywordsInput.value.split(',').map(k => k.trim()) : undefined,
            creator: creatorInput.value.trim() || undefined,
            producer: producerInput.value.trim() || undefined
        };

        // Remove undefined values
        Object.keys(customMetadata).forEach(key => {
            if (customMetadata[key] === undefined) {
                delete customMetadata[key];
            }
        });

        uploadSection.style.display = 'none';
        metadataEditor.style.display = 'none';
        loading.style.display = 'block';
        results.style.display = 'none';

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            
            const originalMetadata = {
                title: pdfDoc.getTitle() || '',
                author: pdfDoc.getAuthor() || '',
                subject: pdfDoc.getSubject() || '',
                keywords: pdfDoc.getKeywords() || [],
                producer: pdfDoc.getProducer() || '',
                creator: pdfDoc.getCreator() || '',
                creationDate: pdfDoc.getCreationDate()?.toISOString() || '',
                modificationDate: pdfDoc.getModificationDate()?.toISOString() || '',
                pageCount: pdfDoc.getPageCount()
            };
            
            const newPdfDoc = await PDFLib.PDFDocument.create();
            const copiedPages = await newPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach(page => newPdfDoc.addPage(page));

            // Apply custom metadata if provided
            if (customMetadata.title !== undefined) newPdfDoc.setTitle(customMetadata.title);
            if (customMetadata.author !== undefined) newPdfDoc.setAuthor(customMetadata.author);
            if (customMetadata.subject !== undefined) newPdfDoc.setSubject(customMetadata.subject);
            if (customMetadata.keywords !== undefined) newPdfDoc.setKeywords(customMetadata.keywords);
            if (customMetadata.creator !== undefined) newPdfDoc.setCreator(customMetadata.creator);
            if (customMetadata.producer !== undefined) newPdfDoc.setProducer(customMetadata.producer);

            const pdfBytes = await newPdfDoc.save();
            cleanedPdfData = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
            
            displayResults({
                originalMetadata,
                customMetadata,
                processedPdf: cleanedPdfData,
                originalSize: file.size,
                processedSize: pdfBytes.length
            }, 'PDF Processed with Custom Metadata!');

        } catch (error) {
            console.error('Error processing PDF:', error);
            alert(`An error occurred: ${error.message}`);
            resetToUpload();
        }
    }

    async function processWithCustomMetadataServer(file) {
        const formData = new FormData();
        formData.append('pdf', file);

        const customMetadata = {
            title: titleInput.value.trim() || undefined,
            author: authorInput.value.trim() || undefined,
            subject: subjectInput.value.trim() || undefined,
            keywords: keywordsInput.value.trim() ? keywordsInput.value.split(',').map(k => k.trim()) : undefined,
            creator: creatorInput.value.trim() || undefined,
            producer: producerInput.value.trim() || undefined
        };

        // Remove undefined values
        Object.keys(customMetadata).forEach(key => {
            if (customMetadata[key] === undefined) {
                delete customMetadata[key];
            }
        });

        // Add metadata as JSON string to form data
        formData.append('metadata', JSON.stringify(customMetadata));

        uploadSection.style.display = 'none';
        metadataEditor.style.display = 'none';
        loading.style.display = 'block';
        results.style.display = 'none';

        try {
            const response = await fetch('/process-with-metadata', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            cleanedPdfData = data.processedPdf;
            originalMetadata = data.originalMetadata;
            displayResults(data, 'PDF Processed with Custom Metadata!');

        } catch (error) {
            console.error('Error processing PDF:', error);
            alert(`An error occurred: ${error.message}`);
            resetToUpload();
        }
    }

    function displayResults(data, message) {
        displayMetadata(data.originalMetadata);
        const originalSizeKB = (data.originalSize / 1024).toFixed(1);
        const processedSizeKB = ((data.processedSize || data.cleanedSize) / 1024).toFixed(1);
        fileSizeComparison.textContent = `Original: ${originalSizeKB} KB → Processed: ${processedSizeKB} KB`;
        successMessage.textContent = message;
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
        a.download = `processed-${originalFileName}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function resetFileInput() {
        pdfFileInput.value = '';
        uploadArea.querySelector('h3').textContent = 'Drop your PDF here or click to browse';
        processBtn.disabled = true;
    }

    function resetToUpload() {
        uploadSection.style.display = 'block';
        metadataEditor.style.display = 'none';
        loading.style.display = 'none';
        results.style.display = 'none';
        resetFileInput();
        metadataGrid.innerHTML = '';
        fileSizeComparison.textContent = '';
        cleanedPdfData = null;
        originalMetadata = null;
        clearMetadataForm();
        updateInterface();
    }

    // Initialize interface
    updateInterface();
});