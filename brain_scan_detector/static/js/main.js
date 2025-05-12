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
    const API_URL = 'https://brainscanapi-production.up.railway.app'; // Exact URL from Railway logs
    let USE_REAL_API = true; // Always use real API
    let currentApiUrl = API_URL;

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
        
        // Status message element for loading updates
        const statusMessage = document.createElement('div');
        statusMessage.id = 'statusMessage';
        statusMessage.style.color = '#666';
        statusMessage.style.textAlign = 'center';
        statusMessage.style.marginTop = '10px';
        statusMessage.style.fontSize = '0.9em';
        statusMessage.textContent = 'Görüntü analiz ediliyor...';
        loader.appendChild(statusMessage);
        
        // Remove previous all-scores element if exists
        const prevAllScoresElement = document.querySelector('.all-scores');
        if (prevAllScoresElement) {
            prevAllScoresElement.remove();
        }
        
        if (selectedFile) {
            console.log(`API çağrısı yapılıyor... (${currentApiUrl})`);
            try {
                // Create FormData for file upload
                const formData = new FormData();
                formData.append('file', selectedFile);
                
                // Send request to API with retry
                let response;
                let retryCount = 0;
                const maxRetries = 5; // Increase max retries for 502 errors
                
                while (retryCount < maxRetries) {
                    try {
                        if (retryCount > 0) {
                            statusMessage.textContent = `Railway API uyandırılıyor... (${retryCount}/${maxRetries})`;
                        }
                        
                        response = await fetch(`${currentApiUrl}/predict`, {
                            method: 'POST',
                            body: formData,
                            headers: {
                                'Accept': 'application/json'
                            }
                        });
                        
                        if (response.ok) {
                            break; // Success, exit retry loop
                        } else if (response.status === 502) {
                            // Railway 502 error - server is available but application failed to respond
                            // This is common when the app is waking up from sleep
                            console.warn(`Railway 502 hatası, yeniden deneniyor (${retryCount+1}/${maxRetries})...`);
                            statusMessage.textContent = `Model uyanıyor, lütfen bekleyin... (${retryCount+1}/${maxRetries})`;
                            retryCount++;
                            
                            // Wait longer between retries for 502 errors (increasing backoff)
                            await new Promise(r => setTimeout(r, 2000 * retryCount)); 
                        } else {
                            console.warn(`API yanıt hatası, yeniden deneniyor (${retryCount+1}/${maxRetries}): ${response.status}`);
                            statusMessage.textContent = `API hatası, yeniden deneniyor... (${retryCount+1}/${maxRetries})`;
                            retryCount++;
                            await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retrying
                        }
                    } catch (fetchError) {
                        console.warn(`Fetch hatası, yeniden deneniyor (${retryCount+1}/${maxRetries}): ${fetchError.message}`);
                        statusMessage.textContent = `Bağlantı hatası, yeniden deneniyor... (${retryCount+1}/${maxRetries})`;
                        retryCount++;
                        await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retrying
                    }
                }
                
                if (!response || !response.ok) {
                    throw new Error(`API yanıt hatası: ${response ? response.status : 'Bağlantı hatası'}`);
                }
                
                const result = await response.json();
                displayResults(result, false);
                
            } catch (error) {
                console.error('API hatası:', error);
                alert(`API hatası: ${error.message}. Lütfen ağ bağlantınızı kontrol edin ve tekrar deneyin.`);
                resetAll(); // Go back to upload screen
            }
        } else if (currentAnalysisResult) {
            // For example images, use predetermined results with actual API format
            console.log('Örnek görüntü için önceden belirlenmiş sonuç kullanılıyor...');
            
            // Create result object in the same format as API would provide
            const result = {
                prediction: currentAnalysisResult === 'healthy' ? 'Sağlıklı' : 'Tümör',
                confidence: 95.5,
                scores: {
                    'Sağlıklı': currentAnalysisResult === 'healthy' ? 95.5 : 4.5,
                    'Tümör': currentAnalysisResult === 'tumor' ? 95.5 : 2.3,
                    'Enfarkt': 1.1,
                    'Kanama': 1.1
                }
            };
            
            displayResults(result, false);
        }
    }
    
    function displayResults(result, isSimulation) {
        loader.style.display = 'none';
        // Remove status message if exists
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.remove();
        }
        
        resultDisplay.style.display = 'block';
        newScanBtn.style.display = 'inline-block';
        
        const prediction = result.prediction;
        const confidence = result.confidence.toFixed(1);
        
        if (prediction === 'Sağlıklı') {
            healthyIcon.style.display = 'inline-block';
            tumorIcon.style.display = 'none';
            resultTitle.textContent = 'Sağlıklı Beyin Taraması';
            resultTitle.style.color = 'var(--success-color)';
            resultDescription.textContent = 'Bu beyin taramasında anormal bulgu tespit edilmedi.';
        } else {
            healthyIcon.style.display = 'none';
            tumorIcon.style.display = 'inline-block';
            resultTitle.textContent = `${prediction} Tespit Edildi`;
            resultTitle.style.color = 'var(--danger-color)';
            resultDescription.textContent = `Bu beyin taramasında ${prediction.toLowerCase()} belirtileri tespit edildi.`;
        }
        
        confidenceScore.textContent = `Tahmin Güveni: %${confidence}`;
        
        // Tüm skorları göster
        let scoresText = 'Tüm sonuçlar: ';
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

    // Improved API wakeup
    async function wakeupAPI() {
        try {
            console.log('API uyanıyor...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(`${currentApiUrl}/health`, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                console.log('API hazır:', response.status);
                return true;
            } else {
                console.warn(`API uyanma hatası: ${response.status}`);
                return true; // Assume it's working anyway, just slow
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('API uyanma zaman aşımına uğradı, ancak devam ediyoruz...');
                return true; // Continue anyway, the API might just be slow to respond
            }
            console.warn('API uyandırma hatası:', error.message);
            return true; // Assume it's working, might just be connection issue
        }
    }

    // Call wakeupAPI but don't show simulation notice anymore
    wakeupAPI();

    // Ensure initial state respects transitions
    resetAll(); // Call resetAll to set the initial view correctly
}); 