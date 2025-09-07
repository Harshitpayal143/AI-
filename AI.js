
        // User authentication functionality
        document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const authButtons = document.getElementById('auth-buttons');
            const userProfile = document.getElementById('user-profile');
            const userAvatar = document.getElementById('user-avatar');
            const userName = document.getElementById('user-name');
            const signinButton = document.getElementById('signin-button');
            const signupButton = document.getElementById('signup-button');
            const authModal = document.getElementById('auth-modal');
            const closeModal = document.getElementById('close-modal');
            const authTabs = document.querySelectorAll('.auth-tab');
            const authForms = document.querySelectorAll('.auth-form');
            const signinForm = document.getElementById('signin-form');
            const signupForm = document.getElementById('signup-form');
            const switchToSignup = document.getElementById('switch-to-signup');
            const switchToSignin = document.getElementById('switch-to-signin');
            const logoutLink = document.getElementById('logout-link');
            const authModalTitle = document.getElementById('auth-modal-title');
            const authModalSubtitle = document.getElementById('auth-modal-subtitle');
            
            // Check if user is logged in
            function checkAuthStatus() {
                const currentUser = JSON.parse(localStorage.getItem('neuraforgeCurrentUser'));
                
                if (currentUser) {
                    // User is logged in
                    authButtons.style.display = 'none';
                    userProfile.style.display = 'flex';
                    
                    // Set user avatar (use Google profile picture if available)
                    if (currentUser.picture) {
                        userAvatar.textContent = '';
                        userAvatar.style.backgroundImage = `url(${currentUser.picture})`;
                    } else {
                        userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
                        userAvatar.style.backgroundImage = 'none';
                    }
                    
                    userName.textContent = currentUser.name;
                } else {
                    // User is not logged in
                    authButtons.style.display = 'flex';
                    userProfile.style.display = 'none';
                }
            }
            
            // Show auth modal
            function showAuthModal(formType = 'signin') {
                authModal.classList.add('active');
                
                // Set the active form
                if (formType === 'signin') {
                    switchAuthTab('signin');
                } else {
                    switchAuthTab('signup');
                }
            }
            
            // Hide auth modal
            function hideAuthModal() {
                authModal.classList.remove('active');
                clearFormErrors();
                resetForms();
            }
            
            // Switch between auth tabs
            function switchAuthTab(tabName) {
                // Update tabs
                authTabs.forEach(tab => {
                    if (tab.dataset.tab === tabName) {
                        tab.classList.add('active');
                    } else {
                        tab.classList.remove('active');
                    }
                });
                
                // Update forms
                authForms.forEach(form => {
                    if (form.id === `${tabName}-form`) {
                        form.classList.add('active');
                    } else {
                        form.classList.remove('active');
                    }
                });
                
                // Update modal title and subtitle
                if (tabName === 'signin') {
                    authModalTitle.textContent = 'Welcome Back';
                    authModalSubtitle.textContent = 'Sign in to your NeuraForge account';
                } else {
                    authModalTitle.textContent = 'Create Account';
                    authModalSubtitle.textContent = 'Join the NeuraForge community';
                }
            }
            
            // Clear form errors
            function clearFormErrors() {
                const errorElements = document.querySelectorAll('.form-error');
                errorElements.forEach(error => {
                    error.classList.remove('active');
                });
            }
            
            // Reset forms
            function resetForms() {
                signinForm.reset();
                signupForm.reset();
            }
            
            // Validate email format
            function isValidEmail(email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            }
            
            // Sign up function
            function signUp(name, email, password) {
                // Get existing users or initialize empty array
                const users = JSON.parse(localStorage.getItem('neuraforgeUsers')) || [];
                
                // Check if email already exists
                if (users.some(user => user.email === email)) {
                    alert('This email is already registered. Please sign in instead.');
                    switchAuthTab('signin');
                    return false;
                }
                
                // Create new user
                const newUser = {
                    id: Date.now().toString(),
                    name,
                    email,
                    password, // Note: In a real app, you would hash the password
                    createdAt: new Date().toISOString(),
                    authProvider: 'email'
                };
                
                // Add to users array
                users.push(newUser);
                
                // Save to localStorage
                localStorage.setItem('neuraforgeUsers', JSON.stringify(users));
                
                // Set as current user
                localStorage.setItem('neuraforgeCurrentUser', JSON.stringify(newUser));
                
                return true;
            }
            
            // Sign in function
            function signIn(email, password) {
                // Get users from localStorage
                const users = JSON.parse(localStorage.getItem('neuraforgeUsers')) || [];
                
                // Find user with matching credentials
                const user = users.find(u => u.email === email && u.password === password);
                
                if (user) {
                    // Set as current user
                    localStorage.setItem('neuraforgeCurrentUser', JSON.stringify(user));
                    return true;
                }
                
                return false;
            }
            
            // Sign out function
            function signOut() {
                // Sign out from Google if the user signed in with Google
                const currentUser = JSON.parse(localStorage.getItem('neuraforgeCurrentUser'));
                if (currentUser && currentUser.authProvider === 'google') {
                    // Google sign out logic
                    if (typeof google !== 'undefined') {
                        google.accounts.id.disableAutoSelect();
                        google.accounts.id.revoke(currentUser.email, done => {
                            console.log('Consent revoked');
                        });
                    }
                }
                
                localStorage.removeItem('neuraforgeCurrentUser');
                checkAuthStatus();
            }
            
            // Handle Google Sign-In
            window.handleGoogleSignIn = function(response) {
                // Handle the Google sign-in response
                const responsePayload = parseJwt(response.credential);
                
                // Create user object from Google response
                const googleUser = {
                    id: responsePayload.sub,
                    name: responsePayload.name,
                    email: responsePayload.email,
                    picture: responsePayload.picture,
                    authProvider: 'google',
                    createdAt: new Date().toISOString()
                };
                
                // Save or update user in local storage
                const users = JSON.parse(localStorage.getItem('neuraforgeUsers')) || [];
                const existingUserIndex = users.findIndex(user => user.email === googleUser.email);
                
                if (existingUserIndex !== -1) {
                    // Update existing user with Google info
                    users[existingUserIndex] = {...users[existingUserIndex], ...googleUser};
                } else {
                    // Add new user
                    users.push(googleUser);
                }
                
                // Save to localStorage
                localStorage.setItem('neuraforgeUsers', JSON.stringify(users));
                localStorage.setItem('neuraforgeCurrentUser', JSON.stringify(googleUser));
                
                // Update UI and close modal
                checkAuthStatus();
                hideAuthModal();
            };
            
            // Helper function to parse JWT token
            function parseJwt(token) {
                try {
                    return JSON.parse(atob(token.split('.')[1]));
                } catch (e) {
                    return null;
                }
            }
            
            // Event Listeners
            signinButton.addEventListener('click', () => showAuthModal('signin'));
            signupButton.addEventListener('click', () => showAuthModal('signup'));
            
            closeModal.addEventListener('click', hideAuthModal);
            
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) {
                    hideAuthModal();
                }
            });
            
            authTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    switchAuthTab(tab.dataset.tab);
                });
            });
            
            switchToSignup.addEventListener('click', (e) => {
                e.preventDefault();
                switchAuthTab('signup');
            });
            
            switchToSignin.addEventListener('click', (e) => {
                e.preventDefault();
                switchAuthTab('signin');
            });
            
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                signOut();
            });
            
            // Sign in form submission
            signinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                clearFormErrors();
                
                const email = document.getElementById('signin-email').value;
                const password = document.getElementById('signin-password').value;
                
                let isValid = true;
                
                // Validate email
                if (!email) {
                    document.getElementById('signin-email-error').textContent = 'Email is required';
                    document.getElementById('signin-email-error').classList.add('active');
                    isValid = false;
                } else if (!isValidEmail(email)) {
                    document.getElementById('signin-email-error').textContent = 'Please enter a valid email address';
                    document.getElementById('signin-email-error').classList.add('active');
                    isValid = false;
                }
                
                // Validate password
                if (!password) {
                    document.getElementById('signin-password-error').textContent = 'Password is required';
                    document.getElementById('signin-password-error').classList.add('active');
                    isValid = false;
                }
                
                if (isValid) {
                    if (signIn(email, password)) {
                        hideAuthModal();
                        checkAuthStatus();
                    } else {
                        alert('Invalid email or password. Please try again.');
                    }
                }
            });
            
            // Sign up form submission
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                clearFormErrors();
                
                const name = document.getElementById('signup-name').value;
                const email = document.getElementById('signup-email').value;
                const password = document.getElementById('signup-password').value;
                const confirm = document.getElementById('signup-confirm').value;
                
                let isValid = true;
                
                // Validate name
                if (!name) {
                    document.getElementById('signup-name-error').textContent = 'Name is required';
                    document.getElementById('signup-name-error').classList.add('active');
                    isValid = false;
                }
                
                // Validate email
                if (!email) {
                    document.getElementById('signup-email-error').textContent = 'Email is required';
                    document.getElementById('signup-email-error').classList.add('active');
                    isValid = false;
                } else if (!isValidEmail(email)) {
                    document.getElementById('signup-email-error').textContent = 'Please enter a valid email address';
                    document.getElementById('signup-email-error').classList.add('active');
                    isValid = false;
                }
                
                // Validate password
                if (!password) {
                    document.getElementById('signup-password-error').textContent = 'Password is required';
                    document.getElementById('signup-password-error').classList.add('active');
                    isValid = false;
                } else if (password.length < 6) {
                    document.getElementById('signup-password-error').textContent = 'Password must be at least 6 characters';
                    document.getElementById('signup-password-error').classList.add('active');
                    isValid = false;
                }
                
                // Validate confirm password
                if (password !== confirm) {
                    document.getElementById('signup-confirm-error').textContent = 'Passwords do not match';
                    document.getElementById('signup-confirm-error').classList.add('active');
                    isValid = false;
                }
                
                if (isValid) {
                    if (signUp(name, email, password)) {
                        hideAuthModal();
                        checkAuthStatus();
                    }
                }
            });
            
            // Initialize auth status
            checkAuthStatus();
            
            // Existing functionality from your original code
            const buttons = document.querySelectorAll('.btn');
            const featureCards = document.querySelectorAll('.feature-card');
            const modelCards = document.querySelectorAll('.model-card');
            
            buttons.forEach(button => {
                button.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-3px)';
                    this.style.boxShadow = '0 10px 25px rgba(126, 34, 206, 0.3)';
                });
                
                button.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = 'none';
                });
                
                button.addEventListener('click', function() {
                    this.style.transform = 'scale(0.98)';
                    setTimeout(() => {
                        this.style.transform = '';
                    }, 150);
                });
            });
            
            // Add subtle animations to cards
            featureCards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-10px)';
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                });
            });
            
            modelCards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-10px)';
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                });
            });
            
            // Animate elements on scroll
            const observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = 1;
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, observerOptions);
            
            // Observe elements for animation
            document.querySelectorAll('.feature-card, .model-card, .section-title').forEach(el => {
                el.style.opacity = 0;
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                observer.observe(el);
            });
            
            // Device detection function
            function getDeviceInfo() {
                const userAgent = navigator.userAgent;
                let deviceType = 'Unknown Device';
                
                if (/Android/i.test(userAgent)) {
                    deviceType = 'Android Device';
                } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
                    deviceType = 'iOS Device';
                } else if (/Windows/i.test(userAgent)) {
                    deviceType = 'Windows PC';
                } else if (/Mac/i.test(userAgent)) {
                    deviceType = 'Mac';
                } else if (/Linux/i.test(userAgent)) {
                    deviceType = 'Linux PC';
                }
                
                return deviceType;
            }
            
            // Research history functionality
            const researchHistorySection = document.getElementById('research-history');
            const historyGrid = document.getElementById('history-grid');
            const clearHistoryBtn = document.getElementById('clear-history');
            const viewResearchBtn = document.getElementById('view-research-btn');
            const exploreResearchLink = document.getElementById('explore-research-link');
            
            // Load saved research history
            function loadResearchHistory() {
                const history = JSON.parse(localStorage.getItem('neuraforgeResearchHistory')) || [];
                historyGrid.innerHTML = '';
                
                if (history.length === 0) {
                    historyGrid.innerHTML = '<p style="color: var(--gray); text-align: center; grid-column: 1 / -1;">No research history yet. Your searches will appear here.</p>';
                    return;
                }
                
                // Display history in reverse order (newest first)
                history.reverse().forEach(item => {
                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';
                    
                    // Determine device icon
                    let deviceIcon = 'fa-desktop';
                    if (item.device.includes('Android')) deviceIcon = 'fa-mobile-alt';
                    if (item.device.includes('iOS')) deviceIcon = 'fa-mobile-alt';
                    if (item.device.includes('Windows')) deviceIcon = 'fa-laptop';
                    if (item.device.includes('Mac')) deviceIcon = 'fa-laptop';
                    
                    historyItem.innerHTML = `
                        <div class="history-query">${item.query}</div>
                        <div class="history-device">
                            <i class="fas ${deviceIcon}"></i>
                            <span>${item.device}</span>
                        </div>
                        <div class="history-date">${new Date(item.timestamp).toLocaleString()}</div>
                    `;
                    
                    historyGrid.appendChild(historyItem);
                });
            }
            
            // Save search to history
            function saveToResearchHistory(query) {
                const history = JSON.parse(localStorage.getItem('neuraforgeResearchHistory')) || [];
                
                // Add new search with device info and timestamp
                history.push({
                    query: query,
                    device: getDeviceInfo(),
                    timestamp: new Date().toISOString()
                });
                
                // Save back to localStorage
                localStorage.setItem('neuraforgeResearchHistory', JSON.stringify(history));
                
                // Reload the history display
                loadResearchHistory();
            }
            
            // Clear history
            clearHistoryBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to clear your research history?')) {
                    localStorage.removeItem('neuraforgeResearchHistory');
                    loadResearchHistory();
                }
            });
            
            // Show research history section
            viewResearchBtn.addEventListener('click', function() {
                researchHistorySection.classList.add('active');
                researchHistorySection.scrollIntoView({ behavior: 'smooth' });
            });
            
            exploreResearchLink.addEventListener('click', function(e) {
                e.preventDefault();
                researchHistorySection.classList.add('active');
                researchHistorySection.scrollIntoView({ behavior: 'smooth' });
            });
            
            // AI Search functionality
            const searchInput = document.getElementById('ai-search-input');
            const searchButton = document.getElementById('ai-search-button');
            const searchResults = document.getElementById('search-results');
            
            // Function to call the Gemini API
            async function queryGeminiAPI(prompt) {
                const apiKey = 'AIzaSyC2NT2R8rDqRJCwLPEHSlQPQiuHpPdB790';
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                
                try {
                    // Show loading state
                    searchResults.innerHTML = `
                        <div class="loading">
                            <div class="spinner"></div>
                            <p>NeuraForge AI is thinking...</p>
                        </div>
                    `;
                    
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: prompt
                                }]
                            }]
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`API request failed with status ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    // Extract the response text
                    let responseText = '';
                    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                        responseText = data.candidates[0].content.parts[0].text;
                    } else {
                        responseText = "I apologize, but I couldn't generate a proper response. Please try again.";
                    }
                    
                    // Format the response with basic markdown parsing
                    const formattedResponse = formatResponse(responseText);
                    
                    // Display the response
                    searchResults.innerHTML = `
                        <div class="response-content">
                            ${formattedResponse}
                        </div>
                    `;
                    
                    // Check if we should search for images based on the query
                    if (shouldSearchForImages(prompt)) {
                        const imageSearchTerm = extractImageSearchTerm(prompt);
                        searchPixabayImages(imageSearchTerm);
                    }
                    
                    // Save the search to research history
                    saveToResearchHistory(prompt);
                    
                } catch (error) {
                    console.error('Error calling Gemini API:', error);
                    searchResults.innerHTML = `
                        <div class="response-content">
                            <p>Sorry, I encountered an error while processing your request. Please try again later.</p>
                            <p>Error details: ${error.message}</p>
                        </div>
                    `;
                }
            }
            
            // Function to determine if we should search for images
            function shouldSearchForImages(query) {
                const imageKeywords = [
                    'image', 'images', 'photo', 'photos', 'picture', 'pictures',
                    'show me', 'look like', 'visual', 'see', 'view', 'illustration',
                    'art', 'drawing', 'painting', 'graphic', 'design'
                ];
                
                return imageKeywords.some(keyword => 
                    query.toLowerCase().includes(keyword.toLowerCase())
                );
            }
            
            // Function to extract search term for images
            function extractImageSearchTerm(query) {
                // Remove common question words and image-related terms
                const wordsToRemove = [
                    'what', 'does', 'do', 'look', 'like', 'show', 'me', 'images', 
                    'image', 'photos', 'photo', 'pictures', 'picture', 'of', 'the', 'a', 'an'
                ];
                
                let searchTerm = query
                    .toLowerCase()
                    .replace(/[^\w\s]/gi, '') // Remove punctuation
                    .split(' ')
                    .filter(word => !wordsToRemove.includes(word))
                    .join(' ');
                
                // If the search term is too short, use the original query
                if (searchTerm.split(' ').length < 2 && searchTerm.length < 8) {
                    searchTerm = query;
                }
                
                return searchTerm.trim() || 'artificial intelligence';
            }
            
            // Function to search Pixabay for images
            async function searchPixabayImages(searchTerm) {
                const PIXABAY_API_KEY = '51995580-034b5fae4bc9535251e1dfe92';
                const apiUrl = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(searchTerm)}&image_type=photo&per_page=6`;
                
                try {
                    const response = await fetch(apiUrl);
                    const data = await response.json();
                    
                    if (data.hits && data.hits.length > 0) {
                        displayImages(data.hits, searchTerm);
                    }
                } catch (error) {
                    console.error('Error fetching images from Pixabay:', error);
                }
            }
            
            // Function to display images in the results
            function displayImages(images, searchTerm) {
                const galleryHtml = `
                    <div class="image-gallery">
                        <div class="gallery-title">Related Images for "${searchTerm}"</div>
                        <div class="gallery-grid">
                            ${images.slice(0, 6).map(image => `
                                <div class="gallery-item">
                                    <img src="${image.webformatURL}" alt="${image.tags}" class="gallery-image">
                                    <div class="gallery-overlay">By ${image.user}</div>
                                </div>
                            `).join('')}
                        </div>
                        <a href="https://pixabay.com/images/search/${encodeURIComponent(searchTerm)}/" target="_blank" class="view-more">View more images on Pixabay</a>
                    </div>
                `;
                
                // Append the gallery to the search results
                searchResults.innerHTML += galleryHtml;
                
                // Add click event to open images in full view
                document.querySelectorAll('.gallery-item').forEach((item, index) => {
                    item.addEventListener('click', () => {
                        const imageUrl = images[index].largeImageURL;
                        window.open(imageUrl, '_blank');
                    });
                });
            }
            
            // Basic markdown formatting function
            function formatResponse(text) {
                // Convert **bold** to <strong>bold</strong>
                text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                
                // Convert *italic* to <em>italic</em>
                text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
                
                // Convert numbered lists
                text = text.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');
                text = text.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
                
                // Convert bullet points
                text = text.replace(/^-\s+(.*)$/gm, '<li>$1</li>');
                text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
                
                // Convert headings (## Heading)
                text = text.replace(/^##\s+(.*)$/gm, '<h3>$1</h3>');
                
                // Convert paragraphs (ensure each paragraph is wrapped in <p>)
                text = text.split('\n\n').map(paragraph => {
                    if (!paragraph.startsWith('<') && !paragraph.endsWith('>')) {
                        return `<p>${paragraph}</p>`;
                    }
                    return paragraph;
                }).join('');
                
                return text;
            }
            
            // Event listener for search button click
            searchButton.addEventListener('click', function() {
                const query = searchInput.value.trim();
                if (query) {
                    queryGeminiAPI(query);
                }
            });
            
            // Event listener for Enter key in search input
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim();
                    if (query) {
                        queryGeminiAPI(query);
                    }
                }
            });
            
            // Initialize research history on page load
            loadResearchHistory();
        });
    