import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/Calendar.css';
import axios from 'axios';

const Calendar = () => {

  const [currentYear, setCurrentYear] = useState(2024);
  const [currentMonth, setCurrentMonth] = useState(11);
  const [wearingHistory, setWearingHistory] = useState([]);
  const [popupData, setPopupData] = useState(null); // State for popup data
  const [isPopupOpen, setIsPopupOpen] = useState(false); // State for popup visibility
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false); // State for add form visibility
  const [isEditing, setIsEditing] = useState(false); // State for edit mode
  const [clothesList, setClothesList] = useState([]); // State for clothes data
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false); // State for delete popup visibility
  const [deleteDate, setDeleteDate] = useState(null); // Selected date for deletion
  const [description, setDescription] = useState(""); // State for the text box

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem('UserId'); // Retrieve UserId
        if (!userId) {
          console.error("UserId is not available in localStorage.");
          return;
        }
  
        // Make both API calls simultaneously
        const [wearingHistoryResponse, clothesResponse] = await Promise.all([
          axios.get(`http://localhost:5050/api/wearingHistory?UserId=${userId}`),
          axios.get(`http://localhost:5050/api/clothes?UserId=${userId}`)
        ]);
  
        // Process wearing history data
        console.log('History');
        console.log(wearingHistoryResponse.data);
        const wearingHistoryData = wearingHistoryResponse.data.map((item) => ({
          ...item,
          Date: new Date(item.Date),
        }));
        setWearingHistory(wearingHistoryData);
  
        // Process clothes data
        setClothesList(clothesResponse.data); // Store the retrieved clothes data
        console.log(clothesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchData();
  }, []);

  

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    // Create the date for the current day in the calendar
    const date = new Date(currentYear, currentMonth, i);
  
    // Find the matching entry in wearingHistory by comparing day, month, and year
    const history = wearingHistory.find((entry) => {
      const entryDate = new Date(entry.Date);
      entryDate.setDate(entryDate.getDate() + 1);
  
      return (
        entryDate.getFullYear() === date.getFullYear() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getDate() === date.getDate()
      );
    });
  
    calendarDays.push({
      date,
      history,
    });
  }
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const currentMonthName = monthNames[currentMonth];

  // Open popup
  const openPopup = (history) => {
    setPopupData(history);
    setIsPopupOpen(true);
  };

  // Close popup
  const closePopup = () => {
    setIsPopupOpen(false);
    setPopupData(null);
    setIsEditing(false);
  };

  // Open add popup
  const openAddPopup = () => {
    setIsAddPopupOpen(true);
  };

  // Close add popup
  const closeAddPopup = () => {
    setIsAddPopupOpen(false);
  };

  const openEditPopup = () => {
    setIsEditing(true);
  };


  const handleSubmitWearingHistory = async (event) => {
    event.preventDefault();
    const userId = localStorage.getItem('UserId');
    if (!userId) {
      console.error('UserId is not available in localStorage.');
      alert('Unable to add wearing history. UserId is missing.');
      return;
    }
  
    const formData = new FormData(event.target);
    formData.append('UserId', userId); // Add UserId to the form data

    const keysToRemove = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('Cloth') && (!value || value.trim() === '')) {
        keysToRemove.push(key);
      }
    }

    // Remove keys marked for removal
    keysToRemove.forEach((key) => formData.delete(key));
  
    try {
      const response = await axios.post('http://localhost:5050/api/wearingHistory', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      // Check if response is OK
      // console.log(response);
      if (response.data && response.data.error) {
        console.error('Error in response data:', response.data.error);
        alert(`Failed to add wearing history: ${response.data.error}`);
        return;
      }
  
      alert('Wearing history added successfully!');
      setIsAddPopupOpen(false);
  
      // Refresh wearing history
      const updatedResponse = await axios.get('http://localhost:5050/api/wearingHistory', {
        params: { UserId: userId },
      });
  
      // Check if updatedResponse is OK
      if (updatedResponse.status !== 200) {
        console.error('Error: Failed to refresh wearing history', updatedResponse.status);
        alert(`Failed to refresh wearing history. Server responded with status: ${updatedResponse.status}`);
        return;
      }
  
      setWearingHistory(
        updatedResponse.data.map((item) => ({
          ...item,
          Date: new Date(item.Date),
        }))
      );
    } catch (error) {
      console.error('Error adding wearing history:', error);
      alert('Failed to add wearing history. Please try again.');
    }
  };

  const handleSubmitUpdate = async (event) => {
    event.preventDefault();
    const userId = localStorage.getItem('UserId');
    if (!userId) {
      console.error('UserId is not available in localStorage.');
      alert('Unable to update wearing history. UserId is missing.');
      return;
    }

    const formData = new FormData(event.target);
    formData.append('UserId', userId);
    formData.append('Date', popupData.Date.toISOString().split('T')[0]); // Pre-fill Date

    // console.log("FormData content:");
    // for (const [key, value] of formData.entries()) {
    //   console.log(`${key}: ${value}`);
    // }

    const keysToRemove = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('Cloth') && (!value || value.trim() === '')) {
        keysToRemove.push(key);
      }
    }

    // Remove keys marked for removal
    keysToRemove.forEach((key) => formData.delete(key));

    try {
      const response = await axios.put('http://localhost:5050/api/wearingHistory', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      // Check if response is OK
      // console.log(response);
      if (response.data && response.data.error) {
        console.error('Error in response data:', response.data.error);
        alert(`Failed to update wearing history: ${response.data.error}`);
        return;
      }

      alert('Wearing history updated successfully!');
      setIsEditing(false); // Exit edit mode
      closePopup(); // Close popup
      // Refresh wearing history
      const updatedResponse = await axios.get('http://localhost:5050/api/wearingHistory', {
        params: { UserId: userId },
      });
      const updatedData = updatedResponse.data.map((item) => ({
        ...item,
        Date: new Date(item.Date),
      }));
      setWearingHistory(updatedData);
    } catch (error) {
      console.error('Error updating wearing history:', error);
      alert('Failed to update wearing history.');
    }
  };
  

  const handleLogout = () => {
    navigate('/');
  };

  const handleDeleteHistory = async () => {
    const userId = localStorage.getItem('UserId');
    if (!userId) {
      console.error('UserId is not available in localStorage.');
      alert('Unable to delete history. UserId is missing.');
      return;
    }

    const formData = new FormData();
    formData.append('UserId', userId);
    formData.append('Date', deleteDate.toISOString().split('T')[0]); 
    
    const dateExists = wearingHistory.some(history => 
      history.Date.toISOString().split('T')[0] === deleteDate.toISOString().split('T')[0]
    );

    if (!dateExists) {
        // console.error('The specified date does not exist in wearingHistory.');
        alert('Unable to delete history. The specified date does not exist.');
        return;
    }

    try {

      const response = await axios.delete('http://localhost:5050/api/wearingHistory', {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        data: formData, // Use `data` to send the payload with DELETE
      });

      console.log(response.data);
      if (response.data && response.data.error) {
        console.error('Error in response data:', response.data.error);
        alert(`Failed to delete wearing history: ${response.data.error}`);
        return;
      }

      alert('Wearing history deleted successfully!');
      setIsDeletePopupOpen(false); // Close delete popup

      // Refresh wearing history
      const updatedResponse = await axios.get('http://localhost:5050/api/wearingHistory', {
        params: { UserId: userId },
      });
      const updatedData = updatedResponse.data.map((item) => ({
        ...item,
        Date: new Date(item.Date),
      }));
      setWearingHistory(updatedData);
    } catch (error) {
      console.error('Error deleting wearing history:', error);
      alert('Failed to delete wearing history.');
    }
  };

  const openDeletePopup = () => {
    setIsDeletePopupOpen(true);
  };

  const closeDeletePopup = () => {
    setIsDeletePopupOpen(false);
    setDeleteDate(null);
  };

  const handleDateChange = (event) => {
    setDeleteDate(new Date(event.target.value));
  };


  const handlePostOutfit = async () => {
    const userId = localStorage.getItem("UserId");
    if (!userId) {
      alert("UserId is not available in localStorage.");
      return;
    }


    const formData = new FormData();
    formData.append('UserId', userId);

    // Get the current date in YYYY-MM-DD format
    const currentDate = new Date().toLocaleDateString('en-CA');
    formData.append('Date', currentDate);
    formData.append('Description', description);

    // console.log(currentDate);


  
    try {
      const response = await axios.post(
        "http://localhost:5050/api/post", formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log(response.data);
  
      if (response.data.error) {
        alert(`Error: ${response.data.error}`);
      } else {
        alert("Today's outfit has been successfully posted!");
      }
    } catch (error) {
      console.error("Error posting outfit:", error);
      alert("Failed to post today's outfit. Please try again.");
    }
  };



  return (
    <div className="closet-container">

      <div className="calendar-header">
         <textarea
            placeholder="Add a description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ resize: "none", width: "200px", height: "30px" }}
          />
       
      
        <button className="post-outfit-button" onClick={handlePostOutfit}>
          Post My Today Outfit
        </button>
        <button className="nav-button" onClick={handlePrevMonth}>◀</button>
        <h2>{currentMonthName} {currentYear}</h2>
        <button className="nav-button" onClick={handleNextMonth}>▶</button>
        <button className="add-button" onClick={openAddPopup}>Add History</button>
        <button className="add-button" onClick={openDeletePopup}>Delete History</button>
      </div>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="calendar-day-name">{day}</div>
        ))}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`calendar-day ${day?.history ? '' : 'placeholder'}`}
            onClick={() => day?.history && openPopup(day.history)}
          >
            {day && (
              <>
                <span className="date">{day.date.getDate()}</span>
                {day.history && (
                  <div className="clothes-container">
                    {[1, 2, 3, 4, 5].map((num) => {
                      const imageKey = `Cloth${num}Image`;
                      const nameKey = `Cloth${num}Name`;
                      return (
                        day.history[imageKey] && (
                          <img
                            key={num}
                            src={day.history[imageKey]}
                            alt={day.history[nameKey]}
                            title={day.history[nameKey]}
                            className="clothing-item"
                          />
                        )
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {isAddPopupOpen && (
        <div className="popup-overlay" onClick={closeAddPopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Wearing History</h3>
            <form onSubmit={handleSubmitWearingHistory}>
              <input type="date" name="Date" required />

              {/* Dropdowns for selecting clothes */}
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num}>
                  <label htmlFor={`Cloth${num}`}>Cloth {num}:</label>
                  <select name={`Cloth${num}`} id={`Cloth${num}`}>
                    <option value="">None</option>
                    {clothesList.map((cloth) => (
                      <option key={cloth.ClothId} value={cloth.ClothId}>
                        {cloth.ClothName}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <button type="submit" className="edit-button">Submit</button>
            </form>
            <button onClick={closeAddPopup} className="edit-button">Close</button>
          </div>
        </div>
      )}

      {/* View History Popup */}
      {isPopupOpen && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>{isEditing ? "Edit Wearing History" : "Worn Clothes"}</h3>
            {popupData && isEditing ? (
              <form onSubmit={handleSubmitUpdate}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num}>
                    <label htmlFor={`Cloth${num}`}>Cloth {num}:</label>
                    <select
                      name={`Cloth${num}`}
                      id={`Cloth${num}`}
                      defaultValue={popupData[`Cloth${num}Id`] || ""}
                    >
                      <option value="">None</option>
                      {clothesList.map((cloth) => (
                        <option key={cloth.ClothId} value={cloth.ClothId}>
                          {cloth.ClothName}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                <button type="submit">Save</button>
              </form>
            ) : (
              <ul>
                {[1, 2, 3, 4, 5].map((num, index) => {
                  const nameKey = `Cloth${num}Name`;
                  return popupData[nameKey] ? (
                    <li key={index}>
                      <strong>#{index + 1}</strong>: {popupData[nameKey]}
                    </li>
                  ) : null;
                })}
              </ul>
            )}
            {!isEditing && (
              <button onClick={openEditPopup} className="edit-button">Edit</button>
            )}
            <button onClick={closePopup} className="edit-button">Close</button>
          </div>
        </div>
      )}

      {isDeletePopupOpen && (
        <div className="popup-overlay" onClick={closeDeletePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Wearing History</h3>
            <p>Select a date to delete:</p>
            <input type="date" onChange={handleDateChange} />
            <button
              onClick={handleDeleteHistory}
              disabled={!deleteDate}
              className="edit-button"
            >
              Confirm Delete
            </button>
            <button onClick={closeDeletePopup} className="edit-button">Cancel</button>
          </div>
        </div>
      )}

      <button className="logout-button" onClick={handleLogout}>Log Out</button>

    </div>
  );
};

export default Calendar;
