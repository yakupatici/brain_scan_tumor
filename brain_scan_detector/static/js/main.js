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
            alert('Lütfen bir görüntü dosyası seçin (JPEG, PNG, vb.)');
            return;
        }
        
        console.log('Dosya seçildi:', file.name, 'Boyut:', file.size, 'Tip:', file.type);
        
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
        showSection(previewSection);
    }
    
    function analyzeImage() {
        console.log('Görüntü analizi başlatılıyor...');
        
        showSection(resultsSection);
        loader.style.display = 'flex';
        resultDisplay.style.display = 'none';
        newScanBtn.style.display = 'none'; // Hide button initially
        
        // Önce API'yi manuel olarak uyandıralım
        fetch('https://brain-scan-api.onrender.com', { method: 'GET' })
            .then(response => {
                console.log('API uyandırma yanıtı:', response.status);
                startAnalysis();
            })
            .catch(error => {
                console.error('API uyandırma hatası:', error);
                startAnalysis(); // Yine de analizi başlatalım
            });
        
        function startAnalysis() {
            // Get file
            const file = imageUpload.files.length > 0 ? imageUpload.files[0] : null;
            const formData = new FormData();
            
            try {
                if (file) {
                    // User uploaded file
                    console.log('Kullanıcı yüklediği dosya işleniyor');
                    formData.append('file', file);
                    callApi(formData);
                } else if (imagePreview.src && imagePreview.src !== '#' && imagePreview.src !== '') {
                    // Example image was used - fetch it as blob
                    console.log('Örnek görüntü işleniyor:', imagePreview.src);
                    fetch(imagePreview.src)
                        .then(response => response.blob())
                        .then(blob => {
                            console.log('Görüntü blob olarak alındı:', blob.type, blob.size);
                            formData.append('file', blob, 'image.jpg');
                            callApi(formData);
                        })
                        .catch(error => {
                            console.error('Blob alma hatası:', error);
                            showError('Görüntü işlenirken hata oluştu: ' + error.message);
                        });
                } else {
                    console.error('Görüntü bulunamadı');
                    showError('Lütfen bir görüntü yükleyin');
                }
            } catch (error) {
                console.error('Analiz başlatma hatası:', error);
                showError('İşlem sırasında hata oluştu: ' + error.message);
            }
        }
        
        function callApi(formData) {
            // API URL - replace with your Render URL
            const apiUrl = 'https://brain-scan-api.onrender.com/predict';
            
            console.log('API isteği gönderiliyor:', apiUrl);
            
            // API çağrısı için timeout ayarlayalım
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.error('API isteği zaman aşımına uğradı');
                controller.abort();
            }, 120000); // 2 dakika timeout
            
            fetch(apiUrl, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            })
            .then(response => {
                console.log('API yanıtı alındı:', response.status, response.statusText);
                
                if (!response.ok) {
                    throw new Error(`Sunucu hatası: ${response.status} - ${response.statusText}`);
                }
                return response.json();
            })
            .then(result => {
                // Log the full response
                console.log('API sonucu:', result);
                
                // Display results
                loader.style.display = 'none';
                resultDisplay.style.display = 'block';
                newScanBtn.style.display = 'inline-block';
                
                const prediction = result.prediction;
                const confidence = result.confidence;
                
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
                
                // Ayrıntılı sonuçları da gösterelim
                if (result.all_scores) {
                    let scoresText = 'Tüm sonuçlar: ';
                    Object.entries(result.all_scores).forEach(([key, value]) => {
                        scoresText += `${key}: %${value}, `;
                    });
                    // Son virgülü kaldır
                    scoresText = scoresText.slice(0, -2);
                    const allScoresElement = document.createElement('p');
                    allScoresElement.className = 'all-scores';
                    allScoresElement.textContent = scoresText;
                    document.querySelector('.result-text').appendChild(allScoresElement);
                }
                
                currentAnalysisResult = null;
            })
            .catch(error => {
                console.error('API isteği hatası:', error);
                showError(error.message);
            })
            .finally(() => {
                clearTimeout(timeoutId);
            });
        }
        
        function showError(message) {
            console.error('Hata gösteriliyor:', message);
            loader.style.display = 'none';
            resultDisplay.style.display = 'block';
            resultTitle.textContent = 'İşlem Hatası';
            resultTitle.style.color = 'var(--danger-color)';
            resultDescription.textContent = message;
            newScanBtn.style.display = 'inline-block';
        }
    }
    
    function resetUpload() {
        imageUpload.value = '';
        imagePreview.src = '#';
        currentAnalysisResult = null; // Reset result type
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
    fetch('https://brain-scan-api.onrender.com')
        .then(response => console.log('API hazır:', response.status))
        .catch(error => console.log('API uyandırma hatası (önemli değil):', error));

    // Ensure initial state respects transitions
    resetAll(); // Call resetAll to set the initial view correctly
}); 