const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' }));

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

app.post('/get-metadata', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const pdfDoc = await PDFDocument.load(req.file.buffer);
    
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
    
    res.json({
      metadata,
      originalSize: req.file.size
    });
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

app.post('/strip-metadata', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const pdfDoc = await PDFDocument.load(req.file.buffer);
    
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
    
    const newPdfDoc = await PDFDocument.create();
    const copiedPages = await newPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach(page => newPdfDoc.addPage(page));

    const pdfBytes = await newPdfDoc.save();
    
    res.json({
      originalMetadata,
      cleanedPdf: Buffer.from(pdfBytes).toString('base64'),
      originalSize: req.file.size,
      cleanedSize: pdfBytes.length
    });
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

app.post('/process-with-metadata', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const pdfDoc = await PDFDocument.load(req.file.buffer);
    let customMetadata = {};
    
    // Parse metadata from form data
    if (req.body.metadata) {
      try {
        customMetadata = JSON.parse(req.body.metadata);
      } catch (error) {
        console.error('Error parsing metadata:', error);
        customMetadata = {};
      }
    }
    
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
    
    const newPdfDoc = await PDFDocument.create();
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
    
    res.json({
      originalMetadata,
      customMetadata,
      processedPdf: Buffer.from(pdfBytes).toString('base64'),
      originalSize: req.file.size,
      processedSize: pdfBytes.length
    });
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});