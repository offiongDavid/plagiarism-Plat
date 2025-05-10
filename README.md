# Plagiarism platform app

This is a FastAPI-based web application. Follow the steps below to set up and run the project locally.

## 🚀 Prerequisites

- Python 3.8+
- `pip` (Python package installer)
- [virtualenv](https://virtualenv.pypa.io/en/latest/) (recommended)
- MySQL or your preferred database (if applicable)

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/offiongDavid/plagiarism-Plat.git

# Create virtual environment (if you haven't already)
python -m venv venv

# Activate it
source venv/bin/activate      # On Linux/macOS
venv\Scripts\activate         # On Windows

cd plagiarism-Plat/application

pip install -r requirements.txt

uvicorn application.main:app --reload





