let allIssues=[];
let filteredIssues=[];
let currentFilter='all';
let isLoggedIn=false;
const API_BASE='https://phi-lab-server.vercel.app/api/v1/lab';
const loginPage=document.getElementById('loginPage');
const mainPage=document.getElementById('mainPage');
const loginForm=document.getElementById('loginForm');
const usernameInput=document.getElementById('username');
const passwordInput=document.getElementById('password');
const issuesGrid = document.getElementById('issuesGrid');
const issueCount = document.getElementById('issueCount');
const tabs = document.querySelectorAll('.tab-btn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const issueModal = document.getElementById('issueModal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.querySelector('.modal-close');
loginForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    const username=usernameInput.value.trim();
    const password=passwordInput.value.trim();
    if(username==='admin'&&password==='admin123')
    {
        isLoggedIn = true;
        loginPage.classList.add('hidden');
        mainPage.classList.remove('hidden');
        loadAllIssues();
    }
    else
    {
        alert('Invalid credentials! Please use:\nUsername:admin\nPassword:admin123');
    }
});
async function fetchWithRetry(url,options={},retries=3) {
    for(let i=0;i<retries;i++){
        try{
            console.log()
            console.log(`📡 Attempt ${i+1}/${retries}-Fetching: ${url}`);
            const response=await fetch(url,{
                method:options.method||'GET',
                headers:{
                    'Content-Type':'application/json',
                    ...options.headers
                },
                mode:'cors',
                cache: 'no-cache'
            });
             if (response.ok) {
                const data = await response.json();
                console.log(`✅ Success (Attempt ${i + 1})`);
                return data;
            } else {
                console.warn(`⚠️ Response status: ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ Attempt ${i + 1} failed:`, error.message);
            if (i < retries - 1) {
                console.log(`⏳ Retrying in 1 second...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    throw new Error('Failed after all retries');
}
async function loadAllIssues() {
    showLoadingSpinner(true);
    try {
        console.log('🔄 Loading issues...');
        console.log('API URL:', `${API_BASE}/issues`);
        
        const data = await fetchWithRetry(`${API_BASE}/issues`);
        console.log('📦 Raw response:', data);
        
        allIssues = parseIssuesFromResponse(data);
        console.log(`✅ Successfully loaded ${allIssues.length} issues`);
        
        if (allIssues.length > 0) {
            applyFilter('all');
        } else {
            console.warn('⚠️ No issues found');
            issuesGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #6a737d;"><p>No issues available</p></div>';
        }
        
        showLoadingSpinner(false);
        
    } catch (error) {
        console.error('❌ Fatal error loading issues:', error);
        showLoadingSpinner(false);
        issuesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #d73a49;">
                <p>Failed to load issues</p>
                <p style="font-size: 12px; color: #6a737d;">Error: ${error.message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">Retry</button>
            </div>
        `;
        alert('Failed to load issues:\n' + error.message);
    }
}
function parseIssuesFromResponse(data) {
    console.log('🔍 Parsing response...');
    if (data && typeof data === 'object') {
        if (data.issues && Array.isArray(data.issues)) {
            console.log('✓ Found data.issues');
            return data.issues;
        }
        if (data.data && Array.isArray(data.data)) {
            console.log('✓ Found data.data');
            return data.data;
        }
        if (Array.isArray(data)) {
            console.log('✓ Data is array');
            return data;
        }
        for (const key in data) {
            if (Array.isArray(data[key]) && data[key].length > 0) {
                console.log(`✓ Found array in data.${key}`);
                return data[key];
            }
        }
    }
    console.warn('⚠️ Could not find issues array in response');
    return [];
}
function getIssueStatus(issue) {
    return issue.status || issue.state || issue.Status || 'open';
}
function applyFilter(filter) {
    currentFilter = filter;
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.filter === filter) {
            tab.classList.add('active');
        }
    });
    if (filter === 'all') {
        filteredIssues = [...allIssues];
    } else if (filter === 'open') {
        filteredIssues = allIssues.filter(issue => {
            const status = getIssueStatus(issue);
            return status.toLowerCase() === 'open';
        });
    } else if (filter === 'closed') {
        filteredIssues = allIssues.filter(issue => {
            const status = getIssueStatus(issue);
            return status.toLowerCase() === 'closed';
        });
    }
    console.log(`📊 Applied filter: "${filter}" | Total: ${allIssues.length} | Filtered: ${filteredIssues.length}`);
    updateIssueCount();
    renderIssues();
}
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});
async function performSearch() {
    const searchText = searchInput.value.trim();
    if (!searchText) {
        applyFilter(currentFilter);
        return;
    }
    console.log('🔍 Searching for:', searchText);
    showLoadingSpinner(true);
    try {
        const url = `${API_BASE}/issues/search?q=${encodeURIComponent(searchText)}`;
        const data = await fetchWithRetry(url);
        filteredIssues = parseIssuesFromResponse(data);
        console.log(`✅ Found ${filteredIssues.length} matching issues`);
        updateIssueCount();
        renderIssues();
        showLoadingSpinner(false);
    } catch (error) {
        console.error('❌ Search error:', error);
        showLoadingSpinner(false);
        alert('Search failed: ' + error.message);
    }
}
function renderIssues() {
    console.log('🎨 Rendering', filteredIssues.length, 'issues...');
    issuesGrid.innerHTML = '';
    if (!filteredIssues || filteredIssues.length === 0) {
        issuesGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #6a737d;"><p>No issues found</p></div>';
        return;
    }
    filteredIssues.forEach((issue, index) => {
        try {
            const card = createIssueCard(issue);
            issuesGrid.appendChild(card);
        } catch (error) {
            console.error('Error creating card for issue:', issue.id, error);
        }
    });
    console.log(`✅ Rendered ${filteredIssues.length} cards`);
}
function createIssueCard(issue) {
    const card = document.createElement('div');
    const status = getIssueStatus(issue).toLowerCase();
    card.className = `issue-card ${status}`;
    let createdDate = 'Unknown';
    try {
        createdDate = new Date(issue.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        console.warn('Invalid date:', issue.created_at);
    }
    const priorityClass = getPriorityClass(issue.priority);
    const labels = (issue.labels && Array.isArray(issue.labels) && issue.labels.length > 0)
        ? issue.labels.map(label => `<span class="label-badge">${escapeHtml(label)}</span>`).join('')
        : '';
    card.innerHTML = `
        <h3 class="issue-title">${escapeHtml(issue.title || 'Untitled')}</h3>
        <p class="issue-description">${escapeHtml((issue.body || issue.description || 'No description').substring(0, 100))}</p>
        <div class="issue-meta">
            <span class="status-tag ${status}">${status.toUpperCase()}</span>
            <span class="priority-badge ${priorityClass}">${issue.priority || 'NORMAL'}</span>
        </div>
        ${labels ? `<div class="label-container">${labels}</div>` : ''}
        <div class="author-info">
            <span class="author-name">${escapeHtml(issue.author_name || issue.author || 'Unknown')}</span>
            <span class="create-date">${createdDate}</span>
        </div>
    `;
    card.addEventListener('click', () => openIssueModal(issue));
    return card;
}
async function openIssueModal(issue) {
    showLoadingSpinner(true);
    try {
        console.log('📖 Opening modal for issue:', issue.id);
        let fullIssue = issue;
        try {
            const data = await fetchWithRetry(`${API_BASE}/issue/${issue.id}`);
            fullIssue = data.issue || data || issue;
            console.log('✅ Loaded full issue details');
        } catch (error) {
            console.warn('⚠️ Could not fetch full details, using cached data');
            fullIssue = issue;
        }
        displayIssueModal(fullIssue);
        showLoadingSpinner(false);
    } catch (error) {
        console.error('❌ Error opening modal:', error);
        showLoadingSpinner(false);
        displayIssueModal(issue);
    }
}
function displayIssueModal(fullIssue) {
    const status = getIssueStatus(fullIssue).toLowerCase();
    let createdDate = 'Unknown';
    try {
        createdDate = new Date(fullIssue.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        console.warn('Invalid date:', fullIssue.created_at);
    }
    const labels = (fullIssue.labels && Array.isArray(fullIssue.labels) && fullIssue.labels.length > 0)
        ? fullIssue.labels.map(label => `<span class="tag">${escapeHtml(label)}</span>`).join('')
        : '<span class="tag">No labels</span>';
    const priorityClass = getPriorityClass(fullIssue.priority);
    modalBody.innerHTML = `
        <h2 class="modal-title">${escapeHtml(fullIssue.title || 'Untitled')}</h2>
        
        <div class="modal-description">
            ${escapeHtml(fullIssue.body || fullIssue.description || 'No description provided')}
        </div>
        <div class="modal-section">
            <div class="modal-section-title">Status</div>
            <div class="modal-value">
                <span class="status-tag ${status}">${status.toUpperCase()}</span>
            </div>
        </div>
        <div class="modal-section">
            <div class="modal-section-title">Priority</div>
            <div class="modal-value">
                <span class="priority-badge ${priorityClass}">${fullIssue.priority || 'NORMAL'}</span>
            </div>
        </div>
        <div class="modal-section">
            <div class="modal-section-title">Author</div>
            <div class="modal-value">${escapeHtml(fullIssue.author_name || fullIssue.author || 'Unknown')}</div>
        </div>
        <div class="modal-section">
            <div class="modal-section-title">Created Date</div>
            <div class="modal-value">${createdDate}</div>
        </div>
        <div class="modal-section">
            <div class="modal-section-title">Labels</div>
            <div class="modal-tags">${labels}</div>
        </div>
        ${fullIssue.id ? `
        <div class="modal-section">
            <div class="modal-section-title">Issue ID</div>
            <div class="modal-value">#${fullIssue.id}</div>
        </div>
        ` : ''}
        <button class="modal-close-btn">Close</button>
    `;
    issueModal.classList.remove('hidden');
    document.querySelector('.modal-close-btn').addEventListener('click', closeIssueModal);
}
function closeIssueModal() {
    issueModal.classList.add('hidden');
}
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const filter = tab.dataset.filter;
        searchInput.value = '';
        applyFilter(filter);
    });
});
modalClose.addEventListener('click', closeIssueModal);
issueModal.addEventListener('click', (e) => {
    if (e.target === issueModal) {
        closeIssueModal();
    }
});
logoutBtn.addEventListener('click', () => {
    console.log('👋 Logging out...');
    isLoggedIn = false;
    usernameInput.value = '';
    passwordInput.value = '';
    mainPage.classList.add('hidden');
    loginPage.classList.remove('hidden');
    allIssues = [];
    filteredIssues = [];
});
function updateIssueCount() {
    const count = filteredIssues.length;
    issueCount.textContent = `${count} Issue${count !== 1 ? 's' : ''}`;
}
function showLoadingSpinner(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}
function getPriorityClass(priority) {
    const p = (priority || '').toUpperCase();
    const priorityMap = {
        'HIGH': 'priority-high',
        'MEDIUM': 'priority-medium',
        'LOW': 'priority-low'
    };
    return priorityMap[p] || 'priority-medium';
}
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}
console.log('✅ GitHub Issues Tracker Script Loaded');
console.log('📍 API Base URL:', API_BASE);
console.log('🔐 Ready to login with admin/admin123');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
