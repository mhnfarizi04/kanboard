// Global variables
let tasks = [];
let currentView = 'kanban';
let currentPage = 1;
const tasksPerPage = 10;
let editingTaskId = null;
let taskToDelete = null;
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let searchQuery = '';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== APP INITIALIZATION ===');
    
    loadTasks();
    console.log('Tasks loaded:', tasks.length);
    
    // Always check empty state first
    checkEmptyState();
    
    // Only render if we have tasks
    if (tasks.length > 0) {
        renderCurrentView();
    }
    
    initializeDarkMode();
    
    // Set default deadline to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('taskDeadline').value = tomorrow.toISOString().split('T')[0];
    
    console.log('App initialization complete');
});

// Dark mode functions
const initializeDarkMode = () => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        updateDarkModeIcon();
    }
};

const toggleDarkMode = () => {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    document.documentElement.classList.toggle('dark');
    updateDarkModeIcon();
};

const updateDarkModeIcon = () => {
    const icon = document.getElementById('darkModeIcon');
    icon.innerHTML = isDarkMode 
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>';
};

// LocalStorage functions
function loadTasks() {
    const stored = localStorage.getItem('simple_kanban_tasks');
    tasks = stored ? JSON.parse(stored) : [];
}

const saveTasks = () => localStorage.setItem('simple_kanban_tasks', JSON.stringify(tasks));
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// View switching
function switchView(view) {
    // Hide all views
    document.getElementById('kanbanView').classList.add('hidden');
    document.getElementById('listView').classList.add('hidden');

    // Show selected view
    document.getElementById(view + 'View').classList.remove('hidden');

    // Update button states
    document.querySelectorAll('[id$="Btn"]').forEach(btn => {
        btn.classList.remove('bg-primary', 'text-white', 'shadow-sm');
        btn.classList.add('text-gray-600', 'dark:text-gray-300', 'hover:text-gray-800', 'dark:hover:text-white', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
    });

    const activeBtn = document.getElementById(view + 'Btn');
    activeBtn.classList.add('bg-primary', 'text-white', 'shadow-sm');
    activeBtn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:text-gray-800', 'dark:hover:text-white', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');

    currentView = view;
    renderCurrentView();
}

// Render functions
function renderCurrentView() {
    console.log('=== RENDER CURRENT VIEW ===');
    console.log('Current view:', currentView);
    console.log('Tasks count:', tasks.length);
    
    // Always check empty state first
    checkEmptyState();
    
    // Only render if we have tasks
    if (tasks.length > 0) {
        if (currentView === 'kanban') {
            renderKanbanView();
        } else {
            renderListView();
        }
    }
}

