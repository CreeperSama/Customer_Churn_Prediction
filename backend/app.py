import pickle
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS so the frontend can communicate with this API
CORS(app)

# Load the trained model and expected feature names
with open('customer_churn_model.pkl', 'rb') as f:
    model_data = pickle.load(f)
    model = model_data['model']
    feature_names = model_data['features_names']

# Load the label encoders for categorical features
with open('encoders.pkl', 'rb') as f:
    encoders = pickle.load(f)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        input_df = pd.DataFrame([data])
        
        # Preprocess TotalCharges the exact same way as the notebook
        input_df['TotalCharges'] = input_df['TotalCharges'].replace({" ": "0.0"}).astype(float)
        input_df['MonthlyCharges'] = input_df['MonthlyCharges'].astype(float)
        input_df['tenure'] = input_df['tenure'].astype(int)
        input_df['SeniorCitizen'] = input_df['SeniorCitizen'].astype(int)

        # Apply the loaded LabelEncoders to the categorical columns
        for col, encoder in encoders.items():
            if col in input_df.columns:
                input_df[col] = encoder.transform(input_df[col])
                
        # Reorder columns to strictly match the training phase
        input_df = input_df[feature_names]

        # Generate prediction and probability
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