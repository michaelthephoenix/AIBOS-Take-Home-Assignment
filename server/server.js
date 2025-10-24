const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5002;

// Middleware
app.use(cors()); // Allows requests from our React app
app.use(express.json()); // Allows us to parse JSON in the request body

// In-memory "database"
let tasks = [
    { id: 1, text: 'Learn Docker', completed: false },
    { id: 2, text: 'Build a TO-DO app', completed: true },
    { id: 3, text: 'Deploy the app', completed: false },
];
let nextId = 4;

// --- API ROUTES ---

// GET /api/tasks - List all tasks
app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

// POST /api/tasks - Create a new task
app.post('/api/tasks', (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Task text is required' });
    }
    const newTask = {
        id: nextId++,
        text,
        completed: false,
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

// PUT /api/tasks/:id - Update a task (e.g., toggle completion)
app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { text, completed } = req.body;
    
    const task = tasks.find(t => t.id === parseInt(id));
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    if (text !== undefined) {
        task.text = text;
    }
    if (completed !== undefined) {
        task.completed = completed;
    }

    res.json(task);
});

// DELETE /api/tasks/:id - Delete a task
app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const initialLength = tasks.length;
    tasks = tasks.filter(t => t.id !== parseInt(id));

    if (tasks.length === initialLength) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    res.status(204).send(); // No content to send back
});


// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});