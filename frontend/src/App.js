import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const ProgressRing = ({ radius, stroke, progress, isHighRisk }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const ringColor = isHighRisk ? '#e50914' : '#2ecc71';

  return (
    <div className="ring-container">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="rgba(255,255,255,0.1)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={ringColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 1.5s ease-out' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          transform={`rotate(-90 ${radius} ${radius})`}
        />
      </svg>
      <div className="ring-text" style={{ color: ringColor }}>
        {animatedProgress.toFixed(1)}%
      </div>
    </div>
  );
};

function App() {
  const fieldConfig = {
    gender: { type: 'select', options: ['Female', 'Male'] },
    SeniorCitizen: { type: 'select', options: [{label: '0 (No)', value: 0}, {label: '1 (Yes)', value: 1}] },
    Partner: { type: 'select', options: ['No', 'Yes'] },
    Dependents: { type: 'select', options: ['No', 'Yes'] },
    tenure: { type: 'number', min: 0, max: 72, step: 1, helper: 'Range: 0 - 72 months' },
    PhoneService: { type: 'select', options: ['No', 'Yes'] },
    MultipleLines: { type: 'select', options: ['No', 'No phone service', 'Yes'] },
    InternetService: { type: 'select', options: ['DSL', 'Fiber optic', 'No'] },
    OnlineSecurity: { type: 'select', options: ['No', 'No internet service', 'Yes'] },
    OnlineBackup: { type: 'select', options: ['No', 'No internet service', 'Yes'] },
    DeviceProtection: { type: 'select', options: ['No', 'No internet service', 'Yes'] },
    TechSupport: { type: 'select', options: ['No', 'No internet service', 'Yes'] },
    StreamingTV: { type: 'select', options: ['No', 'No internet service', 'Yes'] },
    StreamingMovies: { type: 'select', options: ['No', 'No internet service', 'Yes'] },
    Contract: { type: 'select', options: ['Month-to-month', 'One year', 'Two year'] },
    PaperlessBilling: { type: 'select', options: ['No', 'Yes'] },
    PaymentMethod: { type: 'select', options: ['Bank transfer (automatic)', 'Credit card (automatic)', 'Electronic check', 'Mailed check'] },
    MonthlyCharges: { type: 'number', min: 18.0, max: 120.0, step: 0.01, helper: 'Range: $18.00 - $120.00' },
    // TotalCharges is now strictly marked as readOnly
    TotalCharges: { type: 'number', min: 0.0, max: 9000.0, step: 0.01, helper: 'Auto-calculated (Tenure × Monthly)', readOnly: true }
  };

  const [formData, setFormData] = useState({
    gender: 'Female', SeniorCitizen: 0, Partner: 'Yes', Dependents: 'No', tenure: 12,
    PhoneService: 'Yes', MultipleLines: 'No', InternetService: 'Fiber optic',
    OnlineSecurity: 'No', OnlineBackup: 'Yes', DeviceProtection: 'No', TechSupport: 'No',
    StreamingTV: 'Yes', StreamingMovies: 'No', Contract: 'Month-to-month',
    PaperlessBilling: 'Yes', PaymentMethod: 'Electronic check', MonthlyCharges: 85.50,
    TotalCharges: 1026.00
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Use prevData to perfectly sync the auto-calculation
    setFormData((prevData) => {
      const newData = { ...prevData, [name]: value };
      
      // If the user changes tenure or MonthlyCharges, instantly update TotalCharges
      if (name === 'tenure' || name === 'MonthlyCharges') {
        const t = name === 'tenure' ? (parseFloat(value) || 0) : parseFloat(prevData.tenure);
        const m = name === 'MonthlyCharges' ? (parseFloat(value) || 0) : parseFloat(prevData.MonthlyCharges);
        newData.TotalCharges = parseFloat((t * m).toFixed(2));
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null); 
    try {
      const response = await axios.post(' https://churn-backend-nb7j.onrender.com', formData);
      setResult(response.data);
    } catch (error) {
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

      <div className="main-content">
        <div className="form-section">
          <form onSubmit={handleSubmit} className="form-grid">
            {Object.keys(fieldConfig).map((key) => {
              const config = fieldConfig[key];
              return (
                <div className="input-group" key={key}>
                  <label>{key}</label>
                  {config.type === 'select' ? (
                    <select name={key} value={formData[key]} onChange={handleChange}>
                      {config.options.map((opt, idx) => (
                        <option key={idx} value={typeof opt === 'object' ? opt.value : opt}>
                          {typeof opt === 'object' ? opt.label : opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="number" 
                      name={key} 
                      value={formData[key]} 
                      onChange={handleChange} 
                      min={config.min} 
                      max={config.max} 
                      step={config.step}
                      readOnly={config.readOnly}
                      className={config.readOnly ? 'readonly-input' : ''}
                      required={!config.readOnly} 
                    />
                  )}
                  {config.helper && (
                    <span className={`helper-text ${config.readOnly ? 'highlight-helper' : ''}`}>
                      {config.helper}
                    </span>
                  )}
                </div>
              );
            })}
            <div className="submit-container">
              <button type="submit" disabled={loading}>
                {loading ? 'Analyzing...' : 'Predict Churn Risk'}
              </button>
            </div>
          </form>
        </div>

        <div className="dashboard-section">
          {!result && !loading && (
            <div className="empty-state">
              <h3>Awaiting Analysis</h3>
              <p>Enter customer parameters and press Predict to generate the risk dashboard.</p>
            </div>
          )}

          {loading && <div className="loading-state">Processing Model...</div>}

          {result && result.error && (
            <div className="error-state">{result.error}</div>
          )}

          {result && !result.error && (
            <div className="results-dashboard fade-in">
              <div className="wheel-container">
                <ProgressRing 
                  radius={100} 
                  stroke={12} 
                  progress={result.churn_risk_probability * 100} 
                  isHighRisk={result.churn_prediction === '1' || result.churn_prediction === 'Yes'} 
                />
                <h2>{result.churn_prediction === '1' || result.churn_prediction === 'Yes' ? 'High Risk of Churn' : 'Low Risk (Retain)'}</h2>
              </div>

              <div className={`insight-box ${result.churn_prediction === '1' || result.churn_prediction === 'Yes' ? 'high-risk-insight' : 'low-risk-insight'}`}>
                <h4>💡 AI Insight</h4>
                <p>{result.reason}</p>
              </div>

              <div className="metrics-container">
                <h3>Top Impact Metrics</h3>
                <p className="metrics-subtitle">Global model features driving this analysis</p>
                <div className="metrics-list">
                  {result.top_factors.map((factor, index) => (
                    <div className="metric-item" key={index}>
                      <span className="metric-name">{factor.feature}</span>
                      <div className="metric-bar-bg">
                        <div 
                          className="metric-bar-fill" 
                          style={{ width: `${factor.weight * 3}%`, backgroundColor: result.churn_prediction === '1' || result.churn_prediction === 'Yes' ? '#e50914' : '#2ecc71' }} 
                        ></div>
                      </div>
                      <span className="metric-value">{factor.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;