document.addEventListener('DOMContentLoaded', () => {
    // Initialize EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init("wV_3uog0MfiqwuYiq");
    }

    const SUPABASE_URL = 'https://rfcotftdxmjsoilekran.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_wYBjlZZhtZraifP6-7lM_A_96aGzdSH';
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const loginOverlay = document.getElementById('login-overlay');
    const adminApp = document.getElementById('admin-app');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    // 1. Authentication Logic
    const isAuthenticated = localStorage.getItem('admin_auth') === 'true';

    // Fetch dynamic credentials from localStorage or use defaults
    let currentAdminEmail = localStorage.getItem('admin_email') || 'admin@example.com';
    let currentAdminPassword = localStorage.getItem('admin_password') || 'admin123';

    // Populate the settings form with current email when app starts
    const settingsEmailInput = document.getElementById('settings-email');
    if (settingsEmailInput) {
        settingsEmailInput.value = currentAdminEmail;
    }

    if (isAuthenticated) {
        showApp();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('email-login').value;
        const pwd = passwordInput.value;
        
        if (emailInput === currentAdminEmail && pwd === currentAdminPassword) {
            localStorage.setItem('admin_auth', 'true');
            showApp();
        } else {
            // Fixed security issue: never reveal the expected credentials in the error message!
            loginError.textContent = 'Incorrect email or password.';
            passwordInput.value = '';
        }
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('admin_auth');
        window.location.reload();
    });

    function showApp() {
        loginOverlay.style.display = 'none';
        adminApp.style.display = 'flex';
        fetchMessages();
    }

    // 2. SPA Navigation Logic
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const views = document.querySelectorAll('.view');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active to clicked link
            link.classList.add('active');

            // Hide all views
            views.forEach(v => {
                v.style.display = 'none';
                v.classList.remove('fade-in');
            });

            // Show target view
            const targetId = link.getAttribute('data-target');
            const targetView = document.getElementById(`view-${targetId}`);
            targetView.style.display = 'block';
            
            // Re-trigger animation
            setTimeout(() => targetView.classList.add('fade-in'), 10);
        });
    });

    // 3. Data Rendering (Messages from Supabase)
    let messagesData = [];
    const messagesTbody = document.getElementById('messages-tbody');
    const messageModal = document.getElementById('message-modal');
    const closeModal = document.querySelector('.close-modal');

    async function fetchMessages() {
        try {
            const { data, error } = await supabaseClient
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            messagesData = data || [];
            
            // Update metrics
            const totalMessagesElement = document.getElementById('metric-total-messages');
            if (totalMessagesElement) {
                totalMessagesElement.textContent = messagesData.length;
            }
            
            const unreadCount = messagesData.filter(m => m.status === 'new').length;
            const newMessagesElement = document.getElementById('metric-new-messages');
            if (newMessagesElement) {
                newMessagesElement.textContent = unreadCount;
            }

            // Update unread badge
            const badge = document.querySelector('.sidebar-nav .badge');
            if (badge) {
                badge.textContent = unreadCount;
                badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
            }
            
            // Populate Recent Activity
            const activityList = document.getElementById('recent-activity-list');
            if (activityList) {
                activityList.innerHTML = '';
                if (messagesData.length === 0) {
                    activityList.innerHTML = '<div style="padding: 1.5rem; color: var(--clr-text-muted);">No recent inquiries.</div>';
                } else {
                    messagesData.slice(0, 3).forEach(msg => {
                        const dateStr = new Date(msg.created_at).toLocaleDateString();
                        const isNew = msg.status === 'new';
                        activityList.innerHTML += `
                            <div class="activity-item">
                                <div class="activity-icon ${isNew ? 'blue' : 'green'}">
                                    <i class="ph ${isNew ? 'ph-envelope-simple' : 'ph-envelope-open'}"></i>
                                </div>
                                <div class="activity-info">
                                    <h4>${msg.name} regarding ${msg.service}</h4>
                                    <p>${dateStr}</p>
                                </div>
                            </div>
                        `;
                    });
                }
            }
            
            renderMessages();
        } catch (error) {
            console.error('Error fetching messages:', error);
            messagesTbody.innerHTML = '<tr><td colspan="5">Error loading messages.</td></tr>';
        }
    }

    function renderMessages() {
        messagesTbody.innerHTML = '';
        
        if (messagesData.length === 0) {
            messagesTbody.innerHTML = '<tr><td colspan="5">No messages yet.</td></tr>';
            return;
        }
        
        messagesData.forEach(msg => {
            const tr = document.createElement('tr');
            
            const statusClass = msg.status === 'new' ? 'new' : 'read';
            const statusText = msg.status === 'new' ? 'New' : 'Read';
            
            // Format date safely
            let dateStr = 'Unknown date';
            if (msg.created_at) {
                const date = new Date(msg.created_at);
                dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }

            tr.innerHTML = `
                <td><strong>${msg.name}</strong></td>
                <td>${msg.service}</td>
                <td>${dateStr}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td><button class="view-btn" data-id="${msg.id}">View Details</button></td>
            `;
            messagesTbody.appendChild(tr);
        });

        // Add event listeners to view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                openMessageModal(id);
            });
        });
    }

    async function openMessageModal(id) {
        const msg = messagesData.find(m => m.id.toString() === id.toString());
        if (!msg) return;

        document.getElementById('modal-subject').textContent = `New inquiry regarding ${msg.service}`;
        document.getElementById('modal-name').textContent = msg.name;
        document.getElementById('modal-email').textContent = msg.email;
        document.getElementById('modal-service').textContent = msg.service;
        document.getElementById('modal-message').textContent = msg.message;
        document.getElementById('modal-reply').setAttribute('href', `mailto:${msg.email}?subject=Re: Inquiry about ${msg.service}`);

        messageModal.style.display = 'flex';

        // Mark as read in Supabase if new
        if (msg.status === 'new') {
            try {
                const { error } = await supabaseClient
                    .from('messages')
                    .update({ status: 'read' })
                    .eq('id', msg.id);
                    
                if (error) throw error;
                
                // Update local state to avoid refetching immediately
                msg.status = 'read';
                
                // Re-render to update badges and table
                renderMessages();
                
                // Update badge count
                const unreadCount = messagesData.filter(m => m.status === 'new').length;
                const badge = document.querySelector('.sidebar-nav .badge');
                if (badge) {
                    badge.textContent = unreadCount;
                    badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
                }
            } catch (error) {
                console.error('Error updating message status:', error);
            }
        }
    }

    closeModal.addEventListener('click', () => {
        messageModal.style.display = 'none';
    });

    // Close modal if clicked outside
    messageModal.addEventListener('click', (e) => {
        if (e.target === messageModal) {
            messageModal.style.display = 'none';
        }
    });

    // --- Verification Logic ---
    const verifyModalUI = document.getElementById('verify-modal');
    const verifyModalTitle = document.getElementById('verify-modal-title');
    const verifyModalDesc = document.getElementById('verify-modal-desc');
    const verifyCodeInput = document.getElementById('verify-code-input');
    const verifyError = document.getElementById('verify-error');
    const btnCancelVerify = document.getElementById('btn-cancel-verify');
    const btnSubmitVerify = document.getElementById('btn-submit-verify');
    
    let expectedVerifyCode = '';
    let verifySuccessCallback = null;
    
    function openVerification(emailToVerify, title, callback) {
        expectedVerifyCode = Math.floor(1000 + Math.random() * 9000).toString();
        verifyModalTitle.textContent = title;
        verifyModalDesc.textContent = `Enter the 4-digit code sent to ${emailToVerify}`;
        verifyCodeInput.value = '';
        verifyError.style.display = 'none';
        verifySuccessCallback = callback;
        
        verifyModalUI.style.display = 'flex';
        
        // Send real email via EmailJS
        emailjs.send("service_4u2cego", "template_wqmwmf2", {
            to_email: emailToVerify,
            code: expectedVerifyCode
        }).then(
            function(response) {
                console.log("Verification email sent successfully!", response.status, response.text);
            },
            function(error) {
                console.error("Failed to send verification email...", error);
                alert("Failed to send verification email. Please check the console for details.");
            }
        );
    }

    if(btnCancelVerify) {
        btnCancelVerify.addEventListener('click', () => {
            verifyModalUI.style.display = 'none';
        });
    }

    if(btnSubmitVerify) {
        btnSubmitVerify.addEventListener('click', () => {
            if (verifyCodeInput.value === expectedVerifyCode) {
                verifyModalUI.style.display = 'none';
                if (verifySuccessCallback) verifySuccessCallback();
            } else {
                verifyError.style.display = 'block';
            }
        });
    }

    // Email Input UI Update
    const emailBadge = document.getElementById('email-verification-badge');
    const btnVerifyEmail = document.getElementById('btn-verify-email');
    
    if (settingsEmailInput) {
        settingsEmailInput.addEventListener('input', () => {
            if (settingsEmailInput.value === currentAdminEmail) {
                if(emailBadge) emailBadge.style.display = 'inline-block';
                if(btnVerifyEmail) btnVerifyEmail.style.display = 'none';
            } else {
                if(emailBadge) emailBadge.style.display = 'none';
                if(btnVerifyEmail) btnVerifyEmail.style.display = 'inline-block';
            }
        });

        if (btnVerifyEmail) {
            btnVerifyEmail.addEventListener('click', () => {
                const newEmail = settingsEmailInput.value;
                if (!newEmail || newEmail === currentAdminEmail) return;
                
                // Step 1: Verify current email (authorize change)
                openVerification(currentAdminEmail, 'Authorize Change', () => {
                    // Step 2: Verify new email (confirm ownership)
                    setTimeout(() => {
                        openVerification(newEmail, 'Verify New Email', () => {
                            currentAdminEmail = newEmail;
                            localStorage.setItem('admin_email', currentAdminEmail);
                            
                            if(emailBadge) emailBadge.style.display = 'inline-block';
                            btnVerifyEmail.style.display = 'none';
                            
                            const btn = document.querySelector('#settings-form button');
                            const origText = btn.textContent;
                            btn.textContent = 'Email Verified & Saved!';
                            btn.style.backgroundColor = '#10b981';
                            setTimeout(() => {
                                btn.textContent = origText;
                                btn.style.backgroundColor = '';
                            }, 2000);
                        });
                    }, 500);
                });
            });
        }
    }

    // Handle Forms (Settings)
    document.getElementById('settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newEmail = settingsEmailInput ? settingsEmailInput.value : currentAdminEmail;

        if (newEmail !== currentAdminEmail) {
            alert('Please verify the new email address by clicking the Verify button before saving.');
            return;
        }

        const btn = e.target.querySelector('button');
        btn.textContent = 'Saved!';
        btn.style.backgroundColor = '#10b981'; // Green
        setTimeout(() => {
            btn.textContent = 'Save Changes';
            btn.style.backgroundColor = '';
        }, 2000);
    });

    document.getElementById('security-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const oldPassword = document.getElementById('settings-old-password').value;
        const newPassword = document.getElementById('settings-new-password').value;
        const confirmPassword = document.getElementById('settings-confirm-password').value;

        if (oldPassword !== currentAdminPassword) {
            alert('Incorrect old password. Please try again.');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match. Please try again.');
            return;
        }

        // Save new password to local storage
        currentAdminPassword = newPassword;
        localStorage.setItem('admin_password', currentAdminPassword);

        e.target.reset();
        alert('Password updated successfully! You will use this password next time you login.');
    });

});
