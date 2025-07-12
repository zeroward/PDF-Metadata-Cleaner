const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const path = require('path');

const app = express();

// Serve static files
app.use(express.static('public'));

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

app.post('/strip-metadata', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Load PDF from memory
    const pdfDoc = await PDFDocument.load(req.file.buffer);
    
    // Extract existing metadata
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
    
    // Create a new PDF and copy the pages from the old one.
    // This is the most effective way to remove all metadata.
    const newPdfDoc = await PDFDocument.create();
    const copiedPages = await newPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach(page => newPdfDoc.addPage(page));

    // Generate clean PDF
    const pdfBytes = await newPdfDoc.save();
    
    // Return both metadata and the cleaned PDF
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});