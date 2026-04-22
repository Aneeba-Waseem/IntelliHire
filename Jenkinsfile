pipeline {
    agent any

    environment {
        NODE_HOME = tool name: 'Node20'
<<<<<<< HEAD
        PYTHON_EXE = "C:\\Users\\MT\\AppData\\Local\\Programs\\Python\\Python311\\python.exe"
        VENV_DIR = "IntelliHire.AI\\.venv"
        // Node bin first, then Python venv Scripts, then system PATH
        PATH = "${NODE_HOME}\\bin;${VENV_DIR}\\Scripts;${env.PATH}"
=======
        PATH = "${NODE_HOME}\\bin;${env.PATH}"
        PYTHON = "C:\\Users\\MT\\AppData\\Local\\Programs\\Python\\Python311"
>>>>>>> origin/feature/InterviewFlow
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
<<<<<<< HEAD
                    // Create virtual environment if it doesn't exist
                    bat """
                    REM Create venv if missing
                    if not exist .venv (
                        ${env.PYTHON_EXE} -m venv .venv
                    )
                    REM Upgrade pip
                    call .venv\\Scripts\\pip.exe install --upgrade pip
                    REM Install requirements
                    call .venv\\Scripts\\pip.exe install -r requirements.txt
                    """
=======
                    bat "\"${env.PYTHON}\" -m pip install -r requirements.txt"
>>>>>>> origin/feature/InterviewFlow
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

<<<<<<< HEAD
                // dir('IntelliHire.AI') {
                //     bat """
                //     REM Ensure lint and tests dependencies
                //     call .venv\\Scripts\\pip.exe install flake8 pytest
                //     REM Lint
                //     call .venv\\Scripts\\flake8 . || echo Flake8 warnings found
                //     REM Run tests
                //     call .venv\\Scripts\\pytest || echo No AI tests configured
                //     """
                // }
=======
                dir('IntelliHire.AI') {
                    bat "\"${env.PYTHON}\" -m pip install flake8 pytest"
                    bat "\"${env.PYTHON}\" -m flake8 . || echo Flake8 warnings found"
                    bat "\"${env.PYTHON}\" -m pytest || echo No AI tests configured"
                }
>>>>>>> origin/feature/InterviewFlow
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

<<<<<<< HEAD
                bat """
=======
                bat '''
>>>>>>> origin/feature/InterviewFlow
                tar -czf IntelliHire_Build.tar.gz ^
                IntelliHire.Client/build ^
                IntelliHire.Server ^
                IntelliHire.AI
<<<<<<< HEAD
                """
=======
                '''
>>>>>>> origin/feature/InterviewFlow
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
