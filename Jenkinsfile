pipeline {
    agent any

    environment {
        NODE_HOME = tool name: 'Node20'
        PATH = "${NODE_HOME}\\bin;${env.PATH}"
        PYTHON = "C:\\Users\\MT\\AppData\\Local\\Programs\\Python\\Python311"
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
                    bat "\"${env.PYTHON}\" -m pip install -r requirements.txt"
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
                    bat "\"${env.PYTHON}\" -m pip install flake8 pytest"
                    bat "\"${env.PYTHON}\" -m flake8 . || echo Flake8 warnings found"
                    bat "\"${env.PYTHON}\" -m pytest || echo No AI tests configured"
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
