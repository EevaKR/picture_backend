import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import React, {useEffect, useState} from 'react';
import data from './testuser.json';

function App() {


  const [Userdata, setUserdata] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3000/api/data')
      .then(response => {
        setUserdata(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the user data!', error);
      });
  }, []); 
  

  return (
    <div className="App">
      <h1>Users</h1>
      {data.users.map((user) => (
        <div key={user.id}>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
