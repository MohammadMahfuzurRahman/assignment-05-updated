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
