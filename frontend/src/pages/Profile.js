import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../src/Profile.css"; // Add this CSS file if you haven't already
import { FaEdit, FaTrash, FaArrowLeft } from "react-icons/fa";

const Profile = () => {
    const [tasks, setTasks] = useState([]);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const [editingTask, setEditingTask] = useState(null);
    const [editedTask, setEditedTask] = useState({ title: "", description: "", budget: "", deadline: "" });

    const if_live = false;
    const API_URL = if_live 
        ? "https://taskhive-d0c8.onrender.com" 
        : "http://localhost:5001";

    function formatDate(isoString) {
        const date = new Date(isoString);
    
        // Formatting the date as "Month Day, Year"
        const readableDate = `${date.toLocaleString('en-US', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}`;
        
        return readableDate;
    }

    const formatDateForInput = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split("T")[0]; // Converts to "yyyy-MM-dd"
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;
        
                const response = await axios.get(`${API_URL}/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
        
                setUser(response.data);
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        };

        fetchProfile();
    }, [API_URL, tasks]);

    const handleDeleteTask = async (taskId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            console.log(taskId)

            await axios.delete(`${API_URL}/api/tasks/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Remove the deleted task from the user data in state
            setUser((prevState) => ({
                ...prevState,
                tasks: prevState.tasks.filter((task) => task._id !== taskId)
            }));

            alert("Task deleted successfully!");
        } catch (error) {
            console.error("Error deleting task:", error);
            alert("Failed to delete task.");
        }
    };

    // Open Edit Modal
    const handleEditClick = (task) => {
        setEditingTask(task);
        setEditedTask({ 
            title: task.title, 
            description: task.description, 
            budget: task.budget, 
            deadline: formatDateForInput(task.deadline)
        });
    };

    // Handle Input Change
    const handleInputChange = (e) => {
        setEditedTask({ ...editedTask, [e.target.name]: e.target.value });
    };

    // Submit Edited Task
    const handleEditSubmit = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.put(`${API_URL}/api/tasks/${editingTask._id}`, editedTask, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Ensure the updated data is coming from the response
            setTasks(prevTasks => prevTasks.map(task => 
                task._id === editingTask._id ? response.data : task
            ));

            setEditingTask(null); // Close the modal after saving
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    const goBack = () => {
        navigate(-1); // Go back to the previous page
    };

    if (!user) return <p>Loading profile...</p>;

    return (
        <div className="profile-container">

            {/* Back Button */}
            <button onClick={goBack} className="back-button">← Back</button>

            {/* Profile Section */}
            <div className="profile-section">
                <img src={user.profilePicture || "/default-avatar.png"} alt="Profile" className="profile-pic" />
                <h2>{user.name || "Davnish Singh"}</h2>
                <p>Email: {user.email || "davnishsingh46@gmail.com"}</p>
                <p><b>Bio:</b> {user.bio || "Davnish is one of the producers of Soorma & Dhadak and producing upcoming movies Jabariya Jodi and Bharat along with Salman Khan Films, Eros International & Dharma Productions. Trailer Editor of Gully Boy, Simmba, SANJU, Dhadak, Soorma and 200+ Bollywood movie trailers. He’s been working in the Film industry since last 7 years and, till now he has worked in Hollywood movies like Fate Of The Furious & Jumanji as its lead Trailer editor with his upcoming films are no less than blockbusters. He is working on a number of Hollwood films like Avengers 4(2019), Red Notice, Jumanji 2, Hobbs & Shaw and Fast & Furious 9(2020) as a Head of Editorial Department with his own production house involved in it."}</p>
                <p>Role: {user.role || "No role assigned"}</p>
                {user.isVerified && <span className="verified-badge">✔ Verified</span>}
            </div>

            {/* Tasks Section */}
            <div className="tasks-section">
                {user.tasks && user.tasks.map((task) => (
                    <div className="task-item" key={task._id}>
                        <h4>{task.title}</h4>

                        <div className="task-actions">
                            <FaEdit className="edit-icon" onClick={() => handleEditClick(task)} />
                            {/* <FaTrash className="delete-icon" onClick={() => handleDeleteTask(task._id)} /> */}
                        </div>

                        <p>{task.description}</p>
                        <p>Budget: ${task.budget}</p>
                        <p>
                            <strong>Deadline:</strong> {formatDate(task.deadline)}
                        </p>
                        {task.category && (
                            <p className="task-category">{task.category}</p>
                        )}

                        <button 
                            className="delete-btn"
                            onClick={() => handleDeleteTask(task._id)}
                        >
                            Delete Task
                        </button>
                    </div>
                ))}
            </div>

            {/* Edit Task Modal */}
            {editingTask && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Edit Task</h2>
                        <label>Title:</label>
                        <input type="text" name="title" value={editedTask.title} onChange={handleInputChange} />

                        <label>Description:</label>
                        <textarea name="description" value={editedTask.description} onChange={handleInputChange} />

                        <label>Deadline:</label>
                        <input type="date" name="deadline" value={editedTask.deadline} onChange={handleInputChange} />

                        <label>Budget:</label>
                        <input type="number" name="budget" value={editedTask.budget} onChange={handleInputChange} />

                        <button className="save-button" onClick={handleEditSubmit}>Save</button>
                        <button className="cancel-button" onClick={() => setEditingTask(null)}>Cancel</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Profile;