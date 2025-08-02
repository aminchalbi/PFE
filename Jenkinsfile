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
            bat 'set CI=false && set ESLINT_NO_DEV_ERRORS=true && npm run build'
        }
        dir('khiwagerant') {
            bat 'set CI=false && set ESLINT_NO_DEV_ERRORS=true && npm run build'
        }
        dir('khiwacmp') {
            bat 'set CI=false && set ESLINT_NO_DEV_ERRORS=true && npm run build'
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
                        error("Build Flutter échouée")
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
                    script {
                        try {
                            bat 'pm2 start server.js --name khiwabackend'
                        } catch (err) {
                            echo "pm2 global non trouvé, tentative avec npx pm2"
                            try {
                                bat 'npx pm2 start server.js --name khiwabackend'
                            } catch (err2) {
                                error "Erreur lancement backend avec pm2 : ${err2}"
                            }
                        }
                    }
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
