from datasets import load_dataset

# Load dataset
dataset = load_dataset("fareha123/IntelliHire-qna-Dataset")
dataset = dataset['train']
print(dataset[:1])  # check first 5 rows
