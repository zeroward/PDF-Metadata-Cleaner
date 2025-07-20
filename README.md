# PDF Metadata Cleaner

Remove metadata from PDFs privately. No data is stored on servers.

## Live Demo

Try the application online: **[https://pdf-metadata-cleaner.onrender.com](https://pdf-metadata-cleaner.onrender.com)**

## Features

- **Dual Processing Modes**: Choose between server-side and client-side processing
- **Metadata Editing**: View and modify PDF metadata fields
- **Privacy-Focused**: Client-side processing keeps files local
- **Modern Interface**: Clean, responsive design
- **No Data Storage**: Files are processed in memory and never stored

## Processing Options

### Server Processing (Recommended)
- Handles large files efficiently
- Files processed on secure server
- Full processing capabilities
- Best for files larger than 10MB

### Client Processing (Privacy-Focused)
- Files never leave your browser
- No upload time for small files
- Works without internet connection
- Best for small files (<10MB) when maximum privacy is needed

## Quick Start

1. **Choose Mode**: Select "Strip All Metadata" or "Edit Metadata"
2. **Select Processing**: Choose Server or Client processing
3. **Upload PDF**: Drag and drop your file or click to browse
4. **Process**: Click the process button
5. **Download**: Get your processed PDF

## Installation

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### Setup
```bash
# Clone the repository
git clone https://github.com/zeroward/PDF-Metadata-Cleaner.git
cd PDF-Metadata-Cleaner

# Install dependencies
npm install

# Start the development server
npm start
```

The application will be available at `http://localhost:3000`

## Usage

### Strip All Metadata
1. Select "Strip All Metadata" mode
2. Choose processing location (Server/Client)
3. Upload your PDF file
4. Click "Strip Metadata"
5. Download the clean PDF

### Edit Metadata
1. Select "Edit Metadata" mode
2. Choose processing location (Server/Client)
3. Upload your PDF file
4. Click "Load Metadata" to view existing metadata
5. Edit the metadata fields as needed
6. Click "Process with Custom Metadata"
7. Download the processed PDF

## File Requirements

- **Format**: PDF files only
- **Size Limit**: 50MB maximum
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## Metadata Fields Supported

- Title
- Author
- Subject
- Keywords
- Creator
- Producer
- Creation Date
- Modification Date
- Page Count

## Privacy and Security

- **Server Processing**: Files are processed in memory and never stored
- **Client Processing**: Files never leave your browser
- **No Logging**: We don't log or store your files
- **Secure Transmission**: All data is encrypted in transit

## Documentation

- **[User Guide](USER_GUIDE.md)**: Comprehensive user documentation
- **[Deployment Guide](DEPLOYMENT.md)**: How to deploy to Render.com

## Development

### Project Structure
```
PDF-Metadata-Cleaner/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── public/               # Static files
│   ├── index.html        # Main HTML file
│   ├── styles.css        # CSS styles
│   └── script.js         # Client-side JavaScript
└── README.md            # This file
```

### Scripts
```bash
npm start          # Start the production server
npm run dev        # Start with nodemon for development
```

## Deployment

The application is designed to be easily deployed to various platforms:

- **Render.com**: Free hosting with automatic deployments
- **Heroku**: Cloud platform with easy deployment
- **Vercel**: Serverless deployment
- **Railway**: Modern deployment platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or feedback:
- Open an issue on GitHub
- Ensure you're using a supported browser

## Version History

- **v1.0.0**: Initial release with dual processing modes and metadata editing
