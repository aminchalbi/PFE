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
                    bat 'npm install'
                }
                dir('khiwagerant') {
                    bat 'npm install'
                }
                dir('khiwacmp') {
                    bat 'npm install'
                }
            }
        }

  stage('Builder React') {
    steps {
        dir('khiwaweb') {
            bat '''
              set CI=false
              npm run build
            '''
        }
        dir('khiwagerant') {
            bat '''
              set CI=false
              npm run build
            '''
        }
        dir('khiwacmp') {
            bat '''
              set CI=false
              npm run build
            '''
        }
    }
}



        stage('Builder Flutter') {
            steps {
                script {
                    try {
                        dir('khiwaclient1') {
                            bat 'flutter pub get'
                            bat 'flutter build apk'
                        }
                        dir('comptoiristeflutter') {
                            bat 'flutter pub get'
                            bat 'flutter build apk'
                        }
                    } catch (e) {
                        echo "Erreur Flutter : ${e}"
                    }
                }
            }
        }

        stage('Installer Backend') {
            steps {
                dir('khiwabackend') {
                    bat 'npm install'
                }
            }
        }

        stage('Lancer le backend') {
            steps {
                dir('backend') {
                    bat 'pm2 start server.js --name khiwabackend || true'
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
