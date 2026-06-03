// frontend/src/App.js
import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    gender: 'Female',
    SeniorCitizen: 0,
    Partner: 'Yes',
    Dependents: 'No',
    tenure: 12,
    PhoneService: 'Yes',
    MultipleLines: 'No',
    InternetService: 'Fiber optic',
    OnlineSecurity: 'No',
    OnlineBackup: 'Yes',
    DeviceProtection: 'No',
    TechSupport: 'No',
    StreamingTV: 'Yes',
    StreamingMovies: 'No',
    Contract: 'Month-to-month',
    PaperlessBilling: 'Yes',
    PaymentMethod: 'Electronic check',
    MonthlyCharges: 85.50,
    TotalCharges: 1026.00
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:5000/predict', formData);
      setResult(response.data);
    } catch (error) {
      console.error('Error fetching prediction', error);
      // Reveal the exact Python error if the backend rejected the data
      if (error.response && error.response.data && error.response.data.error) {
        setResult({ error: `Data Error: ${error.response.data.error}` });
      } else {
        setResult({ error: `Connection Error: Is the Flask server running?` });
      }
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>ChurnVision</h1>
        <p>Customer Retention Analysis System</p>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        {Object.keys(formData).map((key) => (
          <div className="input-group" key={key}>
            <label>{key}</label>
            {key === 'tenure' || key === 'MonthlyCharges' || key === 'TotalCharges' ? (
              <input
                type="number"
                step="any"
                name={key}
                value={formData[key]}
                onChange={handleChange}
                required
              />
            ) : key === 'SeniorCitizen' ? (
              <select name={key} value={formData[key]} onChange={handleChange}>
                <option value={0}>0 (No)</option>
                <option value={1}>1 (Yes)</option>
              </select>
            ) : (
              <input
                type="text"
                name={key}
                value={formData[key]}
                onChange={handleChange}
                required
              />
            )}
          </div>
        ))}
        
        <div className="submit-container">
          <button type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Predict Churn Risk'}
          </button>
        </div>
      </form>

      {result && (
        <div className={`result-card ${result.churn_prediction === 'Yes' || result.churn_prediction === '1' ? 'high-risk' : 'low-risk'}`}>
          {result.error ? (
            <h3>{result.error}</h3>
          ) : (
            <>
              <h2>Prediction: {result.churn_prediction === '1' || result.churn_prediction === 'Yes' ? 'Churn (High Risk)' : 'Retain (Low Risk)'}</h2>
              <p>Risk Probability: {(result.churn_risk_probability * 100).toFixed(2)}%</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;