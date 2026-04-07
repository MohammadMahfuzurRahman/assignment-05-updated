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