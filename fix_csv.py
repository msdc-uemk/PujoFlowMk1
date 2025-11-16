import pandas as pd

# Load your existing CSV
df = pd.read_csv("data.csv")

# Rename column 'dal' → 'pandal'
df.rename(columns={"dal": "pandal"}, inplace=True)

# Save it back (overwrite the same file or create a new one)
df.to_csv("data.csv", index=False)

print("✅ Column renamed from 'dal' to 'pandal' successfully!")
