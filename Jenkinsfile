pipeline {
    agent any

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

        stage('Build & Push Docker Images') {
            steps {
                script {
                    def services = ['frontend', 'product-service', 'order-service', 'auth-service']
                    
                    services.each { service ->
                        echo "Building Docker image for cloudcart-${service}..."
                        // Updated build path to include application directory
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
                
                // Force Kubernetes to pull the newly built images
                sh 'kubectl rollout restart deployment/cloudcart-frontend'
                sh 'kubectl rollout restart deployment/cloudcart-product-service'
                sh 'kubectl rollout restart deployment/cloudcart-order-service'
                sh 'kubectl rollout restart deployment/cloudcart-auth-service'
            }
        }

        stage('Verify Microservices Rollout') {
            steps {
                sh 'kubectl rollout status deployment/cloudcart-frontend --timeout=120s'
                sh 'kubectl rollout status deployment/cloudcart-product-service --timeout=120s'
                sh 'kubectl rollout status deployment/cloudcart-order-service --timeout=120s'
                sh 'kubectl rollout status deployment/cloudcart-auth-service --timeout=120s'
            }
        }
    }

    post {
        success {
            echo 'Deployment successful! All 5 pods (4 Microservices + 1 DB) are live on EKS.'
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
