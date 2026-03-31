const Task = require("../models/Task");

const getTasks = async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { createdBy: req.user._id };
    const tasks = await Task.find(query)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });
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
    const taskQuery =
      req.user.role === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, createdBy: req.user._id };
    const task = await Task.findOne(taskQuery);

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    const isTaskOwner = task.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (isAdmin && !isTaskOwner) {
      const isTryingToEditTaskContent =
        title !== undefined || description !== undefined || dueDate !== undefined;

      if (isTryingToEditTaskContent) {
        return res.status(403).json({
          message: "Admins can only change status for tasks created by other users.",
        });
      }
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
    const taskQuery =
      req.user.role === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, createdBy: req.user._id };
    const task = await Task.findOne(taskQuery);

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
