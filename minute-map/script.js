function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("This browser does not support notifications. Please use a modern browser to enable task reminders and focus mode notifications.");
        return;
    }
    Notification.requestPermission().then(permission => {
        if (permission !== "granted") {
            alert("Notifications are disabled. Please enable them in your browser settings to receive task reminders and focus mode notifications.");
        } else {
            console.log("Notification permission granted!");
        }
    });
}

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let customCategories = JSON.parse(localStorage.getItem('customCategories')) || [];
let streakCount = parseInt(localStorage.getItem('streakCount')) || 3;
let userName = localStorage.getItem('userName') || null;
let focusModeActive = false; // Track Focus Mode state

if (!userName) {
    userName = prompt("What's your name, Task Master?");
    if (userName && userName.trim() !== '') {
        userName = userName.trim();
        localStorage.setItem('userName', userName);
    } else {
        userName = "Task Master";
    }
}

function setGreeting() {
    const hour = new Date().getHours();
    let greeting;
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 17) greeting = "Good Afternoon";
    else if (hour < 20) greeting = "Good Evening";
    else greeting = "Good Night";
    document.getElementById('greeting').textContent = `${greeting}, ${userName}!`;
}

function updateStreakFire() {
    const fire = document.querySelector('.fire');
    if (streakCount >= 5) {
        fire.style.animationDuration = '0.8s';
        fire.style.fontSize = '1.2rem';
    } else if (streakCount >= 3) {
        fire.style.animationDuration = '1s';
        fire.style.fontSize = '1rem';
    }
}

function populateCategories() {
    const categorySelect = document.getElementById('category');
    const quickCategorySelect = document.getElementById('quickCategory');
    const customOption = categorySelect.querySelector('option[value="custom"]');
    const quickCustomOption = quickCategorySelect.querySelector('option[value="custom"]');
    customCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.insertBefore(option, customOption);
        const quickOption = option.cloneNode(true);
        quickCategorySelect.insertBefore(quickOption, quickCustomOption);
    });
}

function handleCategoryChange(selectElement) {
    if (selectElement.value === 'custom') {
        const newCategory = prompt('Enter a new category name:');
        if (newCategory && newCategory.trim() !== '' && !customCategories.includes(newCategory.trim())) {
            customCategories.push(newCategory.trim());
            localStorage.setItem('customCategories', JSON.stringify(customCategories));
            const option = document.createElement('option');
            option.value = newCategory.trim();
            option.textContent = newCategory.trim();
            document.getElementById('category').insertBefore(option, document.getElementById('category').lastElementChild);
            document.getElementById('quickCategory').insertBefore(option.cloneNode(true), document.getElementById('quickCategory').lastElementChild);
            selectElement.value = newCategory.trim();
        } else {
            selectElement.value = 'Work';
        }
    }
}

document.getElementById('category').addEventListener('change', function() {
    handleCategoryChange(this);
});

document.getElementById('quickCategory').addEventListener('change', function() {
    handleCategoryChange(this);
});

