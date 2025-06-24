// Bucket page logic
function getBuckets() {
    return JSON.parse(localStorage.getItem('buckets') || '[]');
}
function saveBuckets(buckets) {
    localStorage.setItem('buckets', JSON.stringify(buckets));
}
function getBucketById(id) {
    return getBuckets().find(b => b.id === id);
}
function upsertBucket(bucket) {
    let buckets = getBuckets();
    const idx = buckets.findIndex(b => b.id === bucket.id);
    if (idx > -1) {
        buckets[idx] = bucket;
    } else {
        buckets.push(bucket);
    }
    saveBuckets(buckets);
}

function showToast(message) {
    let toast = document.getElementById('customToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'customToast';
        toast.style.position = 'fixed';
        toast.style.bottom = '32px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = 'linear-gradient(90deg,#43e97b,#38f9d7)';
        toast.style.color = '#183c24';
        toast.style.fontWeight = 'bold';
        toast.style.padding = '16px 32px';
        toast.style.borderRadius = '12px';
        toast.style.boxShadow = '0 4px 24px rgba(67,233,123,0.18)';
        toast.style.fontSize = '1.1rem';
        toast.style.zIndex = 9999;
        toast.style.opacity = 0;
        toast.style.transition = 'opacity 0.3s';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = 1;
    setTimeout(() => { toast.style.opacity = 0; }, 2000);
}

window.addEventListener('DOMContentLoaded', () => {
    // Set date fields
    const now = new Date();
    const dateCreated = document.getElementById('dateCreated');
    const dateModified = document.getElementById('dateModified');
    if (dateCreated) dateCreated.value = now.toLocaleString();
    if (dateModified) dateModified.value = now.toLocaleString();

    // Task creation logic
    const tasksList = document.getElementById('tasksList');
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn && tasksList) {
        addTaskBtn.onclick = function() {
            addTask();
        };
    }

    function addTask(taskData = {}) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-card';
        const created = taskData.created || new Date().toLocaleString();
        const modified = taskData.modified || created;
        taskDiv.innerHTML = `
            <input type="text" class="input-dark task-title" placeholder="Task title" required style="width:70%;margin-bottom:6px;" value="${taskData.title || ''}">
            <input type="date" class="input-dark task-date" style="width:28%;margin-left:2%;margin-bottom:6px;" value="${taskData.due || ''}">
            <select class="input-dark task-status" style="width:100%;margin-bottom:6px;">
                <option${taskData.status === 'Not Started' ? ' selected' : ''}>Not Started</option>
                <option${taskData.status === 'In Progress' ? ' selected' : ''}>In Progress</option>
                <option${taskData.status === 'Completed' ? ' selected' : ''}>Completed</option>
            </select>
            <span class="task-timestamp">Created: ${created}</span>
            <span class="task-timestamp">Last Modified: <span class="last-modified">${modified}</span></span>
            <div class="subtasks-area">
                <label style="color:#7fffa7;font-size:0.95em;">Subtasks</label>
                <div class="subtasks-list"></div>
                <button type="button" class="create-bucket-btn add-subtask-btn" style="padding:4px 12px;font-size:0.95em;margin-top:4px;">+ Add Subtask</button>
            </div>
            <div class="task-actions">
                <button type="button" class="edit-task-btn">Edit</button>
                <button type="button" class="delete-task-btn">Delete</button>
            </div>
            <hr style="border:0;border-top:1px solid #2e7d32;margin:12px 0;">
        `;
        // Subtask logic
        const subtasksList = taskDiv.querySelector('.subtasks-list');
        taskDiv.querySelector('.add-subtask-btn').onclick = function() {
            const subtaskInput = document.createElement('input');
            subtaskInput.type = 'text';
            subtaskInput.className = 'input-dark subtask-title';
            subtaskInput.placeholder = 'Subtask';
            subtaskInput.style = 'width:90%;margin-bottom:4px;';
            subtasksList.appendChild(subtaskInput);
        };
        // Edit logic
        taskDiv.querySelector('.edit-task-btn').onclick = function() {
            const title = taskDiv.querySelector('.task-title');
            const date = taskDiv.querySelector('.task-date');
            const status = taskDiv.querySelector('.task-status');
            title.removeAttribute('readonly');
            date.removeAttribute('readonly');
            status.removeAttribute('disabled');
            title.focus();
            // Update last modified
            const lastMod = taskDiv.querySelector('.last-modified');
            lastMod.textContent = new Date().toLocaleString();
        };
        // Delete logic
        taskDiv.querySelector('.delete-task-btn').onclick = function() {
            tasksList.removeChild(taskDiv);
        };
        tasksList.appendChild(taskDiv);
    }

    // Get bucket ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const bucketId = urlParams.get('id');
    let editingBucket = null;
    if (bucketId) {
        editingBucket = getBucketById(bucketId);
        if (editingBucket) {
            document.getElementById('bucketTitle').value = editingBucket.title || '';
            document.getElementById('dateCreated').value = editingBucket.dateCreated || '';
            document.getElementById('dateModified').value = editingBucket.dateModified || '';
            document.getElementById('bucketNotes').value = editingBucket.notes || '';
            // Render tasks
            if (editingBucket.tasks) {
                editingBucket.tasks.forEach(task => addTask(task));
            }
        }
    }

    document.getElementById('bucketForm').onsubmit = function(e) {
        e.preventDefault();
        // Gather data
        const title = document.getElementById('bucketTitle').value;
        const dateCreated = document.getElementById('dateCreated').value || new Date().toLocaleString();
        const dateModified = new Date().toLocaleString();
        const notes = document.getElementById('bucketNotes').value;
        // Gather tasks
        const tasks = Array.from(document.querySelectorAll('.task-card')).map(card => {
            return {
                title: card.querySelector('.task-title').value,
                due: card.querySelector('.task-date').value,
                status: card.querySelector('.task-status').value,
                created: card.querySelector('.task-timestamp')?.textContent?.replace('Created: ','') || dateCreated,
                modified: card.querySelector('.last-modified')?.textContent || dateModified,
                subtasks: Array.from(card.querySelectorAll('.subtask-title')).map(st => st.value)
            };
        });
        // Create or update bucket
        const bucket = {
            id: bucketId || (Date.now() + '' + Math.floor(Math.random()*10000)),
            title,
            dateCreated,
            dateModified,
            notes,
            tasks
        };
        upsertBucket(bucket);
        showToast('Bucket saved!');
        setTimeout(() => { window.location = '../index.html'; }, 1200);
    };
});
