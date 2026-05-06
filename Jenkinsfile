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
    // Common macOS Node install locations for Jenkins service users.
    PATH = "/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
  }

  stages {
    stage('1. Checkout') {
      steps {
        checkout scm
      }
    }

    stage('2. Environment Info') {
      steps {
        sh 'node -v'
        sh 'npm -v'
      }
    }

    stage('3. Install Dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    stage('4. Lint (placeholder)') {
      steps {
        script {
          // Run lint only if package.json defines it.
          def hasLint = sh(
            script: "node -e \"const p=require('./package.json'); process.exit(p.scripts && p.scripts.lint ? 0 : 1)\"",
            returnStatus: true
          ) == 0
          if (hasLint) {
            sh 'npm run lint'
          } else {
            echo 'No lint script found; skipping lint stage.'
          }
        }
      }
    }

    stage('5. Unit Tests (placeholder)') {
      steps {
        script {
          // Run tests only if package.json defines a test script.
          def hasTest = sh(
            script: "node -e \"const p=require('./package.json'); process.exit(p.scripts && p.scripts.test ? 0 : 1)\"",
            returnStatus: true
          ) == 0
          if (hasTest) {
            sh 'npm test'
          } else {
            echo 'No test script found; skipping test stage.'
          }
        }
      }
    }

    stage('6. Security Audit') {
      steps {
        // Non-blocking dependency audit for visibility in CI.
        sh 'npm audit --audit-level=high || true'
      }
    }

    stage('7. Build/Sanity Check') {
      steps {
        sh 'node --check server.js'
      }
    }

    stage('8. Package & Deploy (simulated)') {
      steps {
        archiveArtifacts artifacts: 'package-lock.json', fingerprint: true
        echo 'CD placeholder: add your real deploy command here.'
      }
    }
  }
}

