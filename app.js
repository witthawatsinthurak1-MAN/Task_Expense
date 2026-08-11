const API_URL = "https://script.google.com/macros/s/AKfycby-6sCu-NSoVInpWD0EPjdQu7b6LAcvPEFDNtHI490ivIKvHWzqKLU7DuC5YH5qvWUX/exec";

document.addEventListener('DOMContentLoaded', function () {
    if (localStorage.getItem('currentUser')) {
        showApp();
    }

    document.getElementById('loginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('loginUser').value;
        const password = document.getElementById('loginPass').value;
        
        fetch(`${API_URL}?action=login&username=${username}&password=${password}`)
            .then(res => res.json())
            .then(result => {
                if (result.status === 'success') {
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                    showApp();
                } else {
                    alert(result.message);
                }
            });
    });

    document.getElementById('registerForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const username = document.getElementById('regUser').value;
        const password = document.getElementById('regPass').value;

        fetch(`${API_URL}?action=register&name=${name}&username=${username}&password=${password}`)
            .then(res => res.json())
            .then(result => {
                alert(result.message);
                if (result.status === 'success') toggleAuth(false);
            });
    });

    document.getElementById('taskForm').addEventListener('submit', function (e) {
        e.preventDefault();
        sendData({
            action: 'addTask',
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDesc').value,
            dueDate: document.getElementById('taskDueDate').value
        });
    });

    document.getElementById('txForm').addEventListener('submit', function (e) {
        e.preventDefault();
        sendData({
            action: 'addTransaction',
            type: document.getElementById('txType').value,
            category: document.getElementById('txCategory').value,
            amount: document.getElementById('txAmount').value,
            date: document.getElementById('txDate').value
        });
    });
});

function toggleAuth(isRegister) {
    document.getElementById('loginForm').classList.toggle('d-none', isRegister);
    document.getElementById('registerForm').classList.toggle('d-none', !isRegister);
    document.getElementById('authTitle').innerText = isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ';
}

function showApp() {
    document.getElementById('authContainer').classList.add('d-none');
    document.getElementById('appContainer').classList.remove('d-none');
    loadData();
}

function logout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

function loadData() {
    fetch(`${API_URL}?action=getData`)
        .then(response => response.json())
        .then(data => {
            updateDashboard(data.transactions);
            initCalendar(data.tasks);
        });
}

function sendData(data) {
    const params = new URLSearchParams(data);
    fetch(`${API_URL}?${params.toString()}`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                alert('บันทึกข้อมูลสำเร็จ!');
                location.reload();
            }
        });
}

function updateDashboard(transactions) {
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(tx => {
        const amount = Number(tx.Amount);
        if (tx.Type === 'Income') totalIncome += amount;
        if (tx.Type === 'Expense') totalExpense += amount;
    });
    document.getElementById('totalIncome').innerText = totalIncome.toLocaleString() + ' ฿';
    document.getElementById('totalExpense').innerText = totalExpense.toLocaleString() + ' ฿';
    document.getElementById('netBalance').innerText = (totalIncome - totalExpense).toLocaleString() + ' ฿';
}

function initCalendar(tasks) {
    var calendarEl = document.getElementById('calendar');
    var events = tasks.map(task => ({
        title: '📌 ' + task.Title,
        start: task.DueDate,
        color: '#0d6efd'
    }));
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' },
        events: events
    });
    calendar.render();
}