function renderKanbanView() {
    console.log('=== RENDER KANBAN START ===');
    console.log('Total tasks:', tasks.length);
    console.log('All tasks:', tasks);
    
    // Clear all columns and reset counts first
    const columns = [
        { status: 'backlog', columnId: 'backlogTasks', countId: 'backlogCount' },
        { status: 'in-progress', columnId: 'inProgressTasks', countId: 'inProgressCount' },
        { status: 'review', columnId: 'reviewTasks', countId: 'reviewCount' },
        { status: 'done', columnId: 'doneTasks', countId: 'doneCount' }
    ];

    // Clear all columns and reset counts
    console.log('Clearing columns...');
    columns.forEach(({ columnId, countId }) => {
        const column = document.getElementById(columnId);
        const countElement = document.getElementById(countId);
        
        console.log(`Column ${columnId}:`, column ? 'found' : 'NOT FOUND');
        console.log(`Count ${countId}:`, countElement ? 'found' : 'NOT FOUND');
        
        if (column) {
            column.innerHTML = '';
            console.log(`Cleared column ${columnId}`);
        }
        if (countElement) {
            countElement.textContent = '0';
            console.log(`Reset count ${countId} to 0`);
        }
    });

    // Group and render tasks
    console.log('Rendering tasks by status...');
    columns.forEach(({ status, columnId, countId }) => {
        const column = document.getElementById(columnId);
        const countElement = document.getElementById(countId);
        
        if (!column || !countElement) {
            console.log(`MISSING ELEMENTS for ${status}: column=${!!column}, count=${!!countElement}`);
            return;
        }
        
        // Filter tasks for this status
        const statusTasks = tasks.filter(task => {
            console.log(`Task "${task.title}" has status "${task.status}", checking against "${status}"`);
            return task.status === status;
        });
        
        // Sort tasks by priority: urgent first, then normal, then low
        const priorityOrder = { urgent: 1, normal: 2, low: 3 };
        statusTasks.sort((a, b) => {
            const priorityA = priorityOrder[a.priority] || 999;
            const priorityB = priorityOrder[b.priority] || 999;
            
            // If priorities are the same, sort by creation date (newest first)
            if (priorityA === priorityB) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            
            return priorityA - priorityB;
        });
        
        console.log(`Status ${status}: ${statusTasks.length} tasks found (sorted by priority)`);
        console.log(`Tasks for ${status}:`, statusTasks);
        
        // Render each task
        statusTasks.forEach((task, index) => {
            console.log(`Creating card for task ${index + 1}:`, task.title);
            const taskCard = createTaskCard(task);
            column.appendChild(taskCard);
            console.log(`Added card to column ${columnId}`);
        });
        
        // Update count
        countElement.textContent = statusTasks.length.toString();
        console.log(`Updated count for ${status}: ${statusTasks.length}`);
    });
    
    console.log('=== RENDER KANBAN END ===');
}

