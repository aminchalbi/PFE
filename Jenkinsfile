pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
    }

    stages {

        stage('Installer dépendances React') {
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

        stage('Build React apps') {
            steps {
                dir('khiwaweb') {
                    bat 'npm run build'
                }
                dir('khiwagerant') {
                    bat 'npm run build'
                }
                dir('khiwacmp') {
                    bat 'npm run build'
                }
            }
        }

        stage('Build Flutter apps') {
            steps {
                dir('comptoiristeflutter') {
                    bat 'flutter pub get'
                    bat 'flutter build apk'
                }
                dir('khiwaclient1') {
                    bat 'flutter pub get'
                    bat 'flutter build apk'
                }
            }
        }

        stage('Backend Node.js') {
            steps {
                dir('backend') {
                    bat 'npm install'
                    bat 'start /B node server.js'
                }
            }
        }

        stage('Done') {
            steps {
                echo '✅ Déploiement terminé !'
            }
        }
    }
}
