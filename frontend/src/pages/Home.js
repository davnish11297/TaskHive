import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import '../../src/Home.css';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null); 
    const [bids, setBids] = useState([]);
    const [error, setError] = useState(null);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        budget: '',
        deadline: '',
        status: 'PENDING',
        category: '',
        tags: '',
        postedBy: ''
    });
    const [loading, setLoading] = useState(true);
    const [taskBids, setTaskBids] = useState({}); // Object to store bids for each task
    const [userToken] = useState(localStorage.getItem('token'));
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredTasks, setFilteredTasks] = useState(tasks);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [user, setUser] = useState('');

    const if_live = true;
    const API_URL = if_live 
        ? "https://taskhive-d0c8.onrender.com" 
        : "http://localhost:5001";

    useEffect(() => {
        if (userToken) {
            const decodedToken = jwtDecode(userToken); // Decode the JWT token
            console.log(decodedToken)
            setUserRole(decodedToken.role);  // Assuming role is in the decoded token payload
            setUser(decodedToken.name)
        }
    }, [userToken]);

    const fetchTasks = useCallback(async () => {
        try {
            const query = [];
            if (categoryFilter) query.push(`category=${categoryFilter}`);
            if (tagFilter) query.push(`tag=${tagFilter}`);

            const response = await axios.get(`${API_URL}/api/tasks?${query.join('&')}`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });

            const fetchedTasks = response.data.tasks;

            setTasks(fetchedTasks);
            setFilteredTasks(fetchedTasks);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setLoading(false);
        }
    }, [userToken, categoryFilter, tagFilter]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleCategoryFilterChange = (e) => {
        setCategoryFilter(e.target.value);
        fetchTasks(e.target.value, tagFilter);
    };
    
    const handleTagFilterChange = (e) => {
        setTagFilter(e.target.value);
        fetchTasks(categoryFilter, e.target.value);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'tags') {
            setNewTask((prevTask) => ({
                ...prevTask,
                [name]: value.split(',').map((tag) => tag.trim()) // Split into an array of tags
            }));
        } else {
            setNewTask((prevTask) => ({
                ...prevTask,
                [name]: value
            }));
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!newTask.title.trim() || !newTask.description.trim() || !newTask.deadline || !newTask.category) {
            alert('Please fill in all required fields.');
            return;
        }

        console.log(user)

        try {
            await axios.post(`${API_URL}/api/tasks`, newTask, {
                headers: { Authorization: `Bearer ${userToken}` },
            });

            setNewTask({ 
                title: '', 
                description: '', 
                budget: '', 
                deadline: '', 
                status: 'PENDING', 
                category: '', 
                tags: '', 
                postedBy: user });

            fetchTasks();
        } catch (err) {
            console.error('Error creating task:', err);
            alert('Error creating task. Please check all fields.');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await axios.patch(
                `${API_URL}/api/tasks/${taskId}/status`,
                { status: newStatus.toUpperCase() },
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setTasks((prevTasks) =>
                prevTasks.map((task) =>
                    task._id === taskId ? { ...task, status: newStatus.toUpperCase() } : task
                )
            );
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleAcceptBid = async (taskId, bidId) => {
        try {
            await axios.patch(
                `${API_URL}/api/tasks/accept/${bidId}`,
                { bidId },
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            await handleStatusChange(taskId, 'IN_PROGRESS');
            handleCloseModal(); 
        } catch (error) {
            console.error('Error accepting bid:', error);
            const errorMessage = error.response ? error.response.data.message : error.message;
            setError(errorMessage);
        }
    };

    const token = localStorage.getItem('token');
    const handleBid = async (taskId, bidAmount, estimatedCompletion, message) => {
        try {
            const response = await axios.post(
                `${API_URL}/api/tasks/${taskId}/bid`,
                { bidAmount, estimatedCompletion, message },
                { headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json' } }
            );

            // After placing the bid, change the task status to "In Progress"
            await handleStatusChange(taskId, 'IN_PROGRESS');  // Update the task status
            
            // Update task with the new highest bid
            fetchTasks();
        } catch (error) {
            console.error('Error placing bid:', error);
        }
    };

    const handleBidChange = (taskId, e) => {
        const { value } = e.target;
        setTaskBids((prevBids) => ({
            ...prevBids,
            [taskId]: { ...prevBids[taskId], bidAmount: value }, // Store bid value for specific task
        }));
    };

    const handleEstimatedCompletionChange = (taskId, e) => {
        const { value } = e.target;
        setTaskBids((prevBids) => ({
            ...prevBids,
            [taskId]: { ...prevBids[taskId], estimatedCompletion: value }, // Store estimated completion for specific task
        }));
    };

    const handleMessageChange = (taskId, e) => {
        const { value } = e.target;
        setTaskBids((prevBids) => ({
            ...prevBids,
            [taskId]: { ...prevBids[taskId], message: value }, // Store message for specific task
        }));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUserRole(null);
        navigate('/login');
    };

    const taskStatusGroups = filteredTasks.reduce((acc, task) => {
        if (!acc[task.status]) {
            acc[task.status] = [];
        }
        acc[task.status].push(task);
        return acc;
    }, { PENDING: [], IN_PROGRESS: [], COMPLETED: [] });

    function formatDate(isoString) {
        const date = new Date(isoString);
    
        // Formatting the date as "Month Day, Year"
        const readableDate = `${date.toLocaleString('en-US', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}`;
        
        return readableDate;
    }

    // ✅ Fetch Bids When Task is Clicked
    const handleTaskClick = async (task) => {
        setSelectedTask(task);
        try {
            const response = await axios.get(`${API_URL}/api/tasks/${task._id}/bids`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            console.log(response.data)
            setBids(response.data); // Set fetched bids
        } catch (error) {
            console.error('Error fetching bids:', error);
            setBids([]); // Clear bids if error occurs
        }
    };

    const handleCloseModal = () => {
        setSelectedTask(null);
        setBids([]); // Clear bids when closing modal
    };

    const handleRejectBid = async (taskId, bidId) => {
        try {
            // Make an API call to reject the bid
            const response = await axios.patch(
                `${API_URL}/api/tasks/reject/${bidId}`,
                {}, // No body needed, assuming you only need the bid ID for rejection
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                    }
                }
            );
            
            // Handle the response (you can update state or show a message)
            console.log('Bid rejected:', response.data);
            
            // Update the task status or any other UI updates if necessary
        } catch (error) {
            console.error('Error rejecting the bid:', error.response ? error.response.data : error.message);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            // Filter logic runs after 300ms delay
            setFilteredTasks(tasks.filter(task => 
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description.toLowerCase().includes(searchQuery.toLowerCase())
            ));
        }, 300);  // Delay in milliseconds
    
        return () => clearTimeout(delayDebounce);
    }, [searchQuery, tasks]);

    return (
        <div className="home-container">
            {/* Left Side: Form */}
            <div className="task-form-container">
                <center>
                    <h1>TaskHive 🐝</h1>
                    <h2>Create Task</h2>
                </center>
                <form onSubmit={handleCreateTask} className="task-form">
                    <input
                        type="text"
                        name="title"
                        value={newTask.title}
                        onChange={handleChange}
                        placeholder="Task Title"
                        required
                    />
                    <textarea
                        name="description"
                        value={newTask.description}
                        onChange={handleChange}
                        placeholder="Task Description"
                        required
                    />
                    <input
                        type="number"
                        name="budget"
                        value={newTask.budget}
                        onChange={handleChange}
                        placeholder="Budget"
                    />
                    <input
                        type="date"
                        name="deadline"
                        value={newTask.deadline}
                        onChange={handleChange}
                        required
                    />
                    <select name="task_status" className="status-dropdown" required>
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                    </select>

                    <select className="category-dropdown"
                        value={newTask.category || ''} 
                        onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    >
                        <option value="">Select a category</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Graphic Design">Graphic Design</option>
                        <option value="Writing">Writing</option>
                    </select>
                    
                    <input
                        type="text"
                        name="tags"
                        value={newTask.tags}
                        onChange={handleChange}
                        placeholder="Comma separated tags"
                    />
                    <button type="submit" className="add-task-btn">
                        Add Task
                    </button>
                </form>
            </div>

            <div>
                <nav className="navbar">
                    <p className='navHomeRoleTitle'>Current Role: {userRole === 'task_poster' ? 'Task Poster' : 'Freelancer'}</p>

                    <input 
                        type="text" 
                        placeholder="Search tasks..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="search-bar"
                    />

                    <input
                        type="text"
                        value={categoryFilter}
                        onChange={handleCategoryFilterChange}
                        placeholder="Filter by Category"
                        className='category-filter'
                    />
                    <input
                        type="text"
                        value={tagFilter}
                        onChange={handleTagFilterChange}
                        placeholder="Filter by Tags"
                        className='tag-filter'
                    />

                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </nav>
            </div>

            {/* Right Side: Task Listings */}
            <div className="task-list-container">
                {loading ? (
                   <div className="loading-spinner"></div>
                ) : filteredTasks.length === 0 ? (
                    <p>No tasks found. Create your first task!</p>
                ) : (
                    <>
                        {/* Pending Tasks */}
                        <div className="status-section">
                            <h3>Pending</h3>
                            <hr />
                            <div className="task-row">
                                {taskStatusGroups.PENDING.map((task) => (
                                    <div key={task._id} className="task-item" onClick={() => handleTaskClick(task)}>
                                        <div className="task-item-header">{task.title}</div>
                                        <div className="task-item-content">
                                            <p>{task.description}</p>
                                            <p>
                                                <strong>Budget:</strong> ${task.budget}
                                            </p>
                                            <p>
                                                <strong>Deadline:</strong> {formatDate(task.deadline)}
                                            </p>
                                            {userRole === 'freelancer' ? (
                                                <>
                                                    {/* Bidding Section */}
                                                    <div className="bid-section">
                                                        <input
                                                            type="number"
                                                            placeholder="Place your bid"
                                                            min="1"
                                                            value={taskBids[task._id]?.bidAmount || ''} // Get bid value for this specific task
                                                            onChange={(e) => handleBidChange(task._id, e)} // Update bid for this task
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <input
                                                            type="date"
                                                            placeholder="Estimated Completion"
                                                            value={taskBids[task._id]?.estimatedCompletion || ''} // Get estimated completion for this specific task
                                                            onChange={(e) => handleEstimatedCompletionChange(task._id, e)} // Update estimated completion for this task
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <textarea
                                                            placeholder="Message"
                                                            value={taskBids[task._id]?.message || ''} // Get message for this specific task
                                                            onChange={(e) => handleMessageChange(task._id, e)} // Update message for this task
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <button
                                                            className="bid-btn"
                                                            onClick={() => handleBid(task._id, taskBids[task._id]?.bidAmount || '', taskBids[task._id]?.estimatedCompletion || '', taskBids[task._id]?.message || '')}
                                                        >
                                                            Place Bid
                                                        </button>
                                                    </div>
                                                </>
                                            ) : <div></div>}
                                        </div>
                                        <div className="task-status">
                                            <select
                                                className="status-dropdown"
                                                value={task.status}
                                                onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="PENDING">Pending</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="COMPLETED">Completed</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* In Progress Tasks */}
                        <div className="status-section">
                            <h3>In Progress</h3>
                            <hr />
                            <div className="task-row">
                                {taskStatusGroups.IN_PROGRESS.map((task) => (
                                    <div key={task._id} className="task-item" onClick={() => handleTaskClick(task)}>
                                        <div className="task-item-header">{task.title}</div>
                                        <div className="task-item-content">
                                            <p>{task.description}</p>
                                            <p>
                                                <strong>Budget:</strong> ${task.budget}
                                            </p>
                                            <p>
                                                <strong>Deadline:</strong> {formatDate(task.deadline)}
                                            </p>
                                        </div>
                                        <div className="task-status">
                                            <select
                                                className="status-dropdown"
                                                value={task.status}
                                                onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="PENDING">Pending</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="COMPLETED">Completed</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Completed Tasks */}
                        <div className="status-section">
                            <h3>Completed</h3>
                            <hr />
                            <div className="task-row">
                                {taskStatusGroups.COMPLETED.map((task) => (
                                    <div key={task._id} className="task-item" onClick={() => handleTaskClick(task)}>
                                        <div className="task-item-header">{task.title}</div>
                                        <div className="task-item-content">
                                            <p>{task.description}</p>
                                            <p>
                                                <strong>Budget:</strong> ${task.budget}
                                            </p>
                                            <p>
                                                <strong>Deadline:</strong> {formatDate(task.deadline)}
                                            </p>
                                        </div>
                                        <div className="task-status">
                                            <select
                                                className="status-dropdown"
                                                value={task.status}
                                                onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="PENDING">Pending</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="COMPLETED">Completed</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* ✅ Modal for Task Details and Bids */}
                            {selectedTask && (
                                <div className="modal-overlay" onClick={handleCloseModal}>
                                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                        <button className="close-btn" onClick={handleCloseModal}>X</button>
                                        <h2>{selectedTask.title}</h2>
                                        <p>{selectedTask.description}</p>
                                        <p><strong>Budget:</strong> ${selectedTask.budget}</p>
                                        <p><strong>Deadline:</strong> {formatDate(selectedTask.deadline)}</p>

                                        <center><h3>Bids</h3></center>

                                        {/* Error message */}
                                        {error && <div className="error-message">{error}</div>}

                                        <hr></hr>
                                        {(bids && bids.length > 0) ? (
                                            bids.map((bid) => (
                                                <div key={bid._id} className="bid-card">

                                                    <p><strong>Bid Amount:</strong> ${bid.bidAmount}</p>
                                                    <p><strong>Bidder:</strong> {bid.bidder.name}</p>
                                                    <p><strong>Estimated Completion:</strong> {formatDate(bid.estimatedCompletion)}</p>
                                                    <p><strong>Message:</strong> {bid.message}</p>

                                                    {/* Display the bid status */}
                                                    <p style={{ 
                                                        color: bid.status === 'ACCEPTED' ? 'green' 
                                                            : bid.status === 'REJECTED' ? 'red' 
                                                            : 'orange',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        Status: {bid.status}
                                                    </p>

                                                    {userRole === 'task_poster' && selectedTask.assignedTo === null && (
                                                        <>
                                                        {console.log(userRole, selectedTask.assignedTo, selectedTask.status)}
                                                            {selectedTask.status === 'PENDING' || selectedTask.status === 'IN_PROGRESS' ? (
                                                                <>
                                                                    <button className="accept-btn" onClick={() => handleAcceptBid(selectedTask._id, bid._id)}>Accept</button>
                                                                    <button className="reject-btn" onClick={() => handleRejectBid(selectedTask._id, bid._id)}>Reject</button>
                                                                </>
                                                            ) : bid.status === 'ACCEPTED' && selectedTask.status === 'IN_PROGRESS' ? (
                                                                <button disabled className="accept-btn">Accepted</button>
                                                            ) : (
                                                                <button disabled className="rejected-btn">Rejected</button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p>No bids yet.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Home;