function renderListView() {
    const tbody = document.getElementById('taskTableBody');
    tbody.innerHTML = '';

    // Filter tasks based on search query
    const filteredTasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.priority.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort tasks by priority: urgent first, then normal, then low
    const priorityOrder = { urgent: 1, normal: 2, low: 3 };
    filteredTasks.sort((a, b) => {
        const priorityA = priorityOrder[a.priority] || 999;
        const priorityB = priorityOrder[b.priority] || 999;
        
        // If priorities are the same, sort by creation date (newest first)
        if (priorityA === priorityB) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        
        return priorityA - priorityB;
    });

    // Calculate pagination
    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
    const startIndex = (currentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

    // Render table rows
    paginatedTasks.forEach(task => {
        tbody.appendChild(createTableRow(task));
    });

    // Update pagination info
    updatePaginationInfo(filteredTasks.length);
}

// Task card creation
function createTaskCard(task) {
    console.log('Creating task card for:', task);
    
    const card = document.createElement('div');
    card.className = `priority-${task.priority} p-4 rounded-xl card-hover cursor-pointer transition-all duration-200 animate-fade-in`;
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.onclick = () => openEditTaskModal(task.id);
    card.ondragstart = (e) => drag(e, task.id);

    const priorityColors = {
        urgent: 'bg-red-500 text-white',
        normal: 'bg-blue-500 text-white',
        low: 'bg-gray-500 text-white'
    };

    const priorityLabels = {
        urgent: '🔴 Urgent',
        normal: '🔵 Normal',
        low: '⚪ Low'
    };

    const deadlineText = task.deadline ? formatDeadline(task.deadline) : '';
    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';

    card.innerHTML = `
        <div class="flex items-start justify-between mb-3">
            <h4 class="font-medium text-gray-800 dark:text-white text-sm leading-tight flex-1 pr-2">${task.title}</h4>
            <button onclick="event.stopPropagation(); openDeleteModal('${task.id}')" class="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>
        
        ${task.description ? `<p class="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">${task.description}</p>` : ''}
        
        <div class="flex items-center justify-between">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}">
                ${priorityLabels[task.priority]}
            </span>
            ${task.deadline ? `<span class="text-xs px-2 py-1 rounded ${isOverdue ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}">${deadlineText}</span>` : ''}
        </div>
        
        <!-- Drag Handle -->
        <div class="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
            </svg>
        </div>
    `;

    // Add group class for hover effects
    card.classList.add('group', 'relative');

    return card;
}

function createTableRow(task) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50/50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors animate-fade-in';
    row.onclick = () => openEditTaskModal(task.id);

    const priorityColors = {
        urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };

    const statusColors = {
        'backlog': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        'review': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        'done': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    };

    const statusLabels = {
        'backlog': 'Backlog',
        'in-progress': 'In Progress',
        'review': 'Review',
        'done': 'Done'
    };

    const priorityLabels = {
        urgent: 'Urgent',
        normal: 'Normal',
        low: 'Low'
    };

    const deadlineText = task.deadline ? formatDeadline(task.deadline) : '-';
    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';

    row.innerHTML = `
        <td class="px-6 py-4">
            <div class="text-sm font-medium text-gray-900 dark:text-white">${task.title}</div>
            ${task.description ? `<div class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">${task.description}</div>` : ''}
        </td>
        <td class="px-6 py-4">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}">
                ${priorityLabels[task.priority]}
            </span>
        </td>
        <td class="px-6 py-4 text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-white'}">
            ${deadlineText}
        </td>
        <td class="px-6 py-4">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}">
                ${statusLabels[task.status]}
            </span>
        </td>
        <td class="px-6 py-4 text-sm font-medium">
            <button onclick="event.stopPropagation(); openEditTaskModal('${task.id}')" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3 transition-colors">
                Edit
            </button>
            <button onclick="event.stopPropagation(); openDeleteModal('${task.id}')" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                Delete
            </button>
        </td>
    `;

    return row;
}

// Utility functions
function formatDeadline(deadline) {
    if (!deadline) return '';
    
    const date = new Date(deadline);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString();
    }
}

function checkEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const kanbanView = document.getElementById('kanbanView');
    const listView = document.getElementById('listView');
    
    console.log('=== CHECK EMPTY STATE ===');
    console.log('Tasks length:', tasks.length);
    console.log('Current view:', currentView);
    
    if (tasks.length === 0) {
        console.log('No tasks - showing empty state');
        emptyState.classList.remove('hidden');
        kanbanView.classList.add('hidden');
        listView.classList.add('hidden');
    } else {
        console.log('Tasks exist - hiding empty state, showing', currentView, 'view');
        emptyState.classList.add('hidden');
        
        // Show the correct view based on currentView
        if (currentView === 'kanban') {
            kanbanView.classList.remove('hidden');
            listView.classList.add('hidden');
        } else {
            listView.classList.remove('hidden');
            kanbanView.classList.add('hidden');
        }
    }
}

// Drag and drop functions
let draggedTaskId = null;

function allowDrop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add('drag-over');
}

function drag(ev, taskId) {
    draggedTaskId = taskId;
    ev.target.classList.add('dragging');
    ev.dataTransfer.effectAllowed = 'move';
}

function drop(ev, newStatus) {
    ev.preventDefault();
    ev.currentTarget.classList.remove('drag-over');
    
    if (draggedTaskId) {
        const task = tasks.find(t => t.id === draggedTaskId);
        if (task && task.status !== newStatus) {
            task.status = newStatus;
            task.updatedAt = new Date().toISOString();
            saveTasks();
            renderCurrentView();
            showToast('Task moved successfully', 'success');
        }
        
        // Clean up
        document.querySelectorAll('.dragging').forEach(el => {
            el.classList.remove('dragging');
        });
        draggedTaskId = null;
    }
}

// Remove drag-over class when drag leaves
document.addEventListener('dragleave', function(ev) {
    if (ev.target.classList.contains('drag-over')) {
        ev.target.classList.remove('drag-over');
    }
});

// Modal functions
function openAddTaskModal() {
    editingTaskId = null;
    document.getElementById('modalTitle').textContent = 'Add New Task';
    document.getElementById('taskForm').reset();
    
    // Set default deadline to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('taskDeadline').value = tomorrow.toISOString().split('T')[0];

    document.getElementById('taskModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Focus on title field
    setTimeout(() => {
        document.getElementById('taskTitle').focus();
    }, 100);
}

function openEditTaskModal(taskId) {
    editingTaskId = taskId;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('modalTitle').textContent = 'Edit Task';
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('taskDeadline').value = task.deadline || '';

    document.getElementById('taskModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    editingTaskId = null;
}

function openDeleteModal(taskId) {
    taskToDelete = taskId;
    document.getElementById('deleteModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    taskToDelete = null;
}

function confirmDelete() {
    if (taskToDelete) {
        // Find the task element and add fade-out animation
        const taskElements = document.querySelectorAll(`[data-task-id="${taskToDelete}"]`);
        taskElements.forEach(el => {
            el.classList.add('fade-out-animation');
        });

        // Remove task immediately from array and localStorage
        tasks = tasks.filter(t => t.id !== taskToDelete);
        saveTasks(); // Save to localStorage immediately
        
        // Update views after animation
        setTimeout(() => {
            renderCurrentView();
            showToast('Task deleted successfully', 'success');
        }, 300);

        closeDeleteModal();
        taskToDelete = null; // Reset the variable
    }
}

// Form submission
document.getElementById('taskForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION START ===');
    
    const title = document.getElementById('taskTitle').value.trim();
    console.log('Title:', title);
    
    if (!title) {
        console.log('No title provided, returning');
        return;
    }

    const taskData = {
        title: title,
        description: document.getElementById('taskDescription').value.trim(),
        priority: document.getElementById('taskPriority').value,
        status: document.getElementById('taskStatus').value,
        deadline: document.getElementById('taskDeadline').value,
        updatedAt: new Date().toISOString()
    };
    
    console.log('Task data:', taskData);
    console.log('Current view:', currentView);
    console.log('Tasks before:', tasks.length);

    if (editingTaskId) {
        // Update existing task
        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
            Object.assign(task, taskData);
            console.log('Updated existing task:', task);
            showToast('Task updated successfully', 'success');
        }
    } else {
        // Create new task
        const newTask = {
            id: generateId(),
            ...taskData,
            createdAt: new Date().toISOString()
        };
        console.log('Creating new task:', newTask);
        tasks.push(newTask);
        console.log('Tasks after push:', tasks.length);
        showToast('Task created successfully', 'success');
    }

    // Save and render
    console.log('Saving tasks...');
    saveTasks();
    
    console.log('Rendering current view...');
    renderCurrentView();
    
    console.log('Closing modal...');
    closeTaskModal();
    
    console.log('=== FORM SUBMISSION END ===');
});

// Search function
function handleSearch(query) {
    searchQuery = query;
    currentPage = 1; // Reset to first page when searching
    renderListView();
}

// Pagination functions
function updatePaginationInfo(totalFilteredTasks = tasks.length) {
    const totalPages = Math.ceil(totalFilteredTasks / tasksPerPage);
    const startIndex = (currentPage - 1) * tasksPerPage;
    const endIndex = Math.min(startIndex + tasksPerPage, totalFilteredTasks);

    document.getElementById('showingStart').textContent = totalFilteredTasks === 0 ? 0 : startIndex + 1;
    document.getElementById('showingEnd').textContent = endIndex;
    document.getElementById('totalTasks').textContent = totalFilteredTasks;

    // Update pagination buttons
    document.getElementById('prevBtn').disabled = currentPage <= 1;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages;

    // Update page numbers
    updatePageNumbers(totalPages);
}

function updatePageNumbers(totalPages) {
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            i === currentPage 
                ? 'bg-primary text-white' 
                : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
        }`;
        pageBtn.onclick = () => goToPage(i);
        pageNumbers.appendChild(pageBtn);
    }
}

function changePage(direction) {
    const filteredTasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.priority.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderListView();
    }
}

function goToPage(page) {
    currentPage = page;
    renderListView();
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    toastMessage.textContent = message;

    // Set icon based on type
    if (type === 'success') {
        toastIcon.innerHTML = '<svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    } else if (type === 'error') {
        toastIcon.innerHTML = '<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    }

    toast.classList.remove('hidden');

    // Auto hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Close modals on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeTaskModal();
        closeDeleteModal();
    }
});

// Close modals when clicking outside
document.getElementById('taskModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeTaskModal();
    }
});

document.getElementById('deleteModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeDeleteModal();
    }
});