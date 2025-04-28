# Brain Scan Tumor Detector (Frontend)

A frontend web application for visualizing the detection of tumors in brain scan images (CT or MRI).

## Overview

This application provides an intuitive user interface for users to upload brain scan images and see a simulated prediction of whether the scan shows a healthy brain or a tumor. Currently, this is a frontend-only implementation with mock prediction functionality.

## Features

- Clean, modern user interface
- Drag and drop file upload
- Image preview before submission
- Loading animation during simulated processing
- Clear visual results with appropriate icons

## Technologies Used

- **HTML5** - Structure and content
- **CSS3** - Styling and animations
- **JavaScript** - Interactive functionality
- **Font Awesome** - Icons for UI elements

## Project Structure

```
brain_scan_detector/
│
├── index.html          - Main HTML page
│
├── static/
│   ├── css/
│   │   └── style.css   - Styling for the application
│   └── js/
│       └── main.js     - JavaScript functionality
│
└── README.md           - This documentation file
```

## How to Run

Simply open the `index.html` file in a web browser:

1. Open your file explorer/finder
2. Navigate to the project directory
3. Double-click on `index.html`
4. The application will open in your default web browser

Alternatively, you can use a local development server like Live Server in VS Code or any other HTTP server.

## Current Functionality

The frontend currently provides:
- File selection via drag-and-drop or dialog
- Image preview before "analysis"
- Simulated analysis with loading indicator
- Random mock results (healthy or tumor)

## Future Development

The backend implementation will be added later, which will include:
- A real backend API with deep learning model
- Actual processing of brain scan images
- Real predictions instead of mock results
- Secure file handling and validation

## License

This project is open source and available under the MIT License. 