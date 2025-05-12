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

    // API Configuration
    const API_URL = 'https://brainscanapi-production.up.railway.app';
    const USE_REAL_API = true; // API modunu kontrol eden değişken (false: simülasyon modu, true: gerçek API modu)

    let currentAnalysisResult = null; // To store the result type for example scans
    let selectedFile = null; // To store the selected file

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
            alert('Lütfen bir görüntü dosyası seçin (JPEG, PNG, vb.)');
            return;
        }
        
        console.log('Dosya seçildi:', file.name, 'Boyut:', file.size, 'Tip:', file.type);
        selectedFile = file; // Store the file for later use
        
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
        console.log('Örnek görüntü seçildi:', imgSrc, 'Tip:', resultType);
        imagePreview.src = imgSrc;
        currentAnalysisResult = resultType; // Set the expected result for this example
        selectedFile = null; // Clear any selected file
        showSection(previewSection);
    }
    
    async function analyzeImage() {
        showSection(resultsSection);
        loader.style.display = 'flex';
        resultDisplay.style.display = 'none';
        newScanBtn.style.display = 'none';
        
        // Remove previous all-scores element if exists
        const prevAllScoresElement = document.querySelector('.all-scores');
        if (prevAllScoresElement) {
            prevAllScoresElement.remove();
        }
        
        if (USE_REAL_API && selectedFile) {
            console.log('Gerçek API çağrısı yapılıyor...');
            try {
                // Create FormData for file upload
                const formData = new FormData();
                formData.append('file', selectedFile);
                
                // Send request to API
                const response = await fetch(`${API_URL}/predict`, {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(`API yanıt hatası: ${response.status}`);
                }
                
                const result = await response.json();
                displayResults(result, false);
                
            } catch (error) {
                console.error('API hatası:', error);
                // Fallback to simulation if API fails
                alert(`API hatası: ${error.message}. Simülasyon moduna geçiliyor.`);
                simulateResults();
            }
        } else {
            // Simulate results for example images or when API is disabled
            console.log('Simülasyon modu kullanılıyor...');
            setTimeout(simulateResults, 1500);
        }
    }
    
    function simulateResults() {
        // Simülasyon için tahmin oluştur
        const isExample = currentAnalysisResult !== null;
        const prediction = isExample ? 
            (currentAnalysisResult === 'healthy' ? 'Sağlıklı' : 'Tümör') : 
            ['Sağlıklı', 'Enfarkt', 'Tümör', 'Kanama'][Math.floor(Math.random() * 4)];
        
        const confidence = (Math.random() * (99 - 85) + 85).toFixed(1);
        
        // Tüm skorları oluştur
        const allClasses = ['Sağlıklı', 'Enfarkt', 'Tümör', 'Kanama'];
        const scores = {};
        
        allClasses.forEach(cls => {
            scores[cls] = cls === prediction ? 
                parseFloat(confidence) : 
                parseFloat((Math.random() * 20).toFixed(1));
        });
        
        // Simüle edilmiş sonuç objesi
        const simulatedResult = {
            prediction: prediction,
            confidence: parseFloat(confidence),
            scores: scores
        };
        
        displayResults(simulatedResult, true);
    }
    
    function displayResults(result, isSimulation) {
        loader.style.display = 'none';
        resultDisplay.style.display = 'block';
        newScanBtn.style.display = 'inline-block';
        
        const prediction = result.prediction;
        const confidence = result.confidence.toFixed(1);
        const simulationText = isSimulation ? ' (Simülasyon)' : '';
        
        if (prediction === 'Sağlıklı') {
            healthyIcon.style.display = 'inline-block';
            tumorIcon.style.display = 'none';
            resultTitle.textContent = `Sağlıklı Beyin Taraması${simulationText}`;
            resultTitle.style.color = 'var(--success-color)';
            resultDescription.textContent = 'Bu beyin taramasında anormal bulgu tespit edilmedi.';
        } else {
            healthyIcon.style.display = 'none';
            tumorIcon.style.display = 'inline-block';
            resultTitle.textContent = `${prediction} Tespit Edildi${simulationText}`;
            resultTitle.style.color = 'var(--danger-color)';
            resultDescription.textContent = `Bu beyin taramasında ${prediction.toLowerCase()} belirtileri tespit edildi.`;
        }
        
        confidenceScore.textContent = `Tahmin Güveni${simulationText}: %${confidence}`;
        
        // Tüm skorları göster
        let scoresText = `Tüm sonuçlar${simulationText}: `;
        const allClasses = Object.keys(result.scores);
        
        allClasses.forEach(cls => {
            const score = result.scores[cls].toFixed(1);
            scoresText += `${cls}: %${score}, `;
        });
        
        // Son virgülü kaldır
        scoresText = scoresText.slice(0, -2);
        const allScoresElement = document.createElement('p');
        allScoresElement.className = 'all-scores';
        allScoresElement.textContent = scoresText;
        document.querySelector('.result-text').appendChild(allScoresElement);
        
        currentAnalysisResult = null;
    }
    
    function resetUpload() {
        imageUpload.value = '';
        imagePreview.src = '#';
        currentAnalysisResult = null; // Reset result type
        selectedFile = null; // Clear selected file
        showSection(uploadSection);
    }
    
    function resetAll() {
        resetUpload();
        // Temizlik: eklenen ayrıntılı sonuçları kaldıralım
        const allScoresElement = document.querySelector('.all-scores');
        if (allScoresElement) {
            allScoresElement.remove();
        }
    }

    // API'yi başlangıçta uyandır
    fetch(API_URL)
        .then(response => console.log('API hazır:', response.status))
        .catch(error => console.log('API uyandırma hatası (önemli değil):', error));

    // Ensure initial state respects transitions
    resetAll(); // Call resetAll to set the initial view correctly
}); 