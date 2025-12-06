# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY backend/ ./backend/
COPY frontend/dist/ ./frontend/dist/
COPY launcher.py .

# Create storage directory
RUN mkdir -p /app/storage

# Set environment variables
ENV STORAGE_ROOT=/app/storage
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 30815

# Run the application
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "30815"]
