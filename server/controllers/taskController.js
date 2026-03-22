const Task = require("../models/Task");

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching tasks." });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }

    const task = await Task.create({
      title,
      description,
      dueDate: dueDate || null,
      createdBy: req.user._id,
    });

    return res.status(201).json(task);
  } catch (error) {
    return res.status(500).json({ message: "Server error while creating task." });
  }
};

const updateTask = async (req, res) => {
  try {
    const { title, description, dueDate, status } = req.body;
    const task = await Task.findOne({ _id: req.params.id, createdBy: req.user._id });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    task.title = title ?? task.title;
    task.description = description ?? task.description;
    task.dueDate = dueDate !== undefined ? dueDate || null : task.dueDate;
    task.status = status ?? task.status;

    const updatedTask = await task.save();

    return res.status(200).json(updatedTask);
  } catch (error) {
    return res.status(500).json({ message: "Server error while updating task." });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, createdBy: req.user._id });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    await task.deleteOne();

    return res.status(200).json({ message: "Task deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error while deleting task." });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
