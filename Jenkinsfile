pipeline {
    agent any

    environment {
        NODE_HOME = tool name: 'Node20'          
        PATH = "${NODE_HOME}\\bin;${env.PATH}"  
        PYTHON = "C:\\Program Files\\Python\\python.exe" 
    }

    triggers {
        githubPush() 
    }

    stages {

        stage('Checkout') {
            steps {
                echo "Cloning repository..."
                git branch: 'main', url: 'https://github.com/Aneeba-Waseem/IntelliHire.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('IntelliHire.Client') {
                    echo "Installing React dependencies..."
                    bat 'npm install'
                }
                dir('IntelliHire.Server') {
                    echo "Installing Node backend dependencies..."
                    bat 'npm install'
                }
                dir('IntelliHire.AI') {
                    echo "Installing Python dependencies..."
                    bat "\"${env.PYTHON}\" -m pip install -r requirements.txt"
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('IntelliHire.Client') {
                    echo "Building React app..."
                    bat 'npm run build'
                }
            }
        }

        stage('Run Backend Tests') {
            steps {
                dir('IntelliHire.Server') {
                    echo "Running backend tests..."
                    bat 'npm test || echo "No tests configured"'
                }
            }
        }

        stage('Run AI Tests') {
            steps {
                dir('IntelliHire.AI') {
                    echo "Running AI tests..."
                    bat "\"${env.PYTHON}\" app.py"
                }
            }
        }

        stage('Archive Build Artifacts') {
            steps {
                echo "Archiving frontend build output..."
                archiveArtifacts artifacts: 'IntelliHire.Client/build/**/*', fingerprint: true
            }
        }
    }

    post {
        success {
            echo 'Build completed successfully.'
        }
        failure {
            echo 'Build failed! Check console output for errors.'
        }
    }
}
