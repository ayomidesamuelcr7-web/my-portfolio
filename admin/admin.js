document.addEventListener('DOMContentLoaded', () => {
    
    const loginOverlay = document.getElementById('login-overlay');
    const adminApp = document.getElementById('admin-app');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    // 1. Authentication Logic
    const isAuthenticated = localStorage.getItem('admin_auth') === 'true';

    if (isAuthenticated) {
        showApp();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = passwordInput.value;
        
        if (pwd === 'admin123') {
            localStorage.setItem('admin_auth', 'true');
            showApp();
        } else {
            loginError.textContent = 'Incorrect password. Try admin123';
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
        renderMessages();
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

    // 3. Dummy Data Rendering (Messages)
    const dummyMessages = [
        {
            id: 1,
            name: 'Sarah Jenkins',
            email: 'sarah.j@startup.io',
            service: 'UI/UX Design',
            date: 'Today, 10:42 AM',
            status: 'new',
            subject: 'App Redesign Project',
            message: 'Hi Adetayo! We are a fintech startup looking to revamp our mobile app experience. We love your work on Quiklyy and would love to discuss a potential collaboration. Are you available for a quick chat next week?'
        },
        {
            id: 2,
            name: 'Mark T.',
            email: 'markt88@gmail.com',
            service: 'Web Development',
            date: 'Yesterday',
            status: 'new',
            subject: 'Portfolio site needed',
            message: 'I need a fast, minimal portfolio site for my photography business. Do you handle both design and development for small projects like this?'
        },
        {
            id: 3,
            name: 'Elena Rostova',
            email: 'elena@creative-agency.co',
            service: 'Product Design',
            date: 'Aug 10',
            status: 'read',
            subject: 'Freelance role',
            message: 'Hello, our agency is looking for a freelance product designer to help out with an overflow of client work for the next 3 months. Let me know if you have capacity.'
        }
    ];

    const messagesTbody = document.getElementById('messages-tbody');
    const messageModal = document.getElementById('message-modal');
    const closeModal = document.querySelector('.close-modal');

    function renderMessages() {
        messagesTbody.innerHTML = '';
        
        dummyMessages.forEach(msg => {
            const tr = document.createElement('tr');
            
            const statusClass = msg.status === 'new' ? 'new' : 'read';
            const statusText = msg.status === 'new' ? 'New' : 'Read';

            tr.innerHTML = `
                <td><strong>${msg.name}</strong></td>
                <td>${msg.service}</td>
                <td>${msg.date}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td><button class="view-btn" data-id="${msg.id}">View Details</button></td>
            `;
            messagesTbody.appendChild(tr);
        });

        // Add event listeners to view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                openMessageModal(id);
            });
        });
    }

    function openMessageModal(id) {
        const msg = dummyMessages.find(m => m.id === id);
        if (!msg) return;

        document.getElementById('modal-subject').textContent = msg.subject;
        document.getElementById('modal-name').textContent = msg.name;
        document.getElementById('modal-email').textContent = msg.email;
        document.getElementById('modal-service').textContent = msg.service;
        document.getElementById('modal-message').textContent = msg.message;
        document.getElementById('modal-reply').setAttribute('href', `mailto:${msg.email}?subject=Re: ${msg.subject}`);

        messageModal.style.display = 'flex';

        // Mark as read in our dummy data
        if (msg.status === 'new') {
            msg.status = 'read';
            renderMessages();
            
            // Update badge count
            const badge = document.querySelector('.sidebar-nav .badge');
            let count = parseInt(badge.textContent);
            if (count > 0) badge.textContent = count - 1;
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

    // Handle Forms (Settings)
    document.getElementById('settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
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
        e.target.reset();
        alert('Password updated successfully!');
    });

});