function addTask() {
    const taskInput = document.getElementById('taskInput');
    const dueDate = document.getElementById('dueDate').value;
    const dueTime = document.getElementById('dueTime').value;
    const priority = document.getElementById('priority').value;
    const category = document.getElementById('category').value;
    const taskText = taskInput.value.trim();

    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    const task = {
        id: Date.now(),
        text: taskText,
        dueDate: dueDate,
        dueTime: dueTime,
        priority: priority,
        category: category,
        completed: false
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
    scheduleTaskReminder(task);
    taskInput.value = '';
    document.getElementById('dueDate').value = '';
    document.getElementById('dueTime').value = '';
}

function addQuickTask() {
    const taskInput = document.getElementById('quickTaskInput');
    const priority = document.getElementById('quickPriority').value;
    const category = document.getElementById('quickCategory').value;
    const taskText = taskInput.value.trim();

    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    const task = {
        id: Date.now(),
        text: taskText,
        dueDate: '',
        dueTime: '',
        priority: priority,
        category: category,
        completed: false
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
    taskInput.value = '';
    toggleQuickAdd();
}

function scheduleTaskReminder(task) {
    if (!task.dueDate || !task.dueTime) return;

    const dueDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
    const now = new Date();
    const timeUntilDue = dueDateTime - now;

    console.log(`Scheduling reminder for task "${task.text}" at ${dueDateTime} (in ${timeUntilDue}ms)`);

    if (timeUntilDue > 0) {
        setTimeout(() => {
            if (Notification.permission === "granted") {
                new Notification("Task Reminder", {
                    body: `It's time to complete: "${task.text}"!`,
                    icon: "Logo.png"
                });
                console.log(`Reminder triggered for task "${task.text}" at ${new Date()}`);
            } else {
                console.log("Notification permission not granted.");
            }
        }, timeUntilDue);
    } else {
        console.log("Due date is in the past; no reminder scheduled.");
    }
}

// Simulate Focus Mode notification (triggered when visiting focus.html or periodically)
function scheduleFocusModeReminder() {
    if (focusModeActive) return; // Avoid multiple reminders

    focusModeActive = true;
    const reminderInterval = 30 * 60 * 1000; // 30 minutes interval for Focus Mode reminder

    setInterval(() => {
        if (Notification.permission === "granted") {
            new Notification("Focus Mode Reminder", {
                body: "Time to start a focus session! Stay productive with MinuteMap.",
                icon: "Logo.png"
            });
            console.log("Focus Mode reminder triggered at", new Date());
        }
    }, reminderInterval);
}

function editTask(id) {
    const task = tasks.find(task => task.id === id);
    const newText = prompt('Edit task:', task.text);
    if (newText && newText.trim() !== '') {
        tasks = tasks.map(task =>
            task.id === id ? { ...task, text: newText.trim() } : task
        );
        saveTasks();
        renderTasks();
    }
}

function deleteTask(id) {
    const taskElement = document.querySelector(`li[data-id="${id}"]`);
    if (taskElement) {
        taskElement.classList.add('removed');
        taskElement.addEventListener('animationend', () => {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
        });
    }
}

function clearAllTasks() {
    if (confirm('Are you sure you want to clear all tasks?')) {
        const taskList = document.getElementById('taskList');
        taskList.querySelectorAll('li').forEach(li => {
            li.classList.add('removed');
        });
        taskList.addEventListener('animationend', () => {
            tasks = [];
            saveTasks();
            renderTasks();
        }, { once: true });
    }
}

function toggleTask(id) {
    tasks = tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    if (tasks.find(task => task.id === id).completed) {
        streakCount++;
        localStorage.setItem('streakCount', streakCount);
        document.getElementById('streakCount').textContent = `${streakCount} days`;
        updateStreakFire();
        triggerConfetti();
    }
    saveTasks();
    renderTasks();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    const sort = document.getElementById('sort').value;
    taskList.innerHTML = '';

    let sortedTasks = [...tasks];
    if (sort === 'priority') {
        sortedTasks.sort((a, b) => {
            const order = { high: 3, medium: 2, low: 1 };
            return order[b.priority] - order[a.priority];
        });
    } else if (sort === 'dueDate') {
        sortedTasks.sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate + 'T' + (a.dueTime || '00:00')) - new Date(b.dueDate + 'T' + (b.dueTime || '00:00'));
        });
    } else if (sort === 'category') {
        sortedTasks.sort((a, b) => a.category.localeCompare(b.category));
    }

    sortedTasks.forEach(task => {
        const li = document.createElement('li');
        li.draggable = true;
        li.setAttribute('data-id', task.id);
        li.className = `${task.priority} ${task.completed ? 'completed' : ''} added`;
        li.innerHTML = `
            <span class="task-text" onclick="toggleTask(${task.id})">
                <span class="priority-indicator"></span>
                ${task.text}
                ${task.dueDate ? `<small>(Due: ${task.dueDate}${task.dueTime ? ' ' + task.dueTime : ''})</small>` : ''}
                <span class="category-tag">${task.category}</span>
            </span>
            <div>
                <button class="edit-btn" onclick="editTask(${task.id})" data-tooltip="Edit this task">Edit</button>
                <button class="delete-btn" onclick="deleteTask(${task.id})" data-tooltip="Delete this task">Delete</button>
            </div>
        `;
        taskList.appendChild(li);
    });
    updateProgress();
    updateInsights();
}

