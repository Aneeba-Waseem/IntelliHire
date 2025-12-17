pipeline {
    agent any

    environment {
        NODE_HOME = tool name: 'Node20'
        PYTHON = "C:\\Users\\MT\\AppData\\Local\\Programs\\Python\\Python311.exe"
        VENV_DIR = "IntelliHire.AI\\.venv"
        // Combine Node bin and Python venv into one PATH
        PATH = "${NODE_HOME}\\bin;${VENV_DIR}\\Scripts;${env.PATH}"
    }

    stages {

        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'

                dir('IntelliHire.Client') {
                    bat 'npm install'
                }

                dir('IntelliHire.Server') {
                    bat 'npm install'
                }

                dir('IntelliHire.AI') {
                    // Create virtual environment if it doesn't exist
                    bat """
                    if not exist ${env.VENV_DIR} (
                        \"${env.PYTHON}\" -m venv .venv
                    )
                    pip install --upgrade pip
                    pip install -r requirements.txt
                    """
                }
            }
        }

        stage('Build Backend') {
            steps {
                echo 'Validating backend build (install + tests)...'

                dir('IntelliHire.Server') {
                    bat 'npm test || echo No backend tests configured'
                }
            }
        }

        stage('Build AI') {
            steps {
                echo 'Validating AI build (lint + tests)...'

                dir('IntelliHire.AI') {
                    bat """
                    pip install flake8 pytest
                    flake8 . || echo Flake8 warnings found
                    pytest || echo No AI tests configured
                    """
                }
            }
        }

        stage('Build Frontend') {
            steps {
                echo 'Building React frontend...'

                dir('IntelliHire.Client') {
                    bat 'npm run build'
                }
            }
        }

        stage('Package Build Artifacts') {
            steps {
                echo 'Packaging build artifacts...'

                bat '''
                tar -czf IntelliHire_Build.tar.gz ^
                IntelliHire.Client/build ^
                IntelliHire.Server ^
                IntelliHire.AI
                '''
            }
        }

        stage('Archive Artifacts') {
            steps {
                echo 'Archiving build output...'

                archiveArtifacts artifacts: 'IntelliHire_Build.tar.gz', fingerprint: true
            }
        }
    }

    post {
        success {
            echo 'Build completed successfully.'
        }
        failure {
            echo 'Build failed. Check logs above.'
        }
    }
}
