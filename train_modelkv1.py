import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import pickle

# ✅ Load dataset
df = pd.read_csv("pandal_crowd_11days.csv")

# Encode categorical columns
le_day = LabelEncoder()
le_pop = LabelEncoder()
le_pandal = LabelEncoder()

df['day_encoded'] = le_day.fit_transform(df['day'])
df['popularity_encoded'] = le_pop.fit_transform(df['popularity'])
df['pandal_encoded'] = le_pandal.fit_transform(df['name'])

# Features now include pandal
X = df[['pandal_encoded', 'day_encoded', 'hour', 'capacity_est', 'popularity_encoded']]
y = df['visitors']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ✅ Use Random Forest instead of Linear Regression
model = RandomForestRegressor(n_estimators=200, random_state=42)
model.fit(X_train, y_train)

# Save model + encoders
with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

with open("le_day.pkl", "wb") as f:
    pickle.dump(le_day, f)

with open("le_pop.pkl", "wb") as f:
    pickle.dump(le_pop, f)

with open("le_pandal.pkl", "wb") as f:
    pickle.dump(le_pandal, f)

print("✅ Random Forest model trained and saved!")
