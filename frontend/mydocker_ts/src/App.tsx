import './App.css';
import axios from 'axios';
import React, {useEffect, useState} from 'react';
import {useNavigate, Link} from 'react-router-dom'
import Home from './Home';
import Login from './Login';
import Register from './Register';
import {Routes, Route} from 'react-router-dom'


function App() {

  

  return (
    <>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path = "/login" element={<Login />} />
      <Route path = "/register" element={<Register />} />
    </Routes>
    </>
  );
}

export default App;
