import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { AppBar, Toolbar, IconButton, Typography, Button, Modal, TextField, Menu, MenuItem } from '@material-ui/core';
import { MoreVert as MoreVertIcon } from '@material-ui/icons';
import { v4 as uuidv4 } from 'uuid';

const initialData = {
  columns: {
    todo: {
      id: 'todo',
      title: 'TODO',
      taskIds: [],
    },
    inProgress: {
      id: 'inProgress',
      title: 'In Progress',
      taskIds: [],
    },
    completed: {
      id: 'completed',
      title: 'Completed',
      taskIds: [],
    },
  },
  tasks: {},
};

const App = () => {
  const [data, setData] = useState(initialData);
  const [open, setOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const handleOpen = (status) => {
    setOpen(true);
    setSelectedStatus(status);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStatus('');
    setNewTaskName('');
    setNewTaskDescription('');
    setEditMode(false); // Reset edit mode
  };

  const handleAddOrUpdateTask = () => {
    if (editMode) {
      const updatedTask = {
        ...data.tasks[selectedTask],
        content: newTaskName,
        description: newTaskDescription,
      };

      const updatedTasks = { ...data.tasks, [selectedTask]: updatedTask };
      setData({ ...data, tasks: updatedTasks });
    } else {
      const taskId = uuidv4();
      const newTask = {
        id: taskId,
        content: newTaskName || 'New Task',
        description: newTaskDescription || 'Add a description',
      };

      const updatedTasks = { ...data.tasks, [taskId]: newTask };
      const updatedColumns = {
        ...data.columns,
        [selectedStatus]: {
          ...data.columns[selectedStatus],
          taskIds: [...data.columns[selectedStatus].taskIds, taskId],
        },
      };

      setData({ ...data, tasks: updatedTasks, columns: updatedColumns });
    }

    handleClose();
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...start,
        taskIds: newTaskIds,
      };

      const newState = {
        ...data,
        columns: {
          ...data.columns,
          [newColumn.id]: newColumn,
        },
      };

      setData(newState);
      return;
    }

    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = {
      ...start,
      taskIds: startTaskIds,
    };

    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = {
      ...finish,
      taskIds: finishTaskIds,
    };

    const newState = {
      ...data,
      columns: {
        ...data.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    };

    setData(newState);
  };

  const handleMenuClick = (event, taskId) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(taskId);
  };

  const handleEditTask = (taskId) => {
    const task = data.tasks[taskId];
    setNewTaskName(task.content);
    setNewTaskDescription(task.description);
    setSelectedTask(taskId);
    setOpen(true);
    setEditMode(true); // Set edit mode
  };

  const handleDeleteTask = (taskId) => {
    const updatedTasks = { ...data.tasks };
    delete updatedTasks[taskId];

    const updatedColumns = Object.keys(data.columns).reduce((acc, columnId) => {
      acc[columnId] = {
        ...data.columns[columnId],
        taskIds: data.columns[columnId].taskIds.filter((id) => id !== taskId),
      };
      return acc;
    }, {});

    setData({ tasks: updatedTasks, columns: updatedColumns });
    handleCloseMenu();
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">MYTASKS</Typography>
          <div style={{ flexGrow: 1 }} />
          <IconButton edge="end" color="inherit" aria-label="menu">
            <MoreVertIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '20px' }}>
          {Object.values(data.columns).map((column) => (
            <div key={column.id} style={{ flex: 1, border: '1px solid #ccc', borderRadius: '5px', padding: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3>{column.title}</h3>
                <Typography variant="body2" color="textSecondary">
                  {column.taskIds.length} cards
                </Typography>
              </div>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: '200px' }}>
                    {column.taskIds.map((taskId, index) => {
                      const task = data.tasks[taskId];
                      return (
                        <Draggable key={taskId} draggableId={taskId} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                userSelect: 'none',
                                padding: '8px',
                                margin: '8px 0',
                                backgroundColor: 'lightgrey',
                                borderRadius: '5px',
                                position: 'relative',
                                ...provided.draggableProps.style,
                              }}
                            >
                              <div>{task.content}</div>
                              <div>{task.description}</div>
                              <IconButton
                                aria-label="more"
                                aria-controls={`task-menu-${taskId}`}
                                aria-haspopup="true"
                                onClick={(event) => handleMenuClick(event, taskId)}
                                style={{ position: 'absolute', top: '5px', right: '5px' }}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <Button variant="contained" color="primary" onClick={() => handleOpen(column.id)}>Add Task</Button>
            </div>
          ))}
        </div>
      </DragDropContext>

      <Menu
        id="task-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleEditTask(selectedTask)}>Edit</MenuItem>
        <MenuItem onClick={() => handleDeleteTask(selectedTask)}>Delete</MenuItem>
      </Menu>

      <Modal open={open} onClose={handleClose}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#fff', padding: '20px', borderRadius: '5px' }}>
          <Typography variant="h6">{editMode ? 'Edit Task' : 'Add New Task'}</Typography>
          <TextField
            label="Task Name"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Task Description"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button variant="contained" color="primary" onClick={handleAddOrUpdateTask}>{editMode ? 'Update' : 'Add'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default App;
