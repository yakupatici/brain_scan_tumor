document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadArea = document.getElementById('uploadArea');
    const uploadBtn = document.getElementById('uploadBtn');
    const imageUpload = document.getElementById('imageUpload');
    const uploadSection = document.querySelector('.upload-section'); // Get the section itself
    const previewSection = document.getElementById('previewSection');
    const imagePreview = document.getElementById('imagePreview');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const resultsSection = document.getElementById('resultsSection');
    const loader = document.getElementById('loader');
    const resultDisplay = document.getElementById('resultDisplay');
    const healthyIcon = document.getElementById('healthyIcon');
    const tumorIcon = document.getElementById('tumorIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultDescription = document.getElementById('resultDescription');
    const confidenceScore = document.getElementById('confidenceScore'); // Added confidence score element
    const newScanBtn = document.getElementById('newScanBtn');
    const exampleScanButtons = document.querySelectorAll('.example-btn'); // Added example buttons

    let currentAnalysisResult = null; // To store the result type for example scans

    // Initial state setup
    previewSection.style.display = 'none';
    resultsSection.style.display = 'none';
    previewSection.style.opacity = '0';
    resultsSection.style.opacity = '0';

    // Event Listeners
    uploadArea.addEventListener('click', () => imageUpload.click());
    uploadBtn.addEventListener('click', () => imageUpload.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            currentAnalysisResult = null; // Reset result type for uploads
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    
    imageUpload.addEventListener('change', (e) => {
        if (e.target.files.length) {
            currentAnalysisResult = null; // Reset result type for uploads
            handleFileSelect(e.target.files[0]);
        }
    });
    
    // Add listeners for example scan buttons
    exampleScanButtons.forEach(button => {
        button.addEventListener('click', () => {
            const imgSrc = button.getAttribute('data-src');
            const resultType = button.getAttribute('data-result'); // 'healthy' or 'tumor'
            handleExampleSelect(imgSrc, resultType);
        });
    });
    
    submitBtn.addEventListener('click', analyzeImage);
    cancelBtn.addEventListener('click', resetUpload);
    newScanBtn.addEventListener('click', resetAll);

    // Functions
    function showSection(sectionToShow) {
        [uploadSection, previewSection, resultsSection].forEach(section => {
            if (section === sectionToShow) {
                section.style.display = 'block';
                // Use setTimeout to allow display:block to take effect before changing opacity
                setTimeout(() => {
                    section.style.opacity = '1';
                    section.style.transform = 'scale(1)';
                }, 10);
            } else {
                section.style.opacity = '0';
                section.style.transform = 'scale(0.95)';
                // Hide the element after the transition
                setTimeout(() => {
                    if (section.style.opacity === '0') { // Check if it wasn't shown again quickly
                        section.style.display = 'none';
                    }
                }, 500); // Match CSS transition duration
            }
        });
    }
    
    function handleFileSelect(file) {
        // Check if file is an image
        if (!file.type.match('image.*')) {
            alert('Please select an image file (JPEG, PNG, etc.)');
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            showSection(previewSection);
        };
        
        reader.readAsDataURL(file);
    }
    
    // Handle example image selection
    function handleExampleSelect(imgSrc, resultType) {
        imagePreview.src = imgSrc;
        currentAnalysisResult = resultType; // Set the expected result for this example
        showSection(previewSection);
    }
    
    function analyzeImage() {
        showSection(resultsSection);
        loader.style.display = 'flex';
        resultDisplay.style.display = 'none';
        newScanBtn.style.display = 'none'; // Hide button initially
        
        // Simulate processing
        setTimeout(() => {
            loader.style.display = 'none';
            resultDisplay.style.display = 'block';
            newScanBtn.style.display = 'inline-block'; // Show button after result
            
            // Determine result: use pre-defined for examples, random for uploads
            const isHealthy = currentAnalysisResult ? (currentAnalysisResult === 'healthy') : (Math.random() > 0.5);
            // Simulate a confidence score
            const confScore = (Math.random() * (99 - 85) + 85).toFixed(1); // Random score between 85.0 and 99.0
            
            if (isHealthy) {
                healthyIcon.style.display = 'inline-block';
                tumorIcon.style.display = 'none';
                resultTitle.textContent = 'Sağlıklı Beyin Taraması (Simülasyon)';
                resultTitle.style.color = 'var(--success-color)';
                resultDescription.textContent = 'Bu beyin taramasında tümör belirtisi tespit edilmedi.';
                confidenceScore.textContent = `Tahmin Güveni (Simüle): %${confScore}`;
            } else {
                healthyIcon.style.display = 'none';
                tumorIcon.style.display = 'inline-block';
                resultTitle.textContent = 'Tümör Tespit Edildi (Simülasyon)';
                resultTitle.style.color = 'var(--danger-color)';
                resultDescription.textContent = 'Bu beyin taramasında potansiyel tümör belirtileri tespit edildi.';
                confidenceScore.textContent = `Tahmin Güveni (Simüle): %${confScore}`;
            }
            // Reset currentAnalysisResult after displaying the result
            currentAnalysisResult = null;
        }, 1500); // Slightly shorter simulation time
    }
    
    function resetUpload() {
        imageUpload.value = '';
        imagePreview.src = '#';
        currentAnalysisResult = null; // Reset result type
        showSection(uploadSection);
    }
    
    function resetAll() {
        resetUpload();
        // Optionally hide results immediately or let showSection handle it
        // resultsSection.style.display = 'none';
        // resultsSection.style.opacity = '0';
    }

    // Ensure initial state respects transitions
    resetAll(); // Call resetAll to set the initial view correctly
}); 