import axios from 'axios';

// Use environment variable for API URL if available, or default to port 8080
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export const executeCode = async (code, language) => {
  try {
    const response = await axios.post(`${API_URL}/execute`, { code, language });
    return response.data;
  } catch (error) {
    console.error('Error executing code:', error);
    throw new Error(error.response?.data?.message || 'Failed to execute code');
  }
};

export const debugCode = async (code, language) => {
  try {
    const response = await axios.post(`${API_URL}/debug`, { code, language });
    return response.data;
  } catch (error) {
    console.error('Error debugging code:', error);
    throw new Error(error.response?.data?.message || 'Failed to debug code');
  }
};

export const saveCode = async (title, code, language) => {
  try {
    const response = await axios.post(`${API_URL}/code`, { title, code, language });
    return response.data;
  } catch (error) {
    console.error('Error saving code:', error);
    throw new Error(error.response?.data?.message || 'Failed to save code');
  }
};

export const loadCode = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/code/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error loading code:', error);
    throw new Error(error.response?.data?.message || 'Failed to load code');
  }
};

export const listSavedCode = async () => {
  try {
    const response = await axios.get(`${API_URL}/code`);
    return response.data;
  } catch (error) {
    console.error('Error listing saved code:', error);
    throw new Error(error.response?.data?.message || 'Failed to list saved code');
  }
};