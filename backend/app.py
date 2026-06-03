import pickle
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

with open('customer_churn_model.pkl', 'rb') as f:
    model_data = pickle.load(f)
    model = model_data['model']
    feature_names = model_data['features_names']

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
        raw_data = request.json
        input_df = pd.DataFrame([raw_data])
        
        sc_val = str(input_df['SeniorCitizen'].iloc[0]).strip().lower()
        if sc_val in ['yes', '1', 'true']:
            input_df['SeniorCitizen'] = 1
        elif sc_val in ['no', '0', 'false']:
            input_df['SeniorCitizen'] = 0
        else:
            input_df['SeniorCitizen'] = pd.to_numeric(input_df['SeniorCitizen'], errors='coerce').fillna(0).astype(int)

        input_df['TotalCharges'] = pd.to_numeric(input_df['TotalCharges'].replace({" ": "0.0", "": "0.0"}), errors='coerce').fillna(0.0)
        input_df['MonthlyCharges'] = pd.to_numeric(input_df['MonthlyCharges'], errors='coerce').fillna(0.0)
        input_df['tenure'] = pd.to_numeric(input_df['tenure'], errors='coerce').fillna(0).astype(int)

        for col, mapping in category_mapping.items():
            if col in input_df.columns:
                input_df[col] = input_df[col].map(mapping).fillna(0).astype(int)
                
        input_df = input_df[feature_names]

        prediction = model.predict(input_df)
        probability = model.predict_proba(input_df)[0][1]
        is_churn = prediction[0] == 1 or prediction[0] == '1'

        importances = model.feature_importances_
        feature_imp = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)[:5]
        top_factors = [{"feature": f, "weight": round(float(w) * 100, 1)} for f, w in feature_imp]

        reasons = []
        if is_churn:
            if raw_data.get('Contract') == 'Month-to-month':
                reasons.append("they are on a flexible month-to-month contract")
            if float(raw_data.get('MonthlyCharges', 0)) > 70:
                reasons.append("their monthly charges are relatively high")
            if int(raw_data.get('tenure', 0)) <= 12:
                reasons.append("they are a relatively new customer")
            if raw_data.get('TechSupport') == 'No':
                reasons.append("they lack active tech support")
            reason_text = "This customer is at high risk of churning primarily because " + " and ".join(reasons[:2]) + "." if reasons else "Multiple underlying account factors indicate a risk of leaving."
        else:
            if raw_data.get('Contract') in ['One year', 'Two year']:
                reasons.append("they are secured by a long-term contract")
            if int(raw_data.get('tenure', 0)) > 24:
                reasons.append("they have demonstrated long-term loyalty")
            if float(raw_data.get('MonthlyCharges', 0)) < 50:
                reasons.append("their monthly charges are highly competitive")
            if raw_data.get('TechSupport') == 'Yes':
                reasons.append("they utilize active tech support")
            reason_text = "This customer is likely to stay because " + " and ".join(reasons[:2]) + "." if reasons else "Their overall account health and usage patterns suggest stability."

        result = {
            'churn_prediction': str(prediction[0]),
            'churn_risk_probability': round(float(probability), 4),
            'top_factors': top_factors,
            'reason': reason_text
        }

        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)