import pickle
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load the trained model and expected feature names
with open('customer_churn_model.pkl', 'rb') as f:
    model_data = pickle.load(f)
    model = model_data['model']
    feature_names = model_data['features_names']

# Manual mapping dictionary to replace the corrupted encoders.pkl
category_mapping = {
    'gender': {'Female': 0, 'Male': 1},
    'Partner': {'No': 0, 'Yes': 1},
    'Dependents': {'No': 0, 'Yes': 1},
    'PhoneService': {'No': 0, 'Yes': 1},
    'MultipleLines': {'No': 0, 'No phone service': 1, 'Yes': 2},
    'InternetService': {'DSL': 0, 'Fiber optic': 1, 'No': 2},
    'OnlineSecurity': {'No': 0, 'No internet service': 1, 'Yes': 2},
    'OnlineBackup': {'No': 0, 'No internet service': 1, 'Yes': 2},
    'DeviceProtection': {'No': 0, 'No internet service': 1, 'Yes': 2},
    'TechSupport': {'No': 0, 'No internet service': 1, 'Yes': 2},
    'StreamingTV': {'No': 0, 'No internet service': 1, 'Yes': 2},
    'StreamingMovies': {'No': 0, 'No internet service': 1, 'Yes': 2},
    'Contract': {'Month-to-month': 0, 'One year': 1, 'Two year': 2},
    'PaperlessBilling': {'No': 0, 'Yes': 1},
    'PaymentMethod': {'Bank transfer (automatic)': 0, 'Credit card (automatic)': 1, 'Electronic check': 2, 'Mailed check': 3}
}

@app.route('/', methods=['GET'])
def home():
    return "The Flask backend is running successfully!"

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        input_df = pd.DataFrame([data])
        
        # Handle SeniorCitizen separately
        sc_val = str(input_df['SeniorCitizen'].iloc[0]).strip().lower()
        if sc_val in ['yes', '1', 'true']:
            input_df['SeniorCitizen'] = 1
        elif sc_val in ['no', '0', 'false']:
            input_df['SeniorCitizen'] = 0
        else:
            input_df['SeniorCitizen'] = pd.to_numeric(input_df['SeniorCitizen'], errors='coerce').fillna(0).astype(int)

        # Handle numeric fields
        input_df['TotalCharges'] = pd.to_numeric(input_df['TotalCharges'].replace({" ": "0.0", "": "0.0"}), errors='coerce').fillna(0.0)
        input_df['MonthlyCharges'] = pd.to_numeric(input_df['MonthlyCharges'], errors='coerce').fillna(0.0)
        input_df['tenure'] = pd.to_numeric(input_df['tenure'], errors='coerce').fillna(0).astype(int)

        # Map categorical columns using our hardcoded dictionary
        for col, mapping in category_mapping.items():
            if col in input_df.columns:
                input_df[col] = input_df[col].map(mapping).fillna(0).astype(int)
                
        # Reorder columns to match the trained model
        input_df = input_df[feature_names]

        # Generate prediction
        prediction = model.predict(input_df)
        probability = model.predict_proba(input_df)[0][1]

        result = {
            'churn_prediction': str(prediction[0]),
            'churn_risk_probability': round(float(probability), 4)
        }

        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)