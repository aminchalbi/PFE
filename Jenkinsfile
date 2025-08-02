pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
        FLUTTER_HOME = '/opt/flutter' // Adapter si nécessaire
        PATH = "${env.PATH}:${env.FLUTTER_HOME}/bin"
    }

    stages {
        stage('Cloner le code') {
            steps {
                git branch: 'main', url: 'https://github.com/aminchalbi/PFE.git'
            }
        }

        stage('Installer les dépendances React') {
            steps {
                dir('khiwaweb') {
                    sh 'npm install'
                }
                dir('khwagerant') {
                    sh 'npm install'
                }
                dir('khiwacmp') {
                    sh 'npm install'
                }
            }
        }

        stage('Builder React') {
            steps {
                dir('khiwaweb') {
                    sh 'npm run build'
                }
                dir('khwagerant') {
                    sh 'npm run build'
                }
                dir('khiwacmp') {
                    sh 'npm run build'
                }
            }
        }

        stage('Builder Flutter') {
            steps {
                script {
                    try {
                        dir('khiwaclient1') {
                            sh 'flutter pub get'
                            sh 'flutter build apk'
                        }
                        dir('comptoiristeflutter') {
                            sh 'flutter pub get'
                            sh 'flutter build apk'
                        }
                    } catch (e) {
                        echo "Erreur Flutter : ${e}"
                    }
                }
            }
        }

        stage('Installer Backend') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Lancer le backend') {
            steps {
                dir('backend') {
                    sh 'pm2 start server.js --name khiwabackend || true'
                }
            }
        }

        stage('Fin') {
            steps {
                echo 'Pipeline terminé avec succès ✅'
            }
        }
    }

    post {
        failure {
            echo '🚨 Une erreur est survenue pendant le pipeline.'
        }
    }
}
