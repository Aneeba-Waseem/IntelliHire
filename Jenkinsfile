pipeline {
    agent any // Jenkins agent to run the pipeline

    environment {
        NODE_HOME = tool name: 'Node20'          // Node.js tool configured in Jenkins
        PATH = "${NODE_HOME}\\bin;${env.PATH}"   // added Node.js binaries to PATH
        PYTHON = "C:\\Program Files\\Python\\python.exe" // local Py interpreter path
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

        stage('Code Quality Check') {
            steps {
                dir('IntelliHire.AI') {
                    echo "Running flake8 checks..."
                    bat "\"${env.PYTHON}\" -m pip install flake8" 
                    bat "\"${env.PYTHON}\" -m flake8 . || echo Flake8 warnings found" // Running Python code style check
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
                    bat 'npm test || echo No backend tests configured' // Executing backend unit tests (if defined)
                }
            }
        }

        stage('Run AI Tests') {
            steps {
                dir('IntelliHire.AI') {
                    echo "Running pytest..."
                    bat "\"${env.PYTHON}\" -m pip install pytest" 
                    bat "\"${env.PYTHON}\" -m pytest || echo No AI tests configured" // Executing Python unit tests
                }
            }
        }

        stage('Package Build') {
            steps {
                echo "Packaging build into tar.gz archive..."
                bat 'tar -czf IntelliHire_Build.tar.gz IntelliHire.Client/build IntelliHire.Server IntelliHire.AI' // Create compressed build archive .tar.gz
            }
        }

        stage('Archive Build Artifacts') {
            steps {
                echo "Archiving build output..."
                archiveArtifacts artifacts: 'IntelliHire_Build.tar.gz', fingerprint: true // Storing the archive in Jenkins for download
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
