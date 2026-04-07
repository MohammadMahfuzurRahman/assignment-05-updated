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