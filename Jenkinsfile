pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    NODE_ENV = 'test'
    PORT = '3000'
    SESSION_SECRET = 'jenkins-ci-not-a-secret'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'node -v'
        sh 'npm -v'
        // Prefer deterministic installs in CI
        sh 'npm ci'
      }
    }

    stage('Sanity check') {
      steps {
        // Basic syntax check (no tests exist yet)
        sh 'node --check server.js'
      }
    }

    stage('Archive') {
      steps {
        archiveArtifacts artifacts: 'package-lock.json', fingerprint: true
      }
    }
  }
}

