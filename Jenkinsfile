pipeline {
    agent any

    // Refers to the Maven tool name configured under Manage Jenkins -> Tools
    tools {
        maven 'Maven'
    }

    environment {
        AWS_REGION     = 'eu-north-1'
        AWS_ACCOUNT_ID = '531080694855'
        CLUSTER_NAME   = 'cloudcart-eks'
        ECR_URL        = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        IMAGE_TAG      = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('ECR Login') {
            steps {
                sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URL}"
            }
        }

        stage('Compile Java Applications') {
            steps {
                script {
                    // Removed auth-service to conserve node RAM
                    def javaServices = ['product-service', 'order-service']
                    
                    javaServices.each { service ->
                        echo "Compiling ${service} using Maven..."
                        dir("application/${service}") {
                            sh 'mvn clean package -DskipTests'
                        }
                    }
                }
            }
        }

        stage('Build & Push Docker Images') {
            steps {
                script {
                    // Removed auth-service from container builds
                    def services = ['frontend', 'product-service', 'order-service']
                    
                    services.each { service ->
                        echo "Building Docker image for cloudcart-${service}..."
                        sh "docker build -t ${ECR_URL}/cloudcart-${service}:${IMAGE_TAG} -t ${ECR_URL}/cloudcart-${service}:latest ./application/${service}"
                        
                        echo "Pushing Docker image for cloudcart-${service} to ECR..."
                        sh "docker push ${ECR_URL}/cloudcart-${service}:${IMAGE_TAG}"
                        sh "docker push ${ECR_URL}/cloudcart-${service}:latest"
                    }
                }
            }
        }

        stage('Update Kubeconfig') {
            steps {
                sh "aws eks update-kubeconfig --region ${AWS_REGION} --name ${CLUSTER_NAME}"
            }
        }

        stage('Deploy PostgreSQL DB') {
            steps {
                echo 'Deploying PostgreSQL Database...'
                sh 'kubectl apply -f k8s/postgres.yaml'
                sh 'kubectl rollout status deployment/cloudcart-db --timeout=90s'
            }
        }

        stage('Deploy Microservices') {
            steps {
                echo 'Deploying Frontend and Backend Microservices...'
                sh 'kubectl apply -f k8s/backend.yaml'
                sh 'kubectl apply -f k8s/frontend.yaml'
                
                sh 'kubectl rollout restart deployment/cloudcart-frontend'
                sh 'kubectl rollout restart deployment/cloudcart-product-service'
                sh 'kubectl rollout restart deployment/cloudcart-order-service'
            }
        }

        stage('Verify Microservices Rollout') {
            steps {
                sh 'kubectl rollout status deployment/cloudcart-frontend --timeout=120s'
                sh 'kubectl rollout status deployment/cloudcart-product-service --timeout=120s'
                sh 'kubectl rollout status deployment/cloudcart-order-service --timeout=120s'
            }
        }
    }

    post {
        success {
            echo 'Deployment successful! All 4 pods (3 Microservices + 1 DB) are live on EKS.'
            sh 'kubectl get pods -o wide'
            sh 'kubectl get svc'
        }
        failure {
            echo 'Deployment failed! Checking pod status and logs...'
            sh 'kubectl get pods'
            sh 'kubectl describe pods'
        }
    }
}
