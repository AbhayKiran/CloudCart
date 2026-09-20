pipeline {
    agent any
    environment {
        REGISTRY_URL = "${env.AWS_ACCOUNT_ID}.dkr.ecr.${env.AWS_REGION}.amazonaws.com"
    }
    
    tools {
        maven 'maven'
    }

    stages {
        stage('Checkout Code') {
            steps {
		cleanWs()
                checkout scm
            }
        }
        stage('Login to AWS ECR') {
            steps {
                // Uses the AWS credentials stored in Jenkins global store
                withCredentials([aws(credentialsId: 'aws-credentials', region: "${env.AWS_REGION}")]) {
                    sh "aws ecr get-login-password --region ${env.AWS_REGION} | docker login --username AWS --password-stdin ${REGISTRY_URL}"
                }
            }
        }

	stage('Start Test Database') {
            steps {
                // We set the password to 'cloudcartpassword' (or any password you prefer) 
                // and pass it as an environment variable to Maven using withEnv
                sh '''
                    docker run -d --name test-postgres \
                    -e POSTGRES_DB=cloudcart \
                    -e POSTGRES_USER=cloudcart \
                    -e POSTGRES_PASSWORD=cloudcartpassword \
                    -p 5432:5432 \
                    postgres:15-alpine
                '''
                sleep 5
            }
        }

        stage('Build Java Artifacts') {
            steps {
                // Pass DB_PASSWORD as an environment variable to Maven so Spring Boot can connect successfully
                withEnv(['DB_PASSWORD=cloudcartpassword']) {
                    sh 'mvn clean package -f application/auth-service/pom.xml'
                    sh 'mvn clean package -f application/order-service/pom.xml'
                    sh 'mvn clean package -f application/product-service/pom.xml'
                }
            }
        }

        stage('Build & Push Microservices') {
            parallel {
                stage('Auth Service') {
                    steps {
                        sh """
                            docker build -t ${REGISTRY_URL}/auth-service:latest ./application/auth-service
                            docker push ${REGISTRY_URL}/auth-service:latest
                        """
                    }
                }
                stage('Order Service') {
                    steps {
                        sh """
                            docker build -t ${REGISTRY_URL}/order-service:latest ./application/order-service
                            docker push ${REGISTRY_URL}/order-service:latest
                        """
                    }
                }
                stage('Product Service') {
                    steps {
                        sh """
                            docker build -t ${REGISTRY_URL}/product-service:latest ./application/product-service
                            docker push ${REGISTRY_URL}/product-service:latest
                        """
                    }
                }
                stage('Frontend') {
                    steps {
                        sh """
                            docker build -t ${REGISTRY_URL}/frontend:latest ./application/frontend
                            docker push ${REGISTRY_URL}/frontend:latest
                        """
                    }
                }
            }
        }
        stage('Deploy to Kubernetes') {
            steps {
                sh """
                    kubectl apply -f k8s/postgres.yaml
                    kubectl apply -f k8s/auth-service.yaml
                    kubectl apply -f k8s/order-service.yaml
                    kubectl apply -f k8s/product-service.yaml
                    kubectl apply -f k8s/frontend.yaml
                """
            }
        }
    }
    post {
        success {
            echo 'Pipeline completed successfully and deployed to K8s cluster!'
        }
        failure {
            echo 'Pipeline failed during execution.'
        }
    }
}