function updateProgress() {
    const completed = tasks.filter(task => task.completed).length;
    const total = tasks.length;
    const progress = total ? (completed / total) * 100 : 0;
    document.getElementById('progress').style.width = `${progress}%`;
    document.getElementById('progressPercentage').textContent = `${Math.round(progress)}%`;
}

function updateInsights() {
    const insightsText = document.getElementById('insightsText');
    const categories = [...new Set(tasks.map(task => task.category))];
    const insights = categories.map(category => {
        const count = tasks.filter(task => task.category === category).length;
        return `${category}: ${count}`;
    }).join(', ');
    insightsText.textContent = insights || 'Work: 0, Personal: 0, Urgent: 0';
}

const taskList = document.getElementById('taskList');
taskList.addEventListener('dragstart', (e) => {
    const li = e.target.closest('li');
    if (li) {
        li.classList.add('dragging');
        e.dataTransfer.setData('text/plain', li.getAttribute('data-id'));
    }
});

taskList.addEventListener('dragend', (e) => {
    const li = e.target.closest('li');
    if (li) {
        li.classList.remove('dragging');
    }
});

taskList.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(taskList, e.clientY);
    const dragging = document.querySelector('.dragging');
    if (afterElement == null) {
        taskList.appendChild(dragging);
    } else {
        taskList.insertBefore(dragging, afterElement);
    }
});

taskList.addEventListener('drop', (e) => {
    e.preventDefault();
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
    const newOrder = Array.from(taskList.children).map(li => parseInt(li.getAttribute('data-id')));
    const newTasks = [];
    newOrder.forEach(id => {
        const task = tasks.find(task => task.id === id);
        if (task) newTasks.push(task);
    });
    tasks = newTasks;
    saveTasks();
    renderTasks();
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas.getContext('2d');
confettiCanvas.width = window.innerWidth;
confettiCanvas.height = window.innerHeight;
const confettiParticles = [];

class ConfettiParticle {
    constructor() {
        this.x = Math.random() * confettiCanvas.width;
        this.y = Math.random() * confettiCanvas.height - confettiCanvas.height;
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 5 + 2;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.y > confettiCanvas.height) {
            this.y = -this.size;
            this.x = Math.random() * confettiCanvas.width;
        }
    }
    draw() {
        confettiCtx.fillStyle = this.color;
        confettiCtx.beginPath();
        confettiCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        confettiCtx.fill();
    }
}

function triggerConfetti() {
    confettiParticles.length = 0;
    for (let i = 0; i < 50; i++) {
        confettiParticles.push(new ConfettiParticle());
    }
    animateConfetti();
}

function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiParticles.forEach((particle, i) => {
        particle.update();
        particle.draw();
        if (particle.y > confettiCanvas.height + particle.size) {
            confettiParticles.splice(i, 1);
        }
    });
    if (confettiParticles.length > 0) {
        requestAnimationFrame(animateConfetti);
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const toggle = document.querySelector('.theme-toggle');
    toggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    document.querySelector('.theme-toggle').textContent = '☀️';
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function toggleQuickAdd() {
    document.getElementById('quickAddForm').classList.toggle('open');
}

const footerQuotes = [
    "Seize the day, one task at a time.",
    "Every minute counts towards your success.",
    "Organize today, conquer tomorrow."
];
let footerQuoteIndex = 0;
function rotateFooterQuote() {
    document.getElementById('footerQuote').textContent = footerQuotes[footerQuoteIndex];
    footerQuoteIndex = (footerQuoteIndex + 1) % footerQuotes.length;
}
setInterval(rotateFooterQuote, 5000);
rotateFooterQuote();

const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const particles = [];
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.size > 0.2) this.size -= 0.01;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }
    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}
function initParticles() {
    for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
    }
}
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
        p.update();
        p.draw();
        if (p.size <= 0.2) particles.splice(i, 1);
    });
    if (particles.length < 50) particles.push(new Particle());
    requestAnimationFrame(animateParticles);
}
initParticles();
animateParticles();

// Initialize notifications and Focus Mode reminder
requestNotificationPermission();
setGreeting();
populateCategories();
renderTasks();
updateStreakFire();
scheduleFocusModeReminder();

// Re-schedule reminders for existing tasks on page load
tasks.forEach(task => {
    if (!task.completed) {
        scheduleTaskReminder(task);
    }
});