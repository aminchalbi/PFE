pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
    }

    stages {
        stage('Cloner depuis GitHub') {
            steps {
                git 'https://github.com/aminchalbi/PFE.git'
            }
        }

        stage('Installer dépendances React') {
            steps {
                dir('khiwaweb') {
                    sh 'npm install'
                }
                dir('khiwagerant') {
                    sh 'npm install'
                }
                dir('khiwacmp') {
                    sh 'npm install'
                }
            }
        }

        stage('Build React apps') {
            steps {
                dir('khiwaweb') {
                    sh 'npm run build'
                }
                dir('khiwagerant') {
                    sh 'npm run build'
                }
                dir('khiwacmp') {
                    sh 'npm run build'
                }
            }
        }

        stage('Build Flutter apps') {
            steps {
                dir('comptoiristeflutter') {
                    sh 'flutter pub get'
                    sh 'flutter build apk'
                }
                dir('khiwaclient1') {
                    sh 'flutter pub get'
                    sh 'flutter build apk'
                }
            }
        }

        stage('Backend Node.js') {
            steps {
                dir('backend') { // adapte le nom si nécessaire
                    sh 'npm install'
                    sh 'node server.js &'
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
