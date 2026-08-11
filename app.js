const API_URL = "https://script.google.com/macros/s/AKfycbyh5oX1-x0nqumVA41iENRGE5IOPGY0kL33AJ6Xe7QqFIrNtAUaYWYNy37KMs4j8EiU/exec";

document.addEventListener("DOMContentLoaded", () => {
    // ตรวจสอบสถานะการล็อกอินค้างไว้
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
        showDashboard(JSON.parse(savedUser));
    }

    // จัดการฟอร์ม Login
    document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("loginUser").value;
        const password = document.getElementById("loginPass").value;

        Swal.fire({ title: 'กำลังตรวจสอบ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            const res = await fetch(`${API_URL}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`).then(r => r.json());
            if (res.status === "success") {
                localStorage.setItem("user", JSON.stringify(res.user));
                Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: `ยินดีต้อนรับ ${res.user.name}`, timer: 1200, showConfirmButton: false })
                    .then(() => showDashboard(res.user));
            } else {
                Swal.fire({ icon: 'error', title: 'เข้าสู่ระบบไม่สำเร็จ', text: res.message });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' });
        }
    });

    // จัดการฟอร์ม Register
    document.getElementById("registerForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("regName").value;
        const username = document.getElementById("regUser").value;
        const password = document.getElementById("regPass").value;

        Swal.fire({ title: 'กำลังสมัครสมาชิก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            const res = await fetch(`${API_URL}?action=register&name=${encodeURIComponent(name)}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`).then(r => r.json());
            if (res.status === "success") {
                Swal.fire({ icon: 'success', title: 'สมัครสมาชิกสำเร็จ!', text: 'คุณสามารถเข้าสู่ระบบได้ทันที' })
                    .then(() => toggleAuthModal(false));
            } else {
                Swal.fire({ icon: 'error', title: 'สมัครไม่สำเร็จ', text: res.message });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' });
        }
    });

    // เพิ่มงานใหม่
    document.getElementById("taskForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("taskTitle").value;
        const description = document.getElementById("taskDesc").value;
        const dueDate = document.getElementById("taskDueDate").value;

        Swal.fire({ title: 'กำลังบันทึกงาน...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const res = await fetch(`${API_URL}?action=addTask&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&dueDate=${encodeURIComponent(dueDate)}`).then(r => r.json());
        
        if (res.status === "success") {
            Swal.fire({ icon: 'success', title: 'บันทึกงานสำเร็จ', timer: 1000, showConfirmButton: false });
            document.getElementById("taskForm").reset();
            loadAllData();
        }
    });

    // เพิ่มรายรับ-รายจ่าย
    document.getElementById("txForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const type = document.getElementById("txType").value;
        const category = document.getElementById("txCategory").value;
        const amount = document.getElementById("txAmount").value;
        const date = document.getElementById("txDate").value;

        Swal.fire({ title: 'กำลังบันทึกธุรกรรม...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const res = await fetch(`${API_URL}?action=addTransaction&type=${type}&category=${encodeURIComponent(category)}&amount=${amount}&date=${date}`).then(r => r.json());
        
        if (res.status === "success") {
            Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1000, showConfirmButton: false });
            document.getElementById("txForm").reset();
            loadAllData();
        }
    });
});

function showDashboard(user) {
    // ปิดหน้า Modal
    const modalEl = document.getElementById('authModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    document.getElementById('authContainer').classList.add('d-none');
    document.getElementById('appContainer').classList.remove('d-none');
    loadAllData();
}

async function loadAllData() {
    try {
        const res = await fetch(`${API_URL}?action=getData`).then(r => r.json());
        if (res.status === "success") {
            updateFinancials(res.transactions);
            initCalendar(res.tasks);
        }
    } catch (e) {
        console.error("Error loading data:", e);
    }
}

function updateFinancials(transactions) {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
        const amt = parseFloat(t.amount) || 0;
        if (t.type === "Income") totalIncome += amt;
        else if (t.type === "Expense") totalExpense += amt;
    });

    const net = totalIncome - totalExpense;
    document.getElementById("totalIncome").innerText = totalIncome.toLocaleString() + " ฿";
    document.getElementById("totalExpense").innerText = totalExpense.toLocaleString() + " ฿";
    document.getElementById("netBalance").innerText = net.toLocaleString() + " ฿";
}

function initCalendar(tasks) {
    const calendarEl = document.getElementById('calendar');
    calendarEl.innerHTML = ""; // เคลียร์ของเก่า
    
    const events = tasks.map(t => ({
        title: t.title,
        start: t.dueDate,
        allDay: true
    }));

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'th',
        events: events,
        height: 450
    });
    calendar.render();
}

function logout() {
    Swal.fire({
        title: 'ออกจากระบบ',
        text: "คุณต้องการออกจากระบบใช่หรือไม่?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ใช่, ออกจากระบบ',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem("user");
            location.reload();
        }
    });
}
