import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

// --- NEW dnd-kit Imports ---
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import './App.css';

const API_URL = 'http://localhost:5002/api/tasks';

// --- NEW: SortableTaskItem Component ---
// We create a new component for our sortable item.
function SortableTaskItem({ task, onToggleComplete, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging, // to style the item while dragging
  } = useSortable({
    id: task.id,
    disabled: task.completed, //disables dragging for completed tasks!
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1, // Make it slightly transparent while dragging
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`${task.completed ? 'completed' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="task-item-left" onClick={() => onToggleComplete(task.id, task.completed)}>
        <div className={task.completed ? 'checkbox-icon checked' : 'checkbox-icon'}>
          <span className="material-symbols-outlined">
    {task.completed ? 'check' : 'check_box_outline_blank'}
  </span>
        </div>
        {/* We spread the listeners and attributes onto the element we want to be the "drag handle" */}
        {/* We'll use the whole span as a handle, but only if not completed */}
        <span {...attributes} {...listeners}>
          {task.text}
        </span>
      </div>
      <button onClick={() => onDelete(task.id)} className="delete-btn">
        <span className="material-symbols-outlined">
    delete
  </span>
      </button>
    </li>
  );
}


// --- Main App Component ---
function App() {
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');

  // Setup sensors for pointer (mouse/touch) and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    axios.get(API_URL)
      .then(response => setTasks(response.data))
      .catch(error => console.error('There was an error fetching the tasks!', error));
  }, []);


  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => a.completed - b.completed);
  }, [tasks]);

  // handleDragEnd for dnd-kit
  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTasks((currentTasks) => {
        const oldIndex = currentTasks.findIndex(t => t.id === active.id);
        const newIndex = currentTasks.findIndex(t => t.id === over.id);

        // arrayMove is a handy utility from @dnd-kit/sortable
        return arrayMove(currentTasks, oldIndex, newIndex);
      });
    }
  }

  // ---  handlers ---
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    axios.post(API_URL, { text: newTaskText })
      .then(response => {
        setTasks([response.data, ...tasks]);
        setNewTaskText('');
      })
      .catch(error => console.error('Error adding task!', error));
  };

  const handleToggleComplete = (id, completed) => {
    axios.put(`${API_URL}/${id}`, { completed: !completed })
      .then(response => {
        setTasks(tasks.map(task =>
          task.id === id ? response.data : task
        ));
      })
      .catch(error => console.error('Error updating task!', error));
  };

  const handleDeleteTask = (id) => {
    axios.delete(`${API_URL}/${id}`)
      .then(() => {
        setTasks(tasks.filter(task => task.id !== id));
      })
      .catch(error => console.error('Error deleting task!', error));
  };


  return (
    <div className="app-container">
      <h1>My TO-DO List ✅</h1>
      
      <form onSubmit={handleAddTask} className="add-task-form">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add Task</button>
      </form>

      {/* DndContext wraps everything related to drag and drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <ul className="task-list">
          {/* SortableContext provides the context for the items */}
          <SortableContext
            // We must pass an array of the *current* item IDs in render order
            items={sortedTasks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedTasks.map(task => (
              <SortableTaskItem
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteTask}
              />
            ))}
          </SortableContext>
        </ul>
      </DndContext>
    </div>
  );
}

export default